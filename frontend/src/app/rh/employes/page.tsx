'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interfaces pour le typage TypeScript
interface Employe {
  matricule: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  fonction: string;
  soldeConge: number;
  dateEmbauche: string;
  idStructure: number;
  superieur_id: string | null;
  structure?: {
    idStructure: number;
    nom: string;
    type: string;
  };
  superieur?: {
    matricule: string;
    nom: string;
    prenom: string;
  };
  user?: {
    idUtilisateur: number;
    email: string;
    role: string;
    password_temp?: string;
    must_change_password?: boolean;
  };
}

interface Structure {
  idStructure: number;
  nom: string;
  type: string;
}

interface FormDataEmploye {
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  fonction: string;
  soldeConge: number;
  dateEmbauche: string;
  idStructure: number;
  superieur_id: string;
}

interface FormDataUtilisateur {
  matricule_employe: string;
  email: string;
  role: 'employe' | 'superieur' | 'rh' | 'admin';
  genererMotDePasse: boolean;
  motDePasse: string;
}

// Mapping des codes de fonction pour le matricule
const FONCTION_CODES: { [key: string]: string } = {
  // Direction
  'Directeur Général': 'DG',
  'Directeur Adjoint': 'DA',
  
  // RH
  'Responsable RH': 'RH',
  'Assistant RH': 'ARH',
  
  // Informatique
  'Responsable IT': 'IT',
  'Développeur': 'DEV',
  'Technicien Support': 'TECH',
  'Administrateur Réseau': 'NET',
  
  // Comptabilité
  'Responsable Comptabilité': 'COMPTA',
  'Comptable': 'COMPTA',
  'Assistant Comptable': 'ACPT',
  
  // Commercial
  'Responsable Commercial': 'COMM',
  'Commercial': 'COMM',
  
  // Production
  'Responsable Production': 'PROD',
  'Technicien Production': 'TPROD',
  
  // Par défaut - premières lettres
  'default': 'EMP'
};

type SortField = 'nom' | 'prenom' | 'fonction' | 'structure' | 'matricule' | 'dateEmbauche' | 'email' | 'role';
type SortOrder = 'asc' | 'desc';
type ActiveTab = 'employes' | 'utilisateurs';

export default function GestionUtilisateurs() {
  const { user } = useAuth();
  const router = useRouter();
  
  // États principaux
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [superieurs, setSuperieurs] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('employes');
  
  // États pour les modales
  const [dialogEmployeOpen, setDialogEmployeOpen] = useState(false);
  const [dialogUtilisateurOpen, setDialogUtilisateurOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  
  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStructure, setFilterStructure] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // États pour le tri
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // États pour les mots de passe temporaires
  const [showTempPassword, setShowTempPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState<{employe: string, password: string} | null>(null);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // États pour les formulaires
  const [formDataEmploye, setFormDataEmploye] = useState<FormDataEmploye>({
    nom: '',
    prenom: '',
    sexe: 'M',
    fonction: '',
    soldeConge: 25,
    dateEmbauche: new Date().toISOString().split('T')[0],
    idStructure: 0,
    superieur_id: ''
  });

  const [formDataUtilisateur, setFormDataUtilisateur] = useState<FormDataUtilisateur>({
    matricule_employe: '',
    email: '',
    role: 'employe',
    genererMotDePasse: true,
    motDePasse: ''
  });

  const [editing, setEditing] = useState(false);
  const [generatedMatricule, setGeneratedMatricule] = useState('');

  // Chargement des données au montage du composant
  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, router]);

  // Fonction pour charger toutes les données
  const loadData = async () => {
    try {
      setLoading(true);
      const [employesRes, structuresRes] = await Promise.all([
        axios.get('rh/employes'),
        axios.get('rh/structures')
      ]);

      if (employesRes.data.success) {
        setEmployes(employesRes.data.employes || []);
      } else {
        throw new Error(employesRes.data.message);
      }

      if (structuresRes.data.success) {
        setStructures(structuresRes.data.structures || []);
      } else {
        throw new Error(structuresRes.data.message);
      }
      
      // Filtrer les supérieurs (ceux qui peuvent être supérieurs hiérarchiques)
      const superieursList = employesRes.data.employes.filter((emp: Employe) => 
        emp.user?.role === 'superieur' || emp.user?.role === 'rh' || emp.user?.role === 'admin'
      );
      setSuperieurs(superieursList);
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour générer le matricule automatiquement
  const genererMatriculeAutomatique = (fonction: string, dateEmbauche: string) => {
    const codeFonction = FONCTION_CODES[fonction] || 
      fonction.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
    
    const anneeEmbauche = new Date(dateEmbauche).getFullYear();
    
    const employesMemeAnnee = employes.filter(emp => 
      new Date(emp.dateEmbauche).getFullYear() === anneeEmbauche &&
      emp.matricule.startsWith(codeFonction)
    );
    
    const numero = (employesMemeAnnee.length + 1).toString().padStart(3, '0');
    
    return `${codeFonction}${anneeEmbauche}${numero}`;
  };

  // Obtenir les fonctions disponibles par structure
  const getFonctionsParStructure = () => {
    const fonctionsParStructure: { [key: number]: string[] } = {};
    
    structures.forEach(structure => {
      const fonctions = employes
        .filter(emp => emp.idStructure === structure.idStructure)
        .map(emp => emp.fonction)
        .filter((fonction, index, self) => self.indexOf(fonction) === index);
      
      const fonctionsParDefaut = getFonctionsParDefaut(structure.type);
      const toutesFonctions = [...new Set([...fonctions, ...fonctionsParDefaut])];
      
      fonctionsParStructure[structure.idStructure] = toutesFonctions.sort();
    });
    
    return fonctionsParStructure;
  };

  // Fonctions par défaut selon le type de structure
  const getFonctionsParDefaut = (typeStructure: string) => {
    switch (typeStructure) {
      case 'Direction':
        return ['Directeur Général', 'Directeur Adjoint', 'Secrétaire de Direction'];
      case 'Département':
        return ['Responsable de Département', 'Chef de Service', 'Collaborateur'];
      case 'Service':
        return ['Responsable de Service', 'Technicien', 'Assistant', 'Agent'];
      default:
        return ['Collaborateur'];
    }
  };

  // Déterminer automatiquement le supérieur hiérarchique
  const getSuperieurAutomatique = (idStructure: number): string => {
    const structure = structures.find(s => s.idStructure === idStructure);
    if (!structure) return '';

    if (structure.nom === 'Direction Générale') {
      return '';
    }

    // Chercher un responsable dans la même structure
    const responsable = employes.find(emp => 
      emp.idStructure === idStructure && 
      (emp.fonction.includes('Responsable') || emp.fonction.includes('Chef') || emp.fonction.includes('Directeur')) &&
      (emp.user?.role === 'superieur' || emp.user?.role === 'rh' || emp.user?.role === 'admin')
    );

    if (responsable) {
      return responsable.matricule;
    }

    // Sinon, prendre le directeur général
    const directeur = employes.find(emp => emp.fonction === 'Directeur Général');
    return directeur?.matricule || '';
  };

  // Afficher temporairement le mot de passe
  const showPasswordTemporarily = (matricule: string) => {
    setShowTempPassword(matricule);
    setTimeout(() => {
      setShowTempPassword('');
    }, 10000); // 10 secondes
  };

  // Réinitialiser le mot de passe d'un utilisateur
  const reinitialiserMotDePasse = async (employe: Employe) => {
    try {
      const response = await axios.post(`rh/employes/${employe.matricule}/reset-password`);
      if (response.data.success) {
        setTempPasswordData({
          employe: `${employe.prenom} ${employe.nom}`,
          password: response.data.tempPassword
        });
        setShowPasswordModal(true);
        setSuccess('Mot de passe réinitialisé avec succès');
        loadData();
      }
    } catch (error: any) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  // Créer un compte utilisateur pour un employé
  const creerCompteUtilisateur = async (employe: Employe) => {
    try {
      // Générer un email par défaut
      const email = `${employe.prenom.toLowerCase()}.${employe.nom.toLowerCase()}@spat.com`;
      
      const response = await axios.post('rh/utilisateurs', {
        matricule_employe: employe.matricule,
        email: email,
        role: 'employe',
        genererMotDePasse: true
      });

      if (response.data.success) {
        setTempPasswordData({
          employe: `${employe.prenom} ${employe.nom}`,
          password: response.data.tempPassword
        });
        setShowPasswordModal(true);
        setSuccess('Compte utilisateur créé avec succès');
        loadData();
      }
    } catch (error: any) {
      setError('Erreur lors de la création du compte utilisateur');
    }
  };

  // Filtrer et trier les données selon l'onglet actif
  const getFilteredData = () => {
    let data = activeTab === 'employes' 
      ? employes 
      : employes.filter(emp => emp.user); // Seulement les employés avec compte utilisateur

    // Filtre de recherche
    data = data.filter(item => {
      const matchesSearch = 
        item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fonction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.user?.email && item.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStructure = filterStructure === 'all' || 
        item.idStructure.toString() === filterStructure;

      return matchesSearch && matchesStructure;
    });

    // Tri
    data.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nom':
          aValue = a.nom.toLowerCase();
          bValue = b.nom.toLowerCase();
          break;
        case 'prenom':
          aValue = a.prenom.toLowerCase();
          bValue = b.prenom.toLowerCase();
          break;
        case 'fonction':
          aValue = a.fonction.toLowerCase();
          bValue = b.fonction.toLowerCase();
          break;
        case 'structure':
          aValue = a.structure?.nom.toLowerCase() || '';
          bValue = b.structure?.nom.toLowerCase() || '';
          break;
        case 'matricule':
          aValue = a.matricule.toLowerCase();
          bValue = b.matricule.toLowerCase();
          break;
        case 'dateEmbauche':
          aValue = new Date(a.dateEmbauche);
          bValue = new Date(b.dateEmbauche);
          break;
        case 'email':
          aValue = a.user?.email.toLowerCase() || '';
          bValue = b.user?.email.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.user?.role.toLowerCase() || '';
          bValue = b.user?.role.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  };

  const filteredData = getFilteredData();

  // Calcul de la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Réinitialiser les formulaires
  const resetFormEmploye = () => {
    setFormDataEmploye({
      nom: '',
      prenom: '',
      sexe: 'M',
      fonction: '',
      soldeConge: 25,
      dateEmbauche: new Date().toISOString().split('T')[0],
      idStructure: structures[0]?.idStructure || 0,
      superieur_id: ''
    });
    setGeneratedMatricule('');
    setEditing(false);
    setSelectedEmploye(null);
  };

  const resetFormUtilisateur = () => {
    setFormDataUtilisateur({
      matricule_employe: '',
      email: '',
      role: 'employe',
      genererMotDePasse: true,
      motDePasse: ''
    });
  };

  // Ouvrir les modales
  const handleOpenDialogEmploye = (employe?: Employe) => {
    if (employe) {
      setFormDataEmploye({
        nom: employe.nom,
        prenom: employe.prenom,
        sexe: employe.sexe,
        fonction: employe.fonction,
        soldeConge: employe.soldeConge,
        dateEmbauche: employe.dateEmbauche.split('T')[0],
        idStructure: employe.idStructure,
        superieur_id: employe.superieur_id || ''
      });
      setGeneratedMatricule(employe.matricule);
      setEditing(true);
      setSelectedEmploye(employe);
    } else {
      resetFormEmploye();
    }
    setDialogEmployeOpen(true);
  };

  const handleOpenDialogUtilisateur = (employe: Employe) => {
    setFormDataUtilisateur({
      matricule_employe: employe.matricule,
      email: `${employe.prenom.toLowerCase()}.${employe.nom.toLowerCase()}@spat.com`,
      role: 'employe',
      genererMotDePasse: true,
      motDePasse: ''
    });
    setSelectedEmploye(employe);
    setDialogUtilisateurOpen(true);
  };

  // Soumettre les formulaires
  const handleSubmitEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let dataToSubmit: any = { ...formDataEmploye };
      
      if (!editing) {
        // Génération automatique du matricule pour les nouveaux employés
        const matriculeGenere = genererMatriculeAutomatique(formDataEmploye.fonction, formDataEmploye.dateEmbauche);
        dataToSubmit.matricule = matriculeGenere;
        dataToSubmit.superieur_id = getSuperieurAutomatique(formDataEmploye.idStructure);
      } else {
        dataToSubmit.matricule = selectedEmploye?.matricule;
      }

      if (editing) {
        const response = await axios.put(`rh/employes/${selectedEmploye?.matricule}`, dataToSubmit);
        if (response.data.success) {
          setSuccess('Employé mis à jour avec succès');
        } else {
          throw new Error(response.data.message);
        }
      } else {
        const response = await axios.post('rh/employes', dataToSubmit);
        if (response.data.success) {
          setSuccess('Employé créé avec succès');
        } else {
          throw new Error(response.data.message);
        }
      }
      
      setDialogEmployeOpen(false);
      resetFormEmploye();
      loadData();
    } catch (error: any) {
      console.error('Erreur sauvegarde employé:', error);
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        setError(errors.join(', '));
      } else {
        setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      }
    }
  };

  const handleSubmitUtilisateur = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('rh/utilisateurs', formDataUtilisateur);
      
      if (response.data.success) {
        if (response.data.tempPassword) {
          setTempPasswordData({
            employe: `${selectedEmploye?.prenom} ${selectedEmploye?.nom}`,
            password: response.data.tempPassword
          });
          setShowPasswordModal(true);
        }
        setSuccess('Compte utilisateur créé avec succès');
        setDialogUtilisateurOpen(false);
        resetFormUtilisateur();
        loadData();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        setError(errors.join(', '));
      } else {
        setError(error.response?.data?.message || 'Erreur lors de la création du compte');
      }
    }
  };

  // Gestion des changements de structure
  const handleStructureChange = (idStructure: string) => {
    const newIdStructure = parseInt(idStructure);
    const superieurAuto = getSuperieurAutomatique(newIdStructure);
    
    setFormDataEmploye(prev => ({
      ...prev,
      idStructure: newIdStructure,
      superieur_id: superieurAuto,
      fonction: ''
    }));
  };

  // Gestion du changement de fonction pour générer le matricule
  const handleFonctionChange = (fonction: string) => {
    setFormDataEmploye(prev => ({ ...prev, fonction }));
    
    // Générer le matricule en temps réel si tous les champs sont remplis
    if (fonction && formDataEmploye.dateEmbauche && !editing) {
      const matriculeGenere = genererMatriculeAutomatique(fonction, formDataEmploye.dateEmbauche);
      setGeneratedMatricule(matriculeGenere);
    }
  };

  // Gestion du tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Retour à la première page après tri
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Générer email automatiquement
  const genererEmail = () => {
    if (selectedEmploye) {
      const email = `${selectedEmploye.prenom.toLowerCase()}.${selectedEmploye.nom.toLowerCase()}@spat.com`;
      setFormDataUtilisateur(prev => ({ ...prev, email }));
    }
  };

  const fonctionsParStructure = getFonctionsParStructure();

  if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestion des Utilisateurs</h1>
                <p className="text-sm text-muted-foreground">
                  Gérez les employés et leurs comptes utilisateurs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleOpenDialogEmploye()}
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvel Employé
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Messages d'alerte */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employes" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Employés ({employes.length})
            </TabsTrigger>
            <TabsTrigger value="utilisateurs" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Comptes Utilisateurs ({employes.filter(emp => emp.user).length})
            </TabsTrigger>
          </TabsList>

          {/* Contenu des onglets */}
          <TabsContent value="employes">
            <Card>
              <CardHeader>
                <CardTitle>Liste des Employés</CardTitle>
                <CardDescription>
                  {filteredData.length} employé(s) trouvé(s) - Page {currentPage} sur {totalPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtres et recherche */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Input
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Select value={filterStructure} onValueChange={setFilterStructure}>
                    <SelectTrigger className="w-full sm:w-40 text-sm">
                      <SelectValue placeholder="Toutes les structures" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les structures</SelectItem>
                      {structures.map((structure) => (
                        <SelectItem key={structure.idStructure} value={structure.idStructure.toString()}>
                          {structure.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun employé trouvé
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20 cursor-pointer hover:bg-accent" onClick={() => handleSort('matricule')}>
                              <div className="flex items-center gap-1 text-xs">
                                Matricule {getSortIcon('matricule')}
                              </div>
                            </TableHead>
                            <TableHead className="w-40 cursor-pointer hover:bg-accent" onClick={() => handleSort('nom')}>
                              <div className="flex items-center gap-1 text-xs">
                                Nom & Prénom {getSortIcon('nom')}
                              </div>
                            </TableHead>
                            <TableHead className="w-32 cursor-pointer hover:bg-accent" onClick={() => handleSort('fonction')}>
                              <div className="flex items-center gap-1 text-xs">
                                Fonction {getSortIcon('fonction')}
                              </div>
                            </TableHead>
                            <TableHead className="w-32 cursor-pointer hover:bg-accent" onClick={() => handleSort('structure')}>
                              <div className="flex items-center gap-1 text-xs">
                                Structure {getSortIcon('structure')}
                              </div>
                            </TableHead>
                            <TableHead className="w-20 text-xs">Solde</TableHead>
                            <TableHead className="w-20 text-xs">Compte</TableHead>
                            <TableHead className="w-24 cursor-pointer hover:bg-accent" onClick={() => handleSort('dateEmbauche')}>
                              <div className="flex items-center gap-1 text-xs">
                                Embauche {getSortIcon('dateEmbauche')}
                              </div>
                            </TableHead>
                            <TableHead className="w-40 text-right text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((employe) => (
                            <TableRow key={employe.matricule} className="text-xs">
                              <TableCell className="font-mono text-xs py-2">{employe.matricule}</TableCell>
                              <TableCell className="py-2">
                                <div>
                                  <div className="font-medium text-xs">
                                    {employe.nom} {employe.prenom}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {employe.sexe === 'M' ? 'Homme' : 'Femme'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-xs truncate max-w-[120px]" title={employe.fonction}>
                                {employe.fonction}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="text-xs">
                                  {employe.structure?.nom}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={employe.soldeConge > 10 ? "default" : "destructive"} className="text-xs">
                                  {employe.soldeConge}j
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {employe.user ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Compte actif
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Sans compte
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2 text-xs">
                                {new Date(employe.dateEmbauche).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="py-2 text-right space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialogEmploye(employe)}
                                  className="h-7 text-xs px-2"
                                >
                                  Modifier
                                </Button>
                                {!employe.user && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenDialogUtilisateur(employe)}
                                    className="h-7 text-xs px-2"
                                  >
                                    Créer compte
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredData.length)} sur {filteredData.length} employés
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </Button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => paginate(page)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilisateurs">
            <Card>
              <CardHeader>
                <CardTitle>Comptes Utilisateurs</CardTitle>
                <CardDescription>
                  {filteredData.length} compte(s) utilisateur(s) trouvé(s) - Page {currentPage} sur {totalPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filtres et recherche */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Select value={filterStructure} onValueChange={setFilterStructure}>
                    <SelectTrigger className="w-full sm:w-40 text-sm">
                      <SelectValue placeholder="Toutes les structures" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les structures</SelectItem>
                      {structures.map((structure) => (
                        <SelectItem key={structure.idStructure} value={structure.idStructure.toString()}>
                          {structure.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun compte utilisateur trouvé
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20 cursor-pointer hover:bg-accent" onClick={() => handleSort('matricule')}>
                              <div className="flex items-center gap-1 text-xs">
                                Matricule {getSortIcon('matricule')}
                              </div>
                            </TableHead>
                            <TableHead className="w-40 cursor-pointer hover:bg-accent" onClick={() => handleSort('nom')}>
                              <div className="flex items-center gap-1 text-xs">
                                Nom & Prénom {getSortIcon('nom')}
                              </div>
                            </TableHead>
                            <TableHead className="w-32 cursor-pointer hover:bg-accent" onClick={() => handleSort('email')}>
                              <div className="flex items-center gap-1 text-xs">
                                Email {getSortIcon('email')}
                              </div>
                            </TableHead>
                            <TableHead className="w-32 cursor-pointer hover:bg-accent" onClick={() => handleSort('role')}>
                              <div className="flex items-center gap-1 text-xs">
                                Rôle {getSortIcon('role')}
                              </div>
                            </TableHead>
                            <TableHead className="w-32 text-xs">Mot de passe</TableHead>
                            <TableHead className="w-32 text-xs">Statut</TableHead>
                            <TableHead className="w-40 text-right text-xs">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((employe) => (
                            <TableRow key={employe.matricule} className="text-xs">
                              <TableCell className="font-mono text-xs py-2">{employe.matricule}</TableCell>
                              <TableCell className="py-2">
                                <div>
                                  <div className="font-medium text-xs">
                                    {employe.nom} {employe.prenom}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {employe.fonction}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-xs">
                                {employe.user?.email}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="secondary" className={`text-xs ${
                                  employe.user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                                  employe.user?.role === 'rh' ? 'bg-purple-100 text-purple-800' :
                                  employe.user?.role === 'superieur' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {employe.user?.role ? employe.user.role.charAt(0).toUpperCase() + employe.user.role.slice(1) : 'Employé'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {employe.user?.password_temp ? (
                                  <div className="flex items-center gap-1">
                                    <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                                      {showTempPassword === employe.matricule ? employe.user.password_temp : '••••••••'}
                                    </code>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => showPasswordTemporarily(employe.matricule)}
                                      disabled={showTempPassword === employe.matricule}
                                      className="h-6 text-xs px-2"
                                    >
                                      {showTempPassword === employe.matricule ? 'Visible' : 'Voir'}
                                    </Button>
                                  </div>
                                ) : employe.user?.must_change_password ? (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                                    À changer
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                    Défini
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={employe.user?.must_change_password ? "outline" : "default"} className="text-xs">
                                  {employe.user?.must_change_password ? 'Première connexion' : 'Actif'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 text-right space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => reinitialiserMotDePasse(employe)}
                                  className="h-7 text-xs px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                                >
                                  Réinit. MDP
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialogEmploye(employe)}
                                  className="h-7 text-xs px-2"
                                >
                                  Modifier
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredData.length)} sur {filteredData.length} comptes
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </Button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => paginate(page)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal d'affichage du mot de passe temporaire */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mot de passe généré
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                Voici le mot de passe temporaire pour <strong>{tempPasswordData?.employe}</strong> :
              </p>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-green-700">Mot de passe :</label>
                  <div className="p-2 bg-white rounded border font-mono text-sm flex items-center justify-between">
                    <span>{tempPasswordData?.password}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(tempPasswordData?.password || '')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>Important :</strong> Notez ce mot de passe. Il ne pourra plus être consulté ultérieurement.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPasswordModal(false)}>
              J'ai noté le mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout/modification employé */}
      <Dialog open={dialogEmployeOpen} onOpenChange={setDialogEmployeOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {editing ? `Modifier ${formDataEmploye.prenom} ${formDataEmploye.nom}` : 'Ajouter un nouvel employé'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editing 
                ? 'Modifiez les informations de l\'employé' 
                : 'Remplissez les informations pour créer un nouvel employé'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEmploye} className="space-y-6">
            
            {/* Section Informations Personnelles */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="flex items-center gap-1">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom"
                    value={formDataEmploye.nom}
                    onChange={(e) => setFormDataEmploye(prev => ({ ...prev, nom: e.target.value }))}
                    required
                    placeholder="Entrez le nom"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="flex items-center gap-1">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    value={formDataEmploye.prenom}
                    onChange={(e) => setFormDataEmploye(prev => ({ ...prev, prenom: e.target.value }))}
                    required
                    placeholder="Entrez le prénom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="sexe">Sexe</Label>
                  <Select value={formDataEmploye.sexe} onValueChange={(value: 'M' | 'F') => setFormDataEmploye(prev => ({ ...prev, sexe: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateEmbauche" className="flex items-center gap-1">
                    Date d'embauche <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateEmbauche"
                    type="date"
                    value={formDataEmploye.dateEmbauche}
                    onChange={(e) => setFormDataEmploye(prev => ({ ...prev, dateEmbauche: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Informations Professionnelles */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Informations Professionnelles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="structure" className="flex items-center gap-1">
                    Structure <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formDataEmploye.idStructure.toString()} 
                    onValueChange={handleStructureChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {structures.map((structure) => (
                        <SelectItem key={structure.idStructure} value={structure.idStructure.toString()}>
                          <div className="flex flex-col">
                            <span>{structure.nom}</span>
                            <span className="text-xs text-muted-foreground">{structure.type}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fonction" className="flex items-center gap-1">
                    Fonction <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formDataEmploye.fonction} 
                    onValueChange={handleFonctionChange}
                    disabled={!formDataEmploye.idStructure}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formDataEmploye.idStructure ? "Sélectionnez une fonction" : "Sélectionnez d'abord une structure"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formDataEmploye.idStructure && fonctionsParStructure[formDataEmploye.idStructure] ? (
                        fonctionsParStructure[formDataEmploye.idStructure].map((fonction) => (
                          <SelectItem key={fonction} value={fonction}>
                            {fonction}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Sélectionnez d'abord une structure
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="matricule">Matricule</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="matricule"
                      value={editing ? generatedMatricule : generatedMatricule}
                      readOnly
                      placeholder={!editing ? "Généré automatiquement" : ""}
                      className="font-mono bg-muted"
                    />
                    {!editing && (
                      <Badge variant="secondary" className="whitespace-nowrap bg-blue-100 text-blue-800">
                        Auto-généré
                      </Badge>
                    )}
                  </div>
                  {!editing && formDataEmploye.fonction && formDataEmploye.dateEmbauche && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: {FONCTION_CODES[formDataEmploye.fonction] || 'XXX'}{new Date(formDataEmploye.dateEmbauche).getFullYear()}XXX
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soldeConge">Solde de congé initial</Label>
                  <div className="relative">
                    <Input
                      id="soldeConge"
                      type="number"
                      value={formDataEmploye.soldeConge}
                      onChange={(e) => setFormDataEmploye(prev => ({ ...prev, soldeConge: parseInt(e.target.value) || 0 }))}
                      required
                      min="0"
                      max="60"
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      jours
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="superieur">Supérieur hiérarchique</Label>
                <div className="p-3 bg-muted/50 rounded-lg border mt-1">
                  {formDataEmploye.superieur_id ? (
                    superieurs.find(s => s.matricule === formDataEmploye.superieur_id) ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {superieurs.find(s => s.matricule === formDataEmploye.superieur_id)?.prenom}{' '}
                            {superieurs.find(s => s.matricule === formDataEmploye.superieur_id)?.nom}
                          </span>
                          <span className="text-muted-foreground ml-2 text-sm">
                            ({formDataEmploye.superieur_id}) - {superieurs.find(s => s.matricule === formDataEmploye.superieur_id)?.fonction}
                          </span>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Supérieur
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Directeur Général
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Aucun supérieur (Direction Générale)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogEmployeOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="min-w-24">
                {editing ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Modifier
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer l'employé
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de création de compte utilisateur */}
      <Dialog open={dialogUtilisateurOpen} onOpenChange={setDialogUtilisateurOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Créer un compte utilisateur
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Créez un compte utilisateur pour {selectedEmploye?.prenom} {selectedEmploye?.nom}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitUtilisateur} className="space-y-6">
            
            {/* Informations de l'employé */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Informations de l'employé</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Nom complet</Label>
                  <p className="font-medium">{selectedEmploye?.prenom} {selectedEmploye?.nom}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Matricule</Label>
                  <p className="font-mono font-medium">{selectedEmploye?.matricule}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fonction</Label>
                  <p className="font-medium">{selectedEmploye?.fonction}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Structure</Label>
                  <p className="font-medium">{selectedEmploye?.structure?.nom}</p>
                </div>
              </div>
            </div>

            {/* Informations du compte */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Informations du compte</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={genererEmail} className="h-8">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Générer
                    </Button>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formDataUtilisateur.email}
                    onChange={(e) => setFormDataUtilisateur(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="ex: prenom.nom@spat.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select 
                    value={formDataUtilisateur.role} 
                    onValueChange={(value: 'employe' | 'superieur' | 'rh' | 'admin') => setFormDataUtilisateur(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employe">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Employé
                        </div>
                      </SelectItem>
                      <SelectItem value="superieur">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Supérieur Hiérarchique
                        </div>
                      </SelectItem>
                      <SelectItem value="rh">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Ressources Humaines
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Administrateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="genererMotDePasse"
                    checked={formDataUtilisateur.genererMotDePasse}
                    onChange={(e) => setFormDataUtilisateur(prev => ({ 
                      ...prev, 
                      genererMotDePasse: e.target.checked,
                      motDePasse: e.target.checked ? '' : 'password123'
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="genererMotDePasse" className="text-sm font-medium text-blue-900">
                      Générer un mot de passe automatiquement
                    </Label>
                    <p className="text-xs text-blue-700 mt-1">
                      Un mot de passe sécurisé sera généré et pourra être consulté après la création du compte.
                    </p>
                  </div>
                </div>

                {!formDataUtilisateur.genererMotDePasse && (
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="motDePasse" className="text-sm font-medium text-blue-900">
                      Mot de passe personnalisé
                    </Label>
                    <Input
                      id="motDePasse"
                      type="password"
                      value={formDataUtilisateur.motDePasse}
                      onChange={(e) => setFormDataUtilisateur(prev => ({ ...prev, motDePasse: e.target.value }))}
                      placeholder="Entrez un mot de passe personnalisé"
                      required
                      className="bg-white"
                    />
                    <p className="text-xs text-blue-700">
                      Choisissez un mot de passe sécurisé. L'employé devra le changer à sa première connexion.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogUtilisateurOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="min-w-24">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer le compte
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}