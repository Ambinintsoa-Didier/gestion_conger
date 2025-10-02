'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TypeConge {
  idType: number;
  nom: string;
  nombreJour: number;
}

interface StatutDemande {
  idStatut: number;
  libelle: string;
}

interface DemandeConge {
  idDemande: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  dateEnvoi: string;
  typeConge: TypeConge;
  statut: StatutDemande;
}

export default function CongesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [typesConge, setTypesConge] = useState<TypeConge[]>([]);
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [solde, setSolde] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    idType: '',
    motif: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [typesRes, demandesRes, soldeRes] = await Promise.all([
        axios.get('/conges/types'),
        axios.get('/conges'),
        axios.get('/user')
      ]);

      const soldeConge = soldeRes.data.user?.employe?.soldeConge || 30;

      setTypesConge(typesRes.data.types);
      setDemandes(demandesRes.data.demandes);
      setSolde(soldeConge);
      
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      setSolde(30);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dateDebut || !formData.dateFin || !formData.idType) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/conges', formData);
      alert('Demande de congé créée avec succès!');
      setFormData({ dateDebut: '', dateFin: '', idType: '', motif: '' });
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la demande';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Validée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Refusée': return 'bg-red-100 text-red-800 border-red-200';
      case 'En attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateJours = () => {
    if (!formData.dateDebut || !formData.dateFin) return 0;
    
    const start = new Date(formData.dateDebut);
    const end = new Date(formData.dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestion des Congés</h1>
                <p className="text-muted-foreground mt-1">
                  Solde disponible : <span className="font-semibold text-primary">{solde} jours</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">
                {user.nom_complet}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Congés</CardTitle>
              <CardDescription>
                Demander un nouveau congé ou consulter l'historique de vos demandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="nouvelle" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="nouvelle">Nouvelle Demande</TabsTrigger>
                  <TabsTrigger value="historique">Mes Demandes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="nouvelle" className="space-y-6 mt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Date de début *
                        </label>
                        <Input
                          type="date"
                          required
                          value={formData.dateDebut}
                          onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Date de fin *
                        </label>
                        <Input
                          type="date"
                          required
                          value={formData.dateFin}
                          onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                          min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {formData.dateDebut && formData.dateFin && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <p className="text-sm text-blue-800">
                            Durée du congé : <strong>{calculateJours()} jours</strong>
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Type de congé *
                      </label>
                      <Select
                        value={formData.idType}
                        onValueChange={(value) => setFormData({ ...formData, idType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type de congé" />
                        </SelectTrigger>
                        <SelectContent>
                          {typesConge.map((type) => (
                            <SelectItem key={type.idType} value={type.idType.toString()}>
                              {type.nom} {type.nombreJour > 0 && `(${type.nombreJour} jours/an)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Motif (optionnel)
                      </label>
                      <Textarea
                        value={formData.motif}
                        onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                        rows={4}
                        placeholder="Décrivez la raison de votre demande de congé..."
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground">
                        {formData.motif.length}/500 caractères
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !formData.dateDebut || !formData.dateFin || !formData.idType}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Envoi en cours...
                          </>
                        ) : (
                          'Soumettre la demande'
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="historique" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-foreground">Historique de mes demandes</h3>
                    <Button onClick={() => {
                      const nouvelleTab = document.querySelector('[data-value="nouvelle"]') as HTMLElement;
                      if (nouvelleTab) {
                        nouvelleTab.click();
                      }
                    }}>
                      Nouvelle demande
                    </Button>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : demandes.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-foreground">Aucune demande</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Vous n'avez pas encore de demande de congé.
                        </p>
                        <Button 
                          onClick={() => {
                            const nouvelleTab = document.querySelector('[data-value="nouvelle"]') as HTMLElement;
                            if (nouvelleTab) {
                              nouvelleTab.click();
                            }
                          }}
                          className="mt-4"
                        >
                          Créer une demande
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Période</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date de demande</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demandes.map((demande) => (
                            <TableRow key={demande.idDemande}>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                                </div>
                                {demande.motif && (
                                  <div className="text-sm text-muted-foreground mt-1">{demande.motif}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-foreground">
                                  {demande.typeConge?.nom || 'Type inconnu'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={getStatusColor(demande.statut?.libelle || 'Inconnu')}
                                >
                                  {demande.statut?.libelle || 'Inconnu'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(demande.dateEnvoi).toLocaleDateString('fr-FR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}