// contexts/NotificationContext.tsx - VERSION CORRIGÉE
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Notification } from '../../types/notification';
import axios from 'axios';

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notifications');
      console.log('🔔 Notifications reçues:', response.data.notifications);
      
      // 👇 CORRECTION ICI - Protection contre undefined
      const notificationsData = response.data.notifications || [];
      setNotifications(notificationsData);
      
      // Calcule les non-lues (maintenant safe)
      const nonLues = notificationsData.filter((n: Notification) => !n.est_lu).length;
      setUnreadCount(nonLues);
      
    } catch (error: any) {
      // 👇 IGNORE SILENCIEUSEMENT LES ERREURS 404
      if (error.response?.status === 404) {
        console.log('🔕 API notifications non disponible - mode silencieux');
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Erreur chargement notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (idNotification: number) => {
    try {
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
        console.error('Erreur marquer notification lue:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
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
        console.error('Erreur marquer toutes notifications lues:', error);
      }
    }
  };

  useEffect(() => {
    console.log('🎯 Chargement initial des notifications');
    fetchNotifications();
    
    // 🔄 Recharge toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
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