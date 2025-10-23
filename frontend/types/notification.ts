// types/notification.ts
export interface Notification {
  idNotification: number;
  idUtilisateur: number;
  titre: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entite_liee?: string;
  entite_id?: number;
  est_lu: boolean;
  lu_at?: string;
  created_at: string;
  updated_at: string;
}