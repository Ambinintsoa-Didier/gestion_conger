// components/NotificationModal.tsx
'use client';

import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  CheckCircle2, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotification();

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
      info: 'border-l-blue-400 bg-blue-50/50',
      success: 'border-l-green-400 bg-green-50/50',
      warning: 'border-l-yellow-400 bg-yellow-50/50',
      error: 'border-l-red-400 bg-red-50/50'
    };
    return colors[type as keyof typeof colors] || 'border-l-gray-400 bg-gray-50/50';
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
      month: 'short' 
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] z-50 animate-in zoom-in-95 duration-200">
        <Card className="shadow-2xl border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Bell className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Mes Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 
                    ? `${unreadCount} notification(s) non lue(s)`
                    : 'Toutes vos notifications sont lues'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Tout lire
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Bell className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    Vous serez notifié ici des nouvelles activités concernant vos congés.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.idNotification}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all duration-200 group",
                        "hover:shadow-md hover:border-border/70",
                        !notification.est_lu 
                          ? "border-primary/20 bg-primary/5" 
                          : "border-border/50",
                        getTypeColor(notification.type)
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
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className={cn(
                              "text-sm font-semibold line-clamp-1",
                              !notification.est_lu ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.titre}
                            </h4>
                            {!notification.est_lu && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5 ml-2 animate-pulse"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground/80">
                              {formatDate(notification.created_at)}
                            </span>
                            {notification.entite_liee === 'conges' && (
                              <Badge variant="secondary" className="text-xs">
                                Congé
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}