<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\DemandeConge;
use App\Models\Employe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;  
class DashboardController extends Controller
{
    /**
     * Récupère les statistiques dashboard selon le rôle
     */
    public function getStats(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json(['message' => 'Aucun employé associé'], 404);
            }

            $stats = [];

            switch ($user->role) {
                case 'employe':
                    $stats = $this->getStatsEmploye($user);
                    break;
                
                case 'superieur':
                    $stats = $this->getStatsSuperieur($user);
                    break;
                
                case 'rh':
                case 'admin':
                    $stats = $this->getStatsRH($user);
                    break;
                
                default:
                    $stats = $this->getStatsEmploye($user);
            }

            return response()->json([
                'stats' => $stats,
                'role' => $user->role
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération stats dashboard:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques pour un employé
     */
    private function getStatsEmploye(User $user)
    {
        $demandes = DemandeConge::where('idEmploye', $user->employe->matricule)
            ->get();

        return [
            'solde_conge' => $user->employe->soldeConge,
            'mes_demandes_en_attente' => $demandes->where('idStatut', 1)->count(),
            'mes_demandes_approuvees' => $demandes->where('idStatut', 2)->count(),
            'mes_demandes_refusees' => $demandes->where('idStatut', 3)->count(),
            'total_mes_demandes' => $demandes->count(),
        ];
    }

    /**
     * Statistiques pour un supérieur hiérarchique
     */
    private function getStatsSuperieur(User $user)
    {
        // Récupère les subordonnés
        $subordonnes = Employe::where('superieur_id', $user->employe->matricule)
            ->pluck('matricule');

        // Demandes de l'employé lui-même
        $mesDemandes = DemandeConge::where('idEmploye', $user->employe->matricule)->get();

        // Demandes de ses subordonnés
        $demandesSubordonnes = DemandeConge::whereIn('idEmploye', $subordonnes)->get();

        return [
            'solde_conge' => $user->employe->soldeConge,
            'mes_demandes_en_attente' => $mesDemandes->where('idStatut', 1)->count(),
            'mes_demandes_approuvees' => $mesDemandes->where('idStatut', 2)->count(),
            'mes_demandes_refusees' => $mesDemandes->where('idStatut', 3)->count(),
            'total_mes_demandes' => $mesDemandes->count(),
            
            // Statistiques équipe
            'equipe_demandes_en_attente' => $demandesSubordonnes->where('idStatut', 1)->count(),
            'equipe_demandes_approuvees' => $demandesSubordonnes->where('idStatut', 2)->count(),
            'equipe_demandes_refusees' => $demandesSubordonnes->where('idStatut', 3)->count(),
            'total_equipe_demandes' => $demandesSubordonnes->count(),
            'nombre_subordonnes' => $subordonnes->count(),
        ];
    }

    /**
     * Statistiques pour RH/Admin
     */
    private function getStatsRH(User $user)
    {
        $totalEmployes = Employe::count();
        $totalDemandes = DemandeConge::count();
        
        $demandes = DemandeConge::all();

        return [
            'solde_conge' => $user->employe->soldeConge,
            
            // Statistiques globales
            'total_employes' => $totalEmployes,
            'total_demandes' => $totalDemandes,
            'total_demandes_en_attente' => $demandes->where('idStatut', 1)->count(),
            'total_demandes_approuvees' => $demandes->where('idStatut', 2)->count(),
            'total_demandes_refusees' => $demandes->where('idStatut', 3)->count(),
            
            // Mes demandes personnelles
            'mes_demandes_en_attente' => DemandeConge::where('idEmploye', $user->employe->matricule)
                ->where('idStatut', 1)->count(),
            'mes_demandes_approuvees' => DemandeConge::where('idEmploye', $user->employe->matricule)
                ->where('idStatut', 2)->count(),
            'mes_demandes_refusees' => DemandeConge::where('idEmploye', $user->employe->matricule)
                ->where('idStatut', 3)->count(),
        ];
    }
}