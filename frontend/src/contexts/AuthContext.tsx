'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Ajoute l'interface Employe
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

// Corrige l'interface User
interface User {
  id: number;
  email: string;
  role: string;
  nom_complet: string;
  employe?: Employe; // Rend employe optionnel
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Configuration axios
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:8000/api';
    // NE PAS utiliser withCredentials pour les APIs token-based
    // axios.defaults.withCredentials = true;
}, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/user');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erreur vérification utilisateur:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/login', { email, password });
      
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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