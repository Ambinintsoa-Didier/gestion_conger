// app/rh/jours-feries/page.tsx
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

interface JourFerie {
  idDate: number;
  date: string;
  description: string;
}

export default function GestionJoursFeries() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [joursFeries, setJoursFeries] = useState<JourFerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedJour, setSelectedJour] = useState<JourFerie | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    date: '',
    description: ''
  });

  const [importData, setImportData] = useState({
    annee: new Date().getFullYear().toString()
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadJoursFeries();
  }, [user, router, selectedAnnee]);

  const loadJoursFeries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/rh/jours-feries?annee=${selectedAnnee}`);
      setJoursFeries(response.data.joursFeries || []);
    } catch (error: any) {
      setError('Erreur lors du chargement des jours fériés');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      description: ''
    });
    setEditing(false);
    setSelectedJour(null);
    setError('');
  };

  const handleOpenDialog = (jour?: JourFerie) => {
    if (jour) {
      setFormData({
        date: jour.date.split('T')[0],
        description: jour.description
      });
      setEditing(true);
      setSelectedJour(jour);
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
        await axios.put(`/rh/jours-feries/${selectedJour?.idDate}`, formData);
        setSuccess('Jour férié modifié avec succès');
      } else {
        await axios.post('/rh/jours-feries', formData);
        setSuccess('Jour férié ajouté avec succès');
      }
      
      setDialogOpen(false);
      resetForm();
      loadJoursFeries();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (jour: JourFerie) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le jour férié "${jour.description}" ?`)) {
      return;
    }

    try {
      await axios.delete(`/rh/jours-feries/${jour.idDate}`);
      setSuccess('Jour férié supprimé avec succès');
      loadJoursFeries();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleImporter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/rh/jours-feries/importer', importData);
      setSuccess(response.data.message);
      setImportDialogOpen(false);
      loadJoursFeries();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de l\'importation');
    }
  };

  const annees = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString());

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
                <h1 className="text-2xl font-bold text-foreground">Jours Fériés</h1>
                <p className="text-sm text-muted-foreground">
                  Gérer le calendrier des jours fériés
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Importer
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </Button>
            </div>
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

        {/* Filtre par année - COMPACT */}
        <Card className="mb-6">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Label htmlFor="annee" className="text-sm font-medium whitespace-nowrap">
                  Année :
                </Label>
                <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {annees.map(annee => (
                      <SelectItem key={annee} value={annee}>
                        {annee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-xs">
                  {joursFeries.length} jour(s) férié(s)
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Calendrier {selectedAnnee}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Calendrier des Jours Fériés {selectedAnnee}</CardTitle>
            <CardDescription>
              Jours fériés configurés pour le calcul automatique des congés
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : joursFeries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Aucun jour férié configuré pour {selectedAnnee}</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => setImportDialogOpen(true)}
                >
                  Importer les jours fériés français
                </Button>
              </div>
            ) : (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Date</TableHead>
                      <TableHead className="w-2/5">Description</TableHead>
                      <TableHead className="w-1/6">Jour</TableHead>
                      <TableHead className="w-1/6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {joursFeries.map((jour) => (
                      <TableRow key={jour.idDate}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {new Date(jour.date).getDate()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm">
                                {new Date(jour.date).toLocaleDateString('fr-FR', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{jour.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {new Date(jour.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(jour)}
                              className="h-8 w-8 p-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(jour)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {editing ? 'Modifier le jour férié' : 'Nouveau jour férié'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date du jour férié
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Fête Nationale, Noël, Pâques..."
                  required
                />
              </div>
            </div>

            {formData.date && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">
                  Ce jour tombe un{' '}
                  <span className="font-medium text-foreground">
                    {new Date(formData.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}

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
                {editing ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d'importation */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importer les jours fériés
            </DialogTitle>
            <DialogDescription>
              Importez automatiquement les jours fériés français pour une année
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImporter} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="anneeImport" className="text-sm font-medium">
                Sélectionnez l'année
              </Label>
              <Select 
                value={importData.annee} 
                onValueChange={(value) => setImportData(prev => ({ ...prev, annee: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {annees.map(annee => (
                    <SelectItem key={annee} value={annee}>
                      {annee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Jours fériés français fixes :</p>
                  <p className="text-xs mt-1">
                    Nouvel An, Fête du Travail, Victoire 1945, Fête Nationale, Assomption, Toussaint, Armistice 1918, Noël.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setImportDialogOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                className="flex-1 sm:flex-none"
              >
                Importer pour {importData.annee}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}