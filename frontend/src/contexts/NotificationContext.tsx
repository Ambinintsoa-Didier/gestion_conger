// contexts/NotificationContext.tsx - VERSION COMPLÈTE CORRIGÉE
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Notification } from '../../types/notification';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (idNotification: number) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);

  // useCallback pour éviter les re-créations de fonction
  const fetchNotifications = useCallback(async () => {
    // Protection contre les appels trop rapprochés (anti-spam)
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) { // 2 secondes entre les appels
      console.log('🔕 Fetch notifications ignoré (trop rapide)');
      return;
    }
    lastFetchTime.current = now;

    // Ne pas charger si pas d'utilisateur connecté
    if (!user) {
      console.log('🔐 Pas d\'utilisateur connecté - notifications ignorées');
      if (isMounted.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }

    try {
      if (isMounted.current) {
        setLoading(true);
      }
      
      console.log('🔔 Chargement des notifications pour:', user.email);
      const response = await axios.get('/notifications');
      console.log('🔔 Notifications reçues:', response.data.notifications);
      
      // Protection contre undefined
      const notificationsData = response.data.notifications || [];
      
      // Vérifier si le composant est toujours monté
      if (isMounted.current) {
        setNotifications(notificationsData);
        
        // Calcule les non-lues
        const nonLues = notificationsData.filter((n: Notification) => !n.est_lu).length;
        setUnreadCount(nonLues);
        console.log(`📊 ${nonLues} notification(s) non lue(s)`);
      }
      
    } catch (error: any) {
      // Ignorer silencieusement les erreurs 404
      if (error.response?.status === 404) {
        console.log('🔕 API notifications non disponible - mode silencieux');
        if (isMounted.current) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } else if (error.response?.status === 401) {
        console.log('🔐 Token invalide - notifications ignorées');
        if (isMounted.current) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        console.error('❌ Erreur chargement notifications:', error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user]); // Dépendance sur user

  const markAsRead = async (idNotification: number) => {
    try {
      console.log('📌 Marquer notification comme lue:', idNotification);
      await axios.post(`/notifications/${idNotification}/marquer-lue`);
      // Recharge après marquer comme lu
      fetchNotifications();
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('🔕 API non disponible - action simulée');
        // Simule l'action localement
        setNotifications(prev => 
          prev.map(notif => 
            notif.idNotification === idNotification 
              ? { ...notif, est_lu: true, lu_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('❌ Erreur marquer notification lue:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('📌 Marquer toutes les notifications comme lues');
      await axios.post('/notifications/marquer-toutes-lues');
      // Recharge après tout marquer comme lu
      fetchNotifications();
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('🔕 API non disponible - action simulée');
        // Simule l'action localement
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, est_lu: true, lu_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      } else {
        console.error('❌ Erreur marquer toutes notifications lues:', error);
      }
    }
  };

  // Nettoyage au démontage
  useEffect(() => {
    isMounted.current = true;
    console.log('🎯 NotificationProvider monté');
    
    return () => {
      console.log('🎯 NotificationProvider démonté');
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Effet principal corrigé - se lance quand user change
  useEffect(() => {
    console.log('🎯 NotificationProvider - user changé:', user?.email);
    
    // Nettoyer l'ancien intervalle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Si utilisateur connecté, charger les notifications
    if (user) {
      console.log('🔔 Configuration notifications pour:', user.email);
      
      // Délayer le premier chargement après le login
      const initialTimer = setTimeout(() => {
        if (isMounted.current) {
          fetchNotifications();
        }
      }, 3000); // 3 SECONDES de délai après login
      
      // Intervalle de rafraîchissement - 60 secondes
      intervalRef.current = setInterval(() => {
        if (isMounted.current && user) {
          fetchNotifications();
        }
      }, 60000); // 60 secondes
      
      return () => {
        clearTimeout(initialTimer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Si déconnexion, vider les notifications
      console.log('👤 Utilisateur déconnecté - vidage notifications');
      if (isMounted.current) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [user, fetchNotifications]); // Dépendances correctes

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}