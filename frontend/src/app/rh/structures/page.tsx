// app/rh/structures/page.tsx
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Structure {
  idStructure: number;
  nom: string;
  type: 'Direction' | 'Département' | 'Service';
  employes_count?: number;
}

export default function GestionStructures() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [structureDetail, setStructureDetail] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    nom: '',
    type: 'Service' as 'Direction' | 'Département' | 'Service'
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadStructures();
  }, [user, router]);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/rh/structures');
      setStructures(response.data.structures || []);
    } catch (error: any) {
      setError('Erreur lors du chargement des structures');
    } finally {
      setLoading(false);
    }
  };

  const loadStructureDetail = async (id: number) => {
    try {
      const response = await axios.get(`/rh/structures/${id}`);
      setStructureDetail(response.data.structure);
      setDetailDialogOpen(true);
    } catch (error: any) {
      setError('Erreur lors du chargement des détails de la structure');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      type: 'Service'
    });
    setEditing(false);
    setSelectedStructure(null);
    setError('');
  };

  const handleOpenDialog = (structure?: Structure) => {
    if (structure) {
      setFormData({
        nom: structure.nom,
        type: structure.type
      });
      setEditing(true);
      setSelectedStructure(structure);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await axios.put(`/rh/structures/${selectedStructure?.idStructure}`, formData);
        setSuccess('Structure modifiée avec succès');
      } else {
        await axios.post('/rh/structures', formData);
        setSuccess('Structure créée avec succès');
      }
      
      setDialogOpen(false);
      resetForm();
      loadStructures();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (structure: Structure) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la structure "${structure.nom}" ?`)) {
      return;
    }

    try {
      await axios.delete(`/rh/structures/${structure.idStructure}`);
      setSuccess('Structure supprimée avec succès');
      loadStructures();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Direction':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Département':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Service':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Direction':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'Département':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'Service':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
    }
  };

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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Structures</h1>
                <p className="text-sm text-muted-foreground">
                  Gérer les directions, départements et services
                </p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle Structure
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Liste des Structures</CardTitle>
            <CardDescription>
              {structures.length} structure(s) organisationnelle(s) configurée(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : structures.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>Aucune structure configurée</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => handleOpenDialog()}
                >
                  Créer la première structure
                </Button>
              </div>
            ) : (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5">Structure</TableHead>
                      <TableHead className="w-1/5">Type</TableHead>
                      <TableHead className="w-1/5">Employés</TableHead>
                      <TableHead className="w-1/5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {structures.map((structure) => (
                      <TableRow key={structure.idStructure}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              {getTypeIcon(structure.type)}
                            </div>
                            <div>
                              <div className="font-medium">{structure.nom}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(structure.type)}>
                            {structure.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              {structure.employes_count || 0}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              employé(s)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadStructureDetail(structure.idStructure)}
                              className="h-8 w-8 p-0"
                              title="Détails"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(structure)}
                              className="h-8 w-8 p-0"
                              title="Modifier"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(structure)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal d'ajout/modification */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {editing ? 'Modifier la structure' : 'Nouvelle structure'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Nom de la structure
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Direction Générale, Service Informatique..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type de structure
                </Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'Direction' | 'Département' | 'Service') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direction">Direction</SelectItem>
                    <SelectItem value="Département">Département</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1 sm:flex-none"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editing ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de détails */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getTypeIcon(structureDetail?.type)}
              {structureDetail?.nom}
            </DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className={getTypeColor(structureDetail?.type)}>
                {structureDetail?.type}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {structureDetail && (
            <div className="space-y-4">
              {/* Statistiques compactes */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-blue-600">
                        {structureDetail.employes?.length || 0}
                      </div>
                      <div className="text-xs text-blue-800 font-medium">Employés</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xl font-bold text-green-600">
                        {structureDetail.employes?.filter((e: any) => e.user?.role === 'superieur').length || 0}
                      </div>
                      <div className="text-xs text-green-800 font-medium">Supérieurs</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-xl font-bold text-purple-600">
                        {structureDetail.employes?.filter((e: any) => e.user?.role === 'rh').length || 0}
                      </div>
                      <div className="text-xs text-purple-800 font-medium">RH</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des employés compacte */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Employés de la structure</CardTitle>
                  <CardDescription>
                    {structureDetail.employes?.length || 0} employé(s) dans cette structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {structureDetail.employes && structureDetail.employes.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="py-2">Employé</TableHead>
                            <TableHead className="py-2">Fonction</TableHead>
                            <TableHead className="py-2">Rôle</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {structureDetail.employes.map((employe: any) => (
                            <TableRow key={employe.matricule} className="hover:bg-muted/50">
                              <TableCell className="py-2">
                                <div>
                                  <div className="font-medium text-sm">
                                    {employe.nom} {employe.prenom}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {employe.matricule}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="text-xs">
                                  {employe.fonction}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge 
                                  variant="secondary"
                                  className={
                                    employe.user?.role === 'admin' ? 'bg-red-100 text-red-800 text-xs' :
                                    employe.user?.role === 'rh' ? 'bg-purple-100 text-purple-800 text-xs' :
                                    employe.user?.role === 'superieur' ? 'bg-blue-100 text-blue-800 text-xs' :
                                    'bg-green-100 text-green-800 text-xs'
                                  }
                                >
                                  {employe.user?.role || 'employe'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Aucun employé dans cette structure
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}