<?php
// app/Http/Controllers/NotificationController.php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Récupère les notifications de l'utilisateur
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $notifications = Notification::where('idUtilisateur', $user->idUtilisateur)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'notifications' => $notifications
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération notifications:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marque une notification comme lue
     */
    public function marquerCommeLue(Request $request, $idNotification)
    {
        try {
            $user = $request->user();
            
            $notification = Notification::where('idNotification', $idNotification)
                ->where('idUtilisateur', $user->idUtilisateur)
                ->firstOrFail();

            $notification->update([
                'est_lu' => true,
                'lu_at' => now()
            ]);

            return response()->json([
                'message' => 'Notification marquée comme lue',
                'notification' => $notification
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur marquer notification lue:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du marquage de la notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marque toutes les notifications comme lues
     */
    public function marquerToutesCommeLues(Request $request)
    {
        try {
            $user = $request->user();
            
            Notification::where('idUtilisateur', $user->idUtilisateur)
                ->where('est_lu', false)
                ->update([
                    'est_lu' => true,
                    'lu_at' => now()
                ]);

            return response()->json([
                'message' => 'Toutes les notifications ont été marquées comme lues'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur marquer toutes notifications lues:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du marquage des notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    public function nombreNonLues(Request $request)
    {
        try {
            $user = $request->user();
            
            $count = Notification::where('idUtilisateur', $user->idUtilisateur)
                ->where('est_lu', false)
                ->count();

            return response()->json([
                'nombre_non_lues' => $count
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur compte notifications non lues:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du comptage des notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}