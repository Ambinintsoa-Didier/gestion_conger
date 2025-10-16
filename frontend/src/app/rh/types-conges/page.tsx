// app/rh/types-conges/page.tsx
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

interface TypeConge {
  idType: number;
  nom: string;
  nombreJour: number;
}

export default function GestionTypesConges() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [types, setTypes] = useState<TypeConge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeConge | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState({
    nom: '',
    nombreJour: 25
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadTypes();
  }, [user, router]);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/rh/types-conges');
      setTypes(response.data.types || []);
    } catch (error: any) {
      setError('Erreur lors du chargement des types de congés');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      nombreJour: 25
    });
    setEditing(false);
    setSelectedType(null);
    setError('');
  };

  const handleOpenDialog = (type?: TypeConge) => {
    if (type) {
      setFormData({
        nom: type.nom,
        nombreJour: type.nombreJour
      });
      setEditing(true);
      setSelectedType(type);
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
        await axios.put(`/rh/types-conges/${selectedType?.idType}`, formData);
        setSuccess('Type de congé modifié avec succès');
      } else {
        await axios.post('/rh/types-conges', formData);
        setSuccess('Type de congé créé avec succès');
      }
      
      setDialogOpen(false);
      resetForm();
      loadTypes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (type: TypeConge) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le type "${type.nom}" ?`)) {
      return;
    }

    try {
      await axios.delete(`/rh/types-conges/${type.idType}`);
      setSuccess('Type de congé supprimé avec succès');
      loadTypes();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (nom: string) => {
    if (nom.toLowerCase().includes('annuel')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (nom.toLowerCase().includes('maladie')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    }
    if (nom.toLowerCase().includes('maternité') || nom.toLowerCase().includes('paternité')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
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
                <h1 className="text-2xl font-bold text-foreground">Types de Congés</h1>
                <p className="text-sm text-muted-foreground">
                  Gérer les différents types de congés disponibles
                </p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Type
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
            <CardTitle className="text-xl">Liste des Types de Congés</CardTitle>
            <CardDescription>
              {types.length} type(s) de congé(s) configuré(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : types.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Aucun type de congé configuré</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => handleOpenDialog()}
                >
                  Créer le premier type
                </Button>
              </div>
            ) : (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5">Type de congé</TableHead>
                      <TableHead className="w-1/5">Jours</TableHead>
                      <TableHead className="w-2/5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.map((type) => (
                      <TableRow key={type.idType}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              {getTypeIcon(type.nom)}
                            </div>
                            <div>
                              <div className="font-medium">{type.nom}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-sm">
                            {type.nombreJour} jour{type.nombreJour > 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(type)}
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
                              onClick={() => handleDelete(type)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {editing ? 'Modifier le type de congé' : 'Nouveau type de congé'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Nom du type de congé
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Congé annuel, Congé maladie, Congé maternité..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreJour" className="text-sm font-medium">
                  Nombre de jours par défaut
                </Label>
                <div className="relative">
                  <Input
                    id="nombreJour"
                    type="number"
                    value={formData.nombreJour}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreJour: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="365"
                    required
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm text-muted-foreground">jours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">
                Ce nombre de jours sera utilisé comme valeur par défaut pour les nouveaux employés.
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
    </div>
  );
}