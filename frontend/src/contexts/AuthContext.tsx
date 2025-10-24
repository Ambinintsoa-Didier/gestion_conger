// contexts/AuthContext.tsx - VERSION COMPLÈTE CORRIGÉE
'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';

interface Employe {
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  soldeConge: number;
  dateEmbauche: string;
  structure?: {
    idStructure: number;
    nom: string;
    type: string;
  };
}

interface User {
  id: number;
  email: string;
  role: string;
  nom_complet: string;
  employe?: Employe;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes publiques - accessibles sans connexion
const publicRoutes = ['/login', '/inscription', '/forgot-password'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Configuration axios globale
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:8000/api';
    
    // Intercepteur pour ajouter le token à toutes les requêtes
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs 401
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔐 Token expiré - déconnexion automatique');
          localStorage.removeItem('token');
          setUser(null);
          // Ne pas rediriger immédiatement pour éviter les boucles
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Fonction de vérification de l'utilisateur
  const checkUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔍 Vérification de l\'utilisateur avec token...');
        const response = await axios.get('/user');
        console.log('👤 Utilisateur vérifié:', response.data.user?.email);
        setUser(response.data.user);
      } else {
        console.log('🔍 Aucun token trouvé');
        setUser(null);
      }
    } catch (error: any) {
      console.error('❌ Erreur vérification utilisateur:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('✅ AuthProvider initialisé');
    }
  }, []);

  // Effet principal - vérification au démarrage
  useEffect(() => {
    console.log('🔐 AuthProvider monté - vérification initiale');
    checkUser();
  }, [checkUser]);

  // Effet de gestion des routes - CORRIGÉ
  useEffect(() => {
    // Attendre que l'authentification soit initialisée
    if (!initialized) {
      console.log('⏳ Auth non initialisée - attente...');
      return;
    }

    console.log('📍 Gestion route:', pathname, '| User:', user?.email);

    const token = localStorage.getItem('token');
    const isPublicRoute = publicRoutes.includes(pathname);
    const isRootRoute = pathname === '/';

    // CAS 1: Utilisateur NON connecté sur route PROTÉGÉE → rediriger vers login
    if (!token && !isPublicRoute && !isRootRoute) {
      console.log('🚫 Accès refusé - redirection vers login');
      router.push('/login');
      return;
    }

    // CAS 2: Utilisateur CONNECTÉ sur route PUBLIQUE (login/inscription) → rediriger vers dashboard
    if (token && user && isPublicRoute) {
      console.log('✅ Utilisateur connecté sur route publique - redirection vers dashboard');
      router.push('/dashboard');
      return;
    }

    // CAS 3: Utilisateur connecté sur route racine → rediriger vers dashboard
    if (token && user && isRootRoute) {
      console.log('🏠 Route racine - redirection vers dashboard');
      router.push('/dashboard');
      return;
    }

    // CAS 4: Utilisateur non connecté sur route racine → rediriger vers login
    if (!token && isRootRoute) {
      console.log('🏠 Route racine sans token - redirection vers login');
      router.push('/login');
      return;
    }

    console.log('📍 Route autorisée:', pathname);

  }, [pathname, user, initialized, router]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);
      
      const response = await axios.post('/login', { email, password });
      
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      console.log('✅ Connexion réussie pour:', userData.email);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Déconnexion en cours...');
      await axios.post('/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion API:', error);
    } finally {
      console.log('👋 Déconnexion utilisateur');
      localStorage.removeItem('token');
      setUser(null);
      // Rediriger vers login après déconnexion
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};