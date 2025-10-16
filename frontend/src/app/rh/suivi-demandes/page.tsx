// app/rh/suivi-demandes/page.tsx
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface DemandeConge {
  idDemande: number;
  dateDebut: string;
  dateFin: string;
  dateEnvoi: string;
  motif: string;
  idEmploye: string;
  idType: number;
  idStatut: number;
  employe?: {
    matricule: string;
    nom: string;
    prenom: string;
    fonction: string;
    structure?: {
      idStructure: number;
      nom: string;
      type: string;
    };
  };
  type_conge?: { // ✅ CORRECTION : type_conge au lieu de typeConge
    idType: number;
    nom: string;
  };
  statut?: {
    idStatut: number;
    libelle: string;
  };
}

interface Structure {
  idStructure: number;
  nom: string;
  type: string;
}

// Composant d'icônes réutilisables
const Icons = {
  Statistics: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Pending: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Approved: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Rejected: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Empty: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Cross: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Document: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
};

// ✅ COULEURS POUR LES TYPES DE CONGÉ (comme dans le calendrier)
const TYPE_CONGE_COLORS: { [key: string]: string } = {
  'Congé Annuel': '#3B82F6',
  'Congé Maladie': '#EF4444',
  'Congé Maternité': '#8B5CF6',
  'Congé Paternité': '#06B6D4',
  'Congé Sans Solde': '#6B7280',
  'Congé Exceptionnel': '#F59E0B',
  'RTT': '#10B981',
};

export default function SuiviDemandes() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Filtres
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedStructure, setSelectedStructure] = useState<string>('all');
  const [selectedTypeStructure, setSelectedTypeStructure] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'validate' | 'reject' | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [demandesRes, structuresRes] = await Promise.all([
        axios.get('/rh/demandes'),
        axios.get('/rh/structures')
      ]);
      
      console.log('Données reçues - Demandes:', demandesRes.data);
      console.log('Données reçues - Structures:', structuresRes.data);
      
      setDemandes(demandesRes.data.demandes || []);
      setStructures(structuresRes.data.structures || []);
      
    } catch (error: any) {
      console.error('Erreur détaillée:', error);
      setError('Erreur lors du chargement des données: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Validée':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Refusée':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'En attente':
        return <Icons.Clock />;
      case 'Validée':
        return <Icons.Check />;
      case 'Refusée':
        return <Icons.Cross />;
      default:
        return <Icons.Document />;
    }
  };

  // ✅ FONCTION POUR OBTENIR LA COULEUR DU TYPE DE CONGÉ
  const getTypeCongeColor = (typeCongeNom: string) => {
    return TYPE_CONGE_COLORS[typeCongeNom] || '#6B7280';
  };

  // ✅ FONCTION POUR OBTENIR LE NOM DU TYPE DE CONGÉ (avec fallback)
  const getTypeCongeNom = (demande: DemandeConge) => {
    return demande.type_conge?.nom || `Type ${demande.idType}`;
  };

  // Actions de validation pour RH/Admin
  const handleValidate = async (idDemande: number) => {
    try {
      setActionLoading(idDemande);
      await axios.post(`/rh/demandes/${idDemande}/valider`);
      setSuccess('Demande validée avec succès!');
      loadData(); // Recharger les données
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
      setValidationDialogOpen(false);
    }
  };

  const handleReject = async (idDemande: number) => {
    try {
      setActionLoading(idDemande);
      await axios.post(`/rh/demandes/${idDemande}/refuser`);
      setSuccess('Demande refusée avec succès!');
      loadData(); // Recharger les données
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
      setValidationDialogOpen(false);
    }
  };

  const openValidationDialog = (demande: DemandeConge, action: 'validate' | 'reject') => {
    setSelectedDemande(demande);
    setActionType(action);
    setValidationDialogOpen(true);
  };

  // Filtrage des données
  const filteredDemandes = demandes.filter(demande => {
    const typeCongeNom = getTypeCongeNom(demande);
    
    const matchesSearch = 
      demande.employe?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.employe?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.employe?.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeCongeNom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = selectedStatut === 'all' || 
      demande.statut?.libelle === selectedStatut;

    const matchesStructure = selectedStructure === 'all' || 
      demande.employe?.structure?.idStructure.toString() === selectedStructure;

    const matchesTypeStructure = selectedTypeStructure === 'all' || 
      demande.employe?.structure?.type === selectedTypeStructure;

    return matchesSearch && matchesStatut && matchesStructure && matchesTypeStructure;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDemandes = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);

  const handleViewDetails = (demande: DemandeConge) => {
    setSelectedDemande(demande);
    setDetailDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const canValidate = user?.role === 'admin' || user?.role === 'rh';

  if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                <Icons.Back />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Suivi des Demandes</h1>
                <p className="text-sm text-muted-foreground">
                  Gérer et valider toutes les demandes de congés
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {user.role === 'admin' ? 'Administrateur' : 'Ressources Humaines'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        {/* Filtres avancés */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Icons.Filter />
              <span className="text-sm font-medium">Filtres avancés</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Search />
                </div>
                <Input
                  placeholder="Rechercher employé, matricule ou type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Validée">Validée</SelectItem>
                  <SelectItem value="Refusée">Refusée</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTypeStructure} onValueChange={setSelectedTypeStructure}>
                <SelectTrigger>
                  <SelectValue placeholder="Type structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Direction">Direction</SelectItem>
                  <SelectItem value="Département">Département</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                <SelectTrigger>
                  <SelectValue placeholder="Structure" />
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
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{filteredDemandes.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icons.Statistics />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredDemandes.filter(d => d.statut?.libelle === 'En attente').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Icons.Pending />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Validées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredDemandes.filter(d => d.statut?.libelle === 'Validée').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icons.Approved />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Refusées</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredDemandes.filter(d => d.statut?.libelle === 'Refusée').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Icons.Rejected />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Demandes</CardTitle>
            <CardDescription>
              {filteredDemandes.length} demande(s) trouvée(s) - 
              Page {currentPage} sur {totalPages}
              {canValidate && " - Vous pouvez valider/refuser les demandes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredDemandes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icons.Empty />
                <p className="mt-3">Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Structure</TableHead>
                      <TableHead>Type de congé</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date demande</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDemandes.map((demande) => {
                      const typeCongeNom = getTypeCongeNom(demande);
                      const typeCongeColor = getTypeCongeColor(typeCongeNom);
                      
                      return (
                        <TableRow key={demande.idDemande}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {demande.employe?.nom} {demande.employe?.prenom}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {demande.employe?.matricule} • {demande.employe?.fonction}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {demande.employe?.structure ? (
                              <div>
                                <div className="text-sm font-medium">{demande.employe.structure.nom}</div>
                                <Badge variant="outline" className="text-xs">
                                  {demande.employe.structure.type}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Non assigné</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {/* ✅ BADGE AVEC COULEUR COMME DANS LE CALENDRIER */}
                            <Badge 
                              variant="outline" 
                              className="text-xs font-medium border-0 text-white"
                              style={{ 
                                backgroundColor: typeCongeColor,
                              }}
                            >
                              {typeCongeNom}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(demande.dateDebut).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              au {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {Math.ceil((new Date(demande.dateFin).getTime() - new Date(demande.dateDebut).getTime()) / (1000 * 3600 * 24)) + 1} jours
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getStatutColor(demande.statut?.libelle || '')}
                            >
                              <div className="flex items-center gap-1">
                                {getStatutIcon(demande.statut?.libelle || '')}
                                {demande.statut?.libelle}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(demande.dateEnvoi).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(demande)}
                              >
                                Détails
                              </Button>
                              {canValidate && demande.statut?.libelle === 'En attente' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => openValidationDialog(demande, 'validate')}
                                    disabled={actionLoading === demande.idDemande}
                                  >
                                    {actionLoading === demande.idDemande ? '...' : 'Valider'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openValidationDialog(demande, 'reject')}
                                    disabled={actionLoading === demande.idDemande}
                                  >
                                    {actionLoading === demande.idDemande ? '...' : 'Refuser'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t p-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, index) => (
                          <PaginationItem key={index + 1}>
                            <PaginationLink
                              onClick={() => handlePageChange(index + 1)}
                              isActive={currentPage === index + 1}
                            >
                              {index + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de détails */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              Informations complètes sur la demande de congé
            </DialogDescription>
          </DialogHeader>

          {selectedDemande && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informations Employé</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Nom complet</label>
                      <p className="text-sm font-medium">
                        {selectedDemande.employe?.nom} {selectedDemande.employe?.prenom}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Matricule</label>
                      <p className="text-sm font-mono">{selectedDemande.employe?.matricule}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Fonction</label>
                      <p className="text-sm">{selectedDemande.employe?.fonction}</p>
                    </div>
                    {selectedDemande.employe?.structure && (
                      <div>
                        <label className="text-xs text-muted-foreground">Structure</label>
                        <p className="text-sm">{selectedDemande.employe.structure.nom} ({selectedDemande.employe.structure.type})</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informations Congé</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Type de congé</label>
                      <div className="mt-1">
                        <Badge 
                          className="text-xs font-medium border-0 text-white"
                          style={{ 
                            backgroundColor: getTypeCongeColor(getTypeCongeNom(selectedDemande)),
                          }}
                        >
                          {getTypeCongeNom(selectedDemande)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Période</label>
                      <p className="text-sm">
                        Du {new Date(selectedDemande.dateDebut).toLocaleDateString('fr-FR')} au {new Date(selectedDemande.dateFin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Durée</label>
                      <p className="text-sm">
                        {Math.ceil((new Date(selectedDemande.dateFin).getTime() - new Date(selectedDemande.dateDebut).getTime()) / (1000 * 3600 * 24)) + 1} jours
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Statut</label>
                      <div className="mt-1">
                        <Badge 
                          variant="outline" 
                          className={getStatutColor(selectedDemande.statut?.libelle || '')}
                        >
                          <div className="flex items-center gap-1">
                            {getStatutIcon(selectedDemande.statut?.libelle || '')}
                            {selectedDemande.statut?.libelle}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedDemande.motif && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Motif</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDemande.motif}</p>
                  </CardContent>
                </Card>
              )}

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Icons.Info />
                  <div className="text-sm text-muted-foreground">
                    <p>Demande créée le {new Date(selectedDemande.dateEnvoi).toLocaleDateString('fr-FR')} à {new Date(selectedDemande.dateEnvoi).toLocaleTimeString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {canValidate && selectedDemande?.statut?.libelle === 'En attente' && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => openValidationDialog(selectedDemande, 'reject')}
                >
                  Refuser
                </Button>
                <Button
                  onClick={() => openValidationDialog(selectedDemande, 'validate')}
                >
                  Valider
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation validation/refus */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'validate' ? 'Valider la demande' : 'Refuser la demande'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'validate' 
                ? 'Êtes-vous sûr de vouloir valider cette demande de congé ?' 
                : 'Êtes-vous sûr de vouloir refuser cette demande de congé ?'}
            </DialogDescription>
          </DialogHeader>

          {selectedDemande && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">
                  {selectedDemande.employe?.nom} {selectedDemande.employe?.prenom}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedDemande.dateDebut).toLocaleDateString('fr-FR')} au {new Date(selectedDemande.dateFin).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getTypeCongeNom(selectedDemande)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidationDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant={actionType === 'validate' ? 'default' : 'destructive'}
              onClick={() => {
                if (actionType === 'validate' && selectedDemande) {
                  handleValidate(selectedDemande.idDemande);
                } else if (actionType === 'reject' && selectedDemande) {
                  handleReject(selectedDemande.idDemande);
                }
              }}
              disabled={actionLoading === selectedDemande?.idDemande}
            >
              {actionLoading === selectedDemande?.idDemande 
                ? 'Traitement...' 
                : actionType === 'validate' ? 'Valider' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}