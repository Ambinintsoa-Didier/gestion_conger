<?php
// app/Services/NotificationService.php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Crée une nouvelle notification
     */
    public static function creer(
        int $idUtilisateur,
        string $titre,
        string $message,
        string $type = 'info',
        ?string $entiteLiee = null,
        ?int $entiteId = null
    ): Notification {
        return Notification::create([
            'idUtilisateur' => $idUtilisateur,
            'titre' => $titre,
            'message' => $message,
            'type' => $type,
            'entite_liee' => $entiteLiee,
            'entite_id' => $entiteId,
            'est_lu' => false
        ]);
    }

    /**
     * Notifie un supérieur d'une nouvelle demande de congé
     */
    public static function notifierNouvelleDemandeConges($demandeConges)
    {
        try {
            $employe = $demandeConges->employe;
            
            if ($employe && $employe->superieur) {
                $superieur = $employe->superieur;
                
                if ($superieur->user) {
                    self::creer(
                        $superieur->user->idUtilisateur,
                        'Nouvelle demande de congé',
                        "{$employe->prenom} {$employe->nom} a déposé une demande de congé du " . 
                        \Carbon\Carbon::parse($demandeConges->dateDebut)->format('d/m/Y') . " au " .
                        \Carbon\Carbon::parse($demandeConges->dateFin)->format('d/m/Y'),
                        'info',
                        'conges',
                        $demandeConges->idDemande
                    );
                }
            }

            // 👇 AJOUT : Notifie les admins des nouvelles demandes
            self::notifierAdminsNouvelleDemande($demandeConges);
            
        } catch (\Exception $e) {
            Log::error('Erreur notification nouvelle demande:', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notifie un employé du changement de statut de sa demande
     */
    public static function notifierChangementStatutDemande($demandeConges)
    {
        try {
            $employe = $demandeConges->employe;
            
            if ($employe && $employe->user) {
                $statut = $demandeConges->statut->libelle;
                $typeNotification = $demandeConges->idStatut == 2 ? 'success' : 'error';
                
                self::creer(
                    $employe->user->idUtilisateur,
                    'Statut de votre demande de congé',
                    "Votre demande de congé du " . 
                    \Carbon\Carbon::parse($demandeConges->dateDebut)->format('d/m/Y') . " au " .
                    \Carbon\Carbon::parse($demandeConges->dateFin)->format('d/m/Y') . 
                    " a été {$statut}",
                    $typeNotification,
                    'conges',
                    $demandeConges->idDemande
                );
            }

            // 👇 AJOUT : Notifie les admins des changements de statut
            self::notifierAdminsChangementStatut($demandeConges);
            
        } catch (\Exception $e) {
            Log::error('Erreur notification changement statut:', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notifie la création d'un nouvel employé
     */
    public static function notifierNouvelEmploye($employe, $userCreator)
    {
        try {
            // Notifier les RH/Admin
            $rhAdmins = User::whereIn('role', ['rh', 'admin'])->get();
            
            foreach ($rhAdmins as $user) {
                if ($user->idUtilisateur != $userCreator->idUtilisateur) {
                    self::creer(
                        $user->idUtilisateur,
                        'Nouvel employé ajouté',
                        "{$employe->prenom} {$employe->nom} a été ajouté au système par {$userCreator->nom_complet}",
                        'info',
                        'employes',
                        $employe->matricule
                    );
                }
            }

            // 👇 AJOUT : Notifie spécifiquement les admins
            self::notifierAdminsNouvelEmploye($employe, $userCreator);
            
        } catch (\Exception $e) {
            Log::error('Erreur notification nouvel employé:', ['error' => $e->getMessage()]);
        }
    }

    // 👇 AJOUT DES NOUVELLES MÉTHODES POUR L'ADMIN

    /**
     * Notifie les admins des nouvelles demandes de congé
     */
    public static function notifierAdminsNouvelleDemande($demandeConges)
    {
        try {
            $employe = $demandeConges->employe;
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                self::creer(
                    $admin->idUtilisateur,
                    'Nouvelle demande de congé déposée',
                    "{$employe->prenom} {$employe->nom} a déposé une demande de congé du " .
                    \Carbon\Carbon::parse($demandeConges->dateDebut)->format('d/m/Y') . " au " .
                    \Carbon\Carbon::parse($demandeConges->dateFin)->format('d/m/Y'),
                    'info',
                    'conges',
                    $demandeConges->idDemande
                );
            }
        } catch (\Exception $e) {
            Log::error('Erreur notification admin nouvelle demande:', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notifie les admins des changements de statut des demandes
     */
    public static function notifierAdminsChangementStatut($demandeConges)
    {
        try {
            $employe = $demandeConges->employe;
            $statut = $demandeConges->statut->libelle;
            $admins = User::where('role', 'admin')->get();

            // 👇 CORRECTION : On ne peut pas utiliser auth() ici, on utilise une version simple
            $actionPar = 'un supérieur'; // Par défaut

            foreach ($admins as $admin) {
                $typeNotification = $demandeConges->idStatut == 2 ? 'success' : 'warning';

                self::creer(
                    $admin->idUtilisateur,
                    'Demande de congé ' . strtolower($statut),
                    "La demande de {$employe->prenom} {$employe->nom} a été {$statut}",
                    $typeNotification,
                    'conges',
                    $demandeConges->idDemande
                );
            }
        } catch (\Exception $e) {
            Log::error('Erreur notification admin changement statut:', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Notifie les admins de la création d'un nouvel employé
     */
    public static function notifierAdminsNouvelEmploye($employe, $userCreator)
    {
        try {
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                // Notifie même l'admin qui a créé (pour l'historique complet)
                self::creer(
                    $admin->idUtilisateur,
                    'Nouvel employé enregistré',
                    "{$employe->prenom} {$employe->nom} a été ajouté au système",
                    'info',
                    'employes',
                    $employe->matricule
                );
            }
        } catch (\Exception $e) {
            Log::error('Erreur notification admin nouvel employé:', ['error' => $e->getMessage()]);
        }
    }
}