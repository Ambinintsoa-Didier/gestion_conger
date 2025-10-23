// components/NotificationBell.tsx - VERSION 4 NOTIFICATIONS MAX
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, CheckCircle2, Eye, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationModal } from './NotificationModal';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, markAsRead, markAllAsRead, loading } = useNotification();

  // Ferme le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      info: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50'
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAll = () => {
    setIsDropdownOpen(false); // Ferme le dropdown
    setIsModalOpen(true);     // Ouvre le modal
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bouton de notification */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "relative h-9 w-9 transition-all duration-200",
            isDropdownOpen && "bg-accent text-accent-foreground",
            unreadCount > 0 && "text-primary"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-0 animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Dropdown des notifications (version rapide) */}
        {isDropdownOpen && (
          <Card className="absolute right-0 top-12 w-80 sm:w-96 z-50 shadow-lg border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tout lire
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDropdownOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* 👇 SEULEMENT 4 NOTIFICATIONS MAXIMUM */}
                  {notifications.slice(0, 4).map((notification) => (
                    <div
                      key={notification.idNotification}
                      className={cn(
                        "p-3 cursor-pointer transition-colors hover:bg-accent",
                        !notification.est_lu ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      )}
                      onClick={() => {
                        if (!notification.est_lu) {
                          markAsRead(notification.idNotification);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {notification.titre}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        {!notification.est_lu && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 👇 LIEN "VOIR TOUT" - APPARAÎT SEULEMENT SI PLUS DE 4 NOTIFICATIONS */}
              {notifications.length > 4 && (
                <div className="p-3 border-t bg-muted/20">
                  <Button
                    variant="ghost"
                    onClick={handleViewAll}
                    className="w-full justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les {notifications.length - 4} notification(s) restante(s)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal des notifications (s'ouvre seulement via "Voir tout") */}
      <NotificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}