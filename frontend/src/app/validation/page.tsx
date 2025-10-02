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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Employe {
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
}

interface DemandeConge {
  idDemande: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  dateEnvoi: string;
  idEmploye: string;
  idType: number;
  idStatut: number;
  typeConge?: {
    idType: number;
    nom: string;
  };
  statut?: {
    idStatut: number;
    libelle: string;
  };
  employe?: Employe;
}

export default function ValidationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [demandesAValider, setDemandesAValider] = useState<DemandeConge[]>([]);
  const [historique, setHistorique] = useState<DemandeConge[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
      
      const [aValiderRes, historiqueRes] = await Promise.all([
        axios.get('/validation/demandes'),
        axios.get('/validation/historique')
      ]);

      setDemandesAValider(aValiderRes.data.demandes || []);
      setHistorique(historiqueRes.data.demandes || []);
      
    } catch (error: any) {
      console.error('Erreur chargement données validation:', error);
      alert('Erreur lors du chargement des données de validation');
    } finally {
      setLoading(false);
    }
  };

  const validerDemande = async (idDemande: number) => {
    try {
      setActionLoading(idDemande);
      await axios.post(`/validation/valider/${idDemande}`);
      alert('Demande validée avec succès!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const refuserDemande = async (idDemande: number) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) {
      return;
    }

    try {
      setActionLoading(idDemande);
      await axios.post(`/validation/refuser/${idDemande}`);
      alert('Demande refusée avec succès!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
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

  const calculateJours = (dateDebut: string, dateFin: string) => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                <h1 className="text-2xl font-bold text-foreground">Validation des Congés</h1>
                <p className="text-muted-foreground mt-1">
                  Gestion des demandes de votre équipe
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
              <CardTitle>Validation des Congés</CardTitle>
              <CardDescription>
                Valider ou refuser les demandes de congé de votre équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="a-valider" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="a-valider">
                    À Valider
                    {demandesAValider.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                        {demandesAValider.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="historique">Historique</TabsTrigger>
                </TabsList>
                
                <TabsContent value="a-valider" className="space-y-6 mt-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : demandesAValider.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-foreground">Aucune demande à valider</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Toutes les demandes de votre équipe ont été traitées.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {demandesAValider.map((demande) => (
                        <Card key={demande.idDemande}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {demande.employe?.prenom || 'Inconnu'} {demande.employe?.nom || 'Inconnu'}
                                </h3>
                                <p className="text-muted-foreground">{demande.employe?.fonction || 'Fonction inconnue'}</p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                En attente
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Période</p>
                                <p className="font-medium text-foreground">
                                  {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ({calculateJours(demande.dateDebut, demande.dateFin)} jours)
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Type de congé</p>
                                <p className="font-medium text-foreground">
                                  {demande.typeConge?.nom || `Type ${demande.idType}`}
                                </p>
                              </div>
                            </div>

                            {demande.motif && (
                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground">Motif</p>
                                <p className="text-foreground">{demande.motif}</p>
                              </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                              <Button
                                onClick={() => refuserDemande(demande.idDemande)}
                                disabled={actionLoading === demande.idDemande}
                                variant="outline"
                              >
                                {actionLoading === demande.idDemande ? 'Traitement...' : 'Refuser'}
                              </Button>
                              <Button
                                onClick={() => validerDemande(demande.idDemande)}
                                disabled={actionLoading === demande.idDemande}
                              >
                                {actionLoading === demande.idDemande ? 'Traitement...' : 'Valider'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="historique" className="space-y-6 mt-6">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : historique.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-foreground">Aucun historique</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Aucune demande n'a encore été traitée.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employé</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date décision</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historique.map((demande) => (
                            <TableRow key={demande.idDemande}>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  {demande.employe?.prenom || 'Inconnu'} {demande.employe?.nom || 'Inconnu'}
                                </div>
                                <div className="text-sm text-muted-foreground">{demande.employe?.fonction || 'Fonction inconnue'}</div>
                              </TableCell>
                              <TableCell className="text-foreground">
                                {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-foreground">
                                {demande.typeConge?.nom || `Type ${demande.idType}`}
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