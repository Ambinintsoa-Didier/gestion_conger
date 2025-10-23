// app/dashboard/page.tsx (VERSION COMPLÈTE AMÉLIORÉE)
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { NotificationBell } from '@/components/NotificationBell';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  solde_conge: number;
  mes_demandes_en_attente: number;
  mes_demandes_approuvees: number;
  mes_demandes_refusees: number;
  total_mes_demandes?: number;
  
  equipe_demandes_en_attente?: number;
  equipe_demandes_approuvees?: number;
  equipe_demandes_refusees?: number;
  total_equipe_demandes?: number;
  nombre_subordonnes?: number;
  
  total_employes?: number;
  total_demandes?: number;
  total_demandes_en_attente?: number;
  total_demandes_approuvees?: number;
  total_demandes_refusees?: number;
  total_structures?: number;
  total_types_conges?: number;
  total_jours_feries?: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadStats();
  }, [user, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dashboard/stats');
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Erreur chargement stats:', error);
      alert('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roles: { [key: string]: string } = {
      'admin': 'Administrateur',
      'rh': 'Ressources Humaines', 
      'superieur': 'Supérieur Hiérarchique',
      'employe': 'Employé'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'rh': 'bg-purple-100 text-purple-800 border-purple-200',
      'superieur': 'bg-blue-100 text-blue-800 border-blue-200',
      'employe': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      {/* En-tête réduit */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tableau de Bord</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenue, <span className="font-semibold text-foreground">{user.nom_complet}</span>
                </p>
              </div>
              <Badge variant="secondary" className={getRoleColor(user.role)}>
                {getRoleDisplay(user.role)}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
            <NotificationBell /> {/* 👈 COMPOSANT AJOUTÉ */}
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
            >
              Déconnexion
            </Button>
          </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          
          {/* DASHBOARD EMPLOYÉ */}
          {user.role === 'employe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte Solde Congé */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solde Congé</CardTitle>
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      `${stats?.solde_conge || 0} jours`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Jours restants
                  </p>
                </CardContent>
              </Card>

              {/* Mes demandes en attente */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      stats?.mes_demandes_en_attente || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Demandes en cours
                  </p>
                </CardContent>
              </Card>

              {/* Mes demandes approuvées */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
                  <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      stats?.mes_demandes_approuvees || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Congés validés
                  </p>
                </CardContent>
              </Card>

              {/* Mes demandes refusées */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Refusées</CardTitle>
                  <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      stats?.mes_demandes_refusees || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Demandes refusées
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DASHBOARD SUPÉRIEUR HIÉRARCHIQUE */}
          {user.role === 'superieur' && stats && (
            <Tabs defaultValue="personnel" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personnel">Mes Statistiques</TabsTrigger>
                <TabsTrigger value="equipe">Mon Équipe</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personnel" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mon Solde</CardTitle>
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.solde_conge} jours
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                      <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_en_attente}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_approuvees}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Refusées</CardTitle>
                      <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_refusees}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="equipe" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Subordonnés</CardTitle>
                      <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.nombre_subordonnes}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Attente Équipe</CardTitle>
                      <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.equipe_demandes_en_attente}
                      </div>
                      <Link href="/validation" className="text-xs text-blue-600 hover:text-blue-500 mt-1 block">
                        Valider les demandes
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approuvées Équipe</CardTitle>
                      <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.equipe_demandes_approuvees}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Refusées Équipe</CardTitle>
                      <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.equipe_demandes_refusees}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* DASHBOARD RH/ADMIN AMÉLIORÉ AVEC NOUVELLES FONCTIONNALITÉS */}
          {(user.role === 'rh' || user.role === 'admin') && stats && (
            <Tabs defaultValue="global" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="global">Vue Globale</TabsTrigger>
                <TabsTrigger value="personnel">Mes Statistiques</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="global" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
                      <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.total_employes || 0}
                      </div>
                      <Link href="/rh/employes" className="text-xs text-blue-600 hover:text-blue-500 mt-1 block">
                        Gérer les employés
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
                      <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.total_structures || 0}
                      </div>
                      <Link href="/rh/structures" className="text-xs text-blue-600 hover:text-blue-500 mt-1 block">
                        Gérer les structures
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Demandes En Attente</CardTitle>
                      <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.total_demandes_en_attente || 0}
                      </div>
                      <Link href="/rh/suivi-demandes" className="text-xs text-blue-600 hover:text-blue-500 mt-1 block">
                        Voir les demandes
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taux Validation</CardTitle>
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.total_demandes && stats.total_demandes_approuvees 
                          ? Math.round((stats.total_demandes_approuvees / stats.total_demandes) * 100) 
                          : 0}%
                      </div>
                      <Link href="/rh/statistiques" className="text-xs text-blue-600 hover:text-blue-500 mt-1 block">
                        Voir les stats
                      </Link>
                    </CardContent>
                  </Card>
                </div>

              </TabsContent>

              <TabsContent value="personnel" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mon Solde</CardTitle>
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.solde_conge} jours
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mes Demandes En Attente</CardTitle>
                      <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_en_attente}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mes Demandes Approuvées</CardTitle>
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_approuvees}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mes Demandes Refusées</CardTitle>
                      <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-foreground">
                        {stats.mes_demandes_refusees}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Performance Validation</CardTitle>
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.total_demandes && stats.total_demandes_approuvees 
                          ? Math.round((stats.total_demandes_approuvees / stats.total_demandes) * 100) 
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Taux de validation global
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Demandes Récentes</CardTitle>
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.total_demandes_en_attente || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        En attente de traitement
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taux Occupation</CardTitle>
                      <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.total_employes && stats.total_demandes_approuvees
                          ? Math.round((stats.total_demandes_approuvees / (stats.total_employes * 25)) * 100)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Congés utilisés
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Section Actions Rapides - ADAPTÉE AU RÔLE AVEC NOUVELLES FONCTIONNALITÉS */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
              <CardDescription className="text-sm">
                Accédez rapidement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Actions communes à tous */}
                <Link
                  href="/conges"
                  className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                >
                  <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-foreground">Gérer mes congés</h4>
                    <p className="text-xs text-muted-foreground">Demander un congé ou consulter mes demandes</p>
                  </div>
                </Link>

                <Link
                  href="/calendrier"
                  className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                >
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-foreground">Calendrier des congés</h4>
                    <p className="text-xs text-muted-foreground">Vue globale des congés de l'équipe</p>
                  </div>
                </Link>

                {/* Actions RH/Admin */}
                {(user.role === 'admin' || user.role === 'rh') && (
                  <>
                    <Link
                      href="/rh/suivi-demandes"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Suivi Demandes</h4>
                        <p className="text-xs text-muted-foreground">Voir toutes les demandes</p>
                      </div>
                    </Link>

                    <Link
                      href="/rh/statistiques"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Statistiques</h4>
                        <p className="text-xs text-muted-foreground">Analyser les données</p>
                      </div>
                    </Link>

                    <Link
                      href="/rh/employes"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Gestion Employés</h4>
                        <p className="text-xs text-muted-foreground">Ajouter, modifier des employés</p>
                      </div>
                    </Link>

                    <Link
                      href="/rh/structures"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Structures</h4>
                        <p className="text-xs text-muted-foreground">Gérer services et départements</p>
                      </div>
                    </Link>

                    <Link
                      href="/rh/types-conges"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Types de Congés</h4>
                        <p className="text-xs text-muted-foreground">Configurer les types disponibles</p>
                      </div>
                    </Link>

                    <Link
                      href="/rh/jours-feries"
                      className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-foreground">Jours Fériés</h4>
                        <p className="text-xs text-muted-foreground">Gérer le calendrier</p>
                      </div>
                    </Link>
                  </>
                )}

                {/* Actions Supérieur */}
                {user.role === 'superieur' && (
                  <Link
                    href="/validation"
                    className="flex items-center p-3 border border-border rounded-lg hover:bg-accent hover:border-primary transition duration-200"
                  >
                    <div className="flex-shrink-0 w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-foreground">Validation Congés</h4>
                      <p className="text-xs text-muted-foreground">Approuver les demandes de mon équipe</p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}