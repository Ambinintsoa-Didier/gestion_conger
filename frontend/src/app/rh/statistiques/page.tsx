// app/rh/statistiques/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsData {
  total_employes: number;
  total_structures: number;
  total_types_conges: number;
  total_jours_feries: number;
  total_demandes: number;
  demandes_validees: number;
  demandes_refusees: number;
  demandes_en_attente: number;
  taux_validation: number;
  demandes_par_mois: Array<{
    mois: string;
    total: number;
    validees: number;
    refusees: number;
    en_attente: number;
  }>;
  types_conges_stats: Array<{
    type: string;
    count: number;
  }>;
  structures_stats: Array<{
    structure: string;
    count: number;
  }>;
}

export default function Statistiques() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    loadStats();
  }, [user, router, selectedYear]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/rh/statistiques?annee=${selectedYear}`);
      
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error);
      setError(error.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const annees = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  // Nouveau diagramme en barres verticales pour les mois
  const renderBarChart = (data: Array<{
    mois: string;
    total: number;
    validees: number;
    refusees: number;
    en_attente: number;
  }>) => {
    if (!data || data.length === 0) return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune donnée disponible pour {selectedYear}
      </div>
    );

    const maxValue = Math.max(...data.map(item => item.total));
    const chartHeight = 200;

    return (
      <div className="w-full">
        {/* Diagramme en barres */}
        <div className="flex items-end justify-between space-x-2 h-48 mt-8">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 space-y-2">
              {/* Barre principale avec segments empilés */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="relative w-full max-w-16 cursor-help transition-all duration-500 hover:opacity-90"
                    style={{ height: `${chartHeight}px` }}
                  >
                    {/* Segment validées (vert) */}
                    {item.validees > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                        style={{ 
                          height: `${(item.validees / maxValue) * chartHeight}px`,
                        }}
                      />
                    )}
                    
                    {/* Segment en attente (jaune) */}
                    {item.en_attente > 0 && (
                      <div
                        className="absolute w-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                        style={{ 
                          height: `${(item.en_attente / maxValue) * chartHeight}px`,
                          bottom: `${(item.validees / maxValue) * chartHeight}px`
                        }}
                      />
                    )}
                    
                    {/* Segment refusées (rouge) */}
                    {item.refusees > 0 && (
                      <div
                        className="absolute w-full bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                        style={{ 
                          height: `${(item.refusees / maxValue) * chartHeight}px`,
                          bottom: `${((item.validees + item.en_attente) / maxValue) * chartHeight}px`
                        }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">{item.mois}</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Validées: {item.validees}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>En attente: {item.en_attente}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Refusées: {item.refusees}</span>
                    </div>
                    <div className="border-t pt-1 font-medium">
                      Total: {item.total}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Label du mois */}
              <div className="text-xs text-muted-foreground font-medium">
                {item.mois}
              </div>
              
              {/* Valeur totale */}
              <div className="text-sm font-bold text-foreground">
                {item.total}
              </div>
            </div>
          ))}
        </div>

        {/* Axe des Y (valeurs) */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-4">
          <span>0</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>{maxValue}</span>
        </div>

        {/* Légende */}
        <div className="flex justify-center space-x-6 mt-6 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Validées</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">En attente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Refusées</span>
          </div>
        </div>
      </div>
    );
  };

  // Version alternative avec barres côte à côte
  const renderSideBySideBarChart = (data: Array<{
    mois: string;
    total: number;
    validees: number;
    refusees: number;
    en_attente: number;
  }>) => {
    if (!data || data.length === 0) return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune donnée disponible pour {selectedYear}
      </div>
    );

    const maxValue = Math.max(...data.map(item => Math.max(item.validees, item.en_attente, item.refusees)));
    const chartHeight = 200;

    return (
      <div className="w-full">
        {/* Diagramme en barres côte à côte */}
        <div className="flex items-end justify-between space-x-1 h-48 mt-8">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 space-y-2">
              <div className="flex items-end justify-center space-x-1 w-full">
                {/* Barre validées */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-1/3 bg-green-500 rounded-t cursor-help transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${(item.validees / maxValue) * chartHeight}px` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Validées: {item.validees}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Barre en attente */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-1/3 bg-yellow-500 rounded-t cursor-help transition-all duration-500 hover:bg-yellow-600"
                      style={{ height: `${(item.en_attente / maxValue) * chartHeight}px` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>En attente: {item.en_attente}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Barre refusées */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-1/3 bg-red-500 rounded-t cursor-help transition-all duration-500 hover:bg-red-600"
                      style={{ height: `${(item.refusees / maxValue) * chartHeight}px` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refusées: {item.refusees}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Label du mois */}
              <div className="text-xs text-muted-foreground font-medium">
                {item.mois}
              </div>
              
              {/* Valeur totale */}
              <div className="text-sm font-bold text-foreground">
                {item.total}
              </div>
            </div>
          ))}
        </div>

        {/* Axe des Y */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-4">
          <span>0</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>{maxValue}</span>
        </div>

        {/* Légende */}
        <div className="flex justify-center space-x-6 mt-6 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Validées</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">En attente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Refusées</span>
          </div>
        </div>
      </div>
    );
  };

  // Fonction pour générer un diagramme circulaire simple
  const renderPieChart = (data: Array<{ label: string; value: number; color: string }>) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;
    
    let currentPercent = 0;
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const circle = (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={-currentPercent}
                className="transition-all duration-1000"
              />
            );
            currentPercent += percentage;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    );
  };

  if (!user || (user.role !== 'rh' && user.role !== 'admin')) {
    return null;
  }

  return (
    <TooltipProvider>
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
                  <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
                  <p className="text-sm text-muted-foreground">
                    Analyse des données de congés
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadStats}
                      disabled={loading}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualiser
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rafraîchir les données</p>
                  </TooltipContent>
                </Tooltip>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28">
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
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {error}
                <Button variant="outline" size="sm" className="ml-4" onClick={loadStats}>
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="monthly">Par mois</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Cartes de statistiques globales avec tooltips */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {loading ? '-' : stats?.total_demandes || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Année {selectedYear}
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre total de demandes de congés pour l'année {selectedYear}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux Validation</CardTitle>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {loading ? '-' : `${stats?.taux_validation || 0}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Demandes approuvées
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pourcentage de demandes approuvées par rapport au total</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {loading ? '-' : stats?.demandes_en_attente || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          En cours de traitement
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Demandes en attente de validation par les supérieurs</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refusées</CardTitle>
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {loading ? '-' : stats?.demandes_refusees || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Demandes refusées
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Demandes refusées par les supérieurs hiérarchiques</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Diagramme circulaire des statuts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Répartition des Statuts
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <svg className="w-4 h-4 text-muted-foreground cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Distribution des demandes selon leur statut actuel</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>
                      Distribution des demandes par statut
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : stats ? (
                      <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-8">
                        {renderPieChart([
                          { label: 'Validées', value: stats.demandes_validees, color: '#10b981' },
                          { label: 'Refusées', value: stats.demandes_refusees, color: '#ef4444' },
                          { label: 'En attente', value: stats.demandes_en_attente, color: '#f59e0b' }
                        ]) || (
                          <div className="text-center py-8 text-muted-foreground">
                            Aucune donnée disponible
                          </div>
                        )}
                        <div className="space-y-3">
                          {[
                            { label: 'Validées', value: stats.demandes_validees, color: 'bg-green-500' },
                            { label: 'Refusées', value: stats.demandes_refusees, color: 'bg-red-500' },
                            { label: 'En attente', value: stats.demandes_en_attente, color: 'bg-yellow-500' }
                          ].map((item, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2 cursor-help">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                  <span className="text-sm font-medium">{item.label}</span>
                                  <span className="text-sm text-muted-foreground">({item.value})</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.label}: {item.value} demandes</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune donnée disponible
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Types de Congés les Plus Demandés
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <svg className="w-4 h-4 text-muted-foreground cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Répartition des demandes par type de congé</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>
                      Répartition par type de congé
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : stats?.types_conges_stats && stats.types_conges_stats.length > 0 ? (
                      <div className="space-y-3">
                        {stats.types_conges_stats.map((type, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between cursor-help">
                                <span className="text-sm font-medium">{type.type}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${(type.count / Math.max(...stats.types_conges_stats.map(t => t.count))) * 100}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-muted-foreground w-8 text-right">
                                    {type.count}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{type.type}: {type.count} demandes</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune donnée disponible
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Évolution Mensuelle des Demandes - {selectedYear}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <svg className="w-4 h-4 text-muted-foreground cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Diagramme en barres montrant l'évolution mensuelle avec répartition par statut</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>
                    Nombre de demandes de congés par mois avec répartition par statut
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : stats?.demandes_par_mois && stats.demandes_par_mois.length > 0 ? (
                    <div className="space-y-6">
                      {renderBarChart(stats.demandes_par_mois)}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune donnée disponible pour {selectedYear}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Répartition par Structure
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <svg className="w-4 h-4 text-muted-foreground cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Nombre de demandes par structure organisationnelle</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>
                      Nombre de demandes par structure organisationnelle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : stats?.structures_stats && stats.structures_stats.length > 0 ? (
                      <div className="space-y-3">
                        {stats.structures_stats.map((structure, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-3 border rounded-lg cursor-help hover:bg-accent transition-colors">
                                <span className="text-sm font-medium">{structure.structure}</span>
                                <Badge variant="secondary">{structure.count}</Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{structure.structure}: {structure.count} demandes</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune donnée disponible
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Indicateurs Clés
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <svg className="w-4 h-4 text-muted-foreground cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Métriques importantes pour l'analyse des performances</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>
                      Métriques importantes pour l'analyse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : stats ? (
                      <div className="space-y-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg cursor-help hover:bg-blue-100 transition-colors">
                              <span className="text-sm font-medium">Demandes moyennes/mois</span>
                              <span className="text-lg font-bold text-blue-600">
                                {Math.round(stats.total_demandes / 12)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Moyenne mensuelle: {stats.total_demandes} demandes ÷ 12 mois</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg cursor-help hover:bg-green-100 transition-colors">
                              <span className="text-sm font-medium">Taux de validation</span>
                              <span className="text-lg font-bold text-green-600">
                                {stats.taux_validation}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stats.demandes_validees} validées sur {stats.total_demandes} total</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg cursor-help hover:bg-purple-100 transition-colors">
                              <span className="text-sm font-medium">Période la plus chargée</span>
                              <span className="text-lg font-bold text-purple-600">
                                {stats.demandes_par_mois?.reduce((max, item) => item.total > max.total ? item : max, { total: 0, mois: '' }).mois || 'N/A'}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mois avec le plus grand nombre de demandes</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune donnée disponible
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}