<?php
// app/Http/Controllers/RH/EmployeController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\User;
use App\Models\Structure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\CompteEmployeCree;

class EmployeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $employes = Employe::with(['structure', 'superieur', 'user'])
                ->get()
                ->map(function ($employe) {
                    $userData = null;
                    if ($employe->user) {
                        $userData = [
                            'email' => $employe->user->email,
                            'role' => $employe->user->role,
                            'password_temp' => $employe->user->password_temp,
                            'must_change_password' => $employe->user->must_change_password
                        ];
                    }

                    return [
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'sexe' => $employe->sexe,
                        'fonction' => $employe->fonction,
                        'soldeConge' => $employe->soldeConge,
                        'dateEmbauche' => $employe->dateEmbauche->format('Y-m-d'),
                        'idStructure' => $employe->idStructure,
                        'superieur_id' => $employe->superieur_id,
                        'structure' => $employe->structure,
                        'superieur' => $employe->superieur,
                        'user' => $userData
                    ];
                });

            return response()->json([
                'success' => true,
                'employes' => $employes
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans EmployeController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des employés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            // Validation des données
            $validated = $request->validate([
                'matricule' => 'required|string|unique:employes,matricule|max:20',
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0|max:365',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule',
                'email' => 'required|email|unique:users,email',
                'role' => 'required|in:employe,superieur,rh,admin',
                'genererMotDePasse' => 'required|boolean',
                'motDePasse' => $request->genererMotDePasse ? 'nullable|string' : 'required|string|min:8'
            ]);

            // Créer l'employé
            $employe = Employe::create([
                'matricule' => $validated['matricule'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'sexe' => $validated['sexe'],
                'fonction' => $validated['fonction'],
                'soldeConge' => $validated['soldeConge'],
                'dateEmbauche' => $validated['dateEmbauche'],
                'idStructure' => $validated['idStructure'],
                'superieur_id' => $validated['superieur_id'] ?: null
            ]);

            // Gestion du mot de passe
            if ($request->genererMotDePasse) {
                $motDePasseTemporaire = $this->genererMotDePasseSecurise();
                $passwordToHash = $motDePasseTemporaire;
            } else {
                $motDePasseTemporaire = $validated['motDePasse'];
                $passwordToHash = $validated['motDePasse'];
            }

            // Créer l'utilisateur
            $user = User::create([
                'email' => $validated['email'],
                'motDePasse' => Hash::make($passwordToHash),
                'role' => $validated['role'],
                'matricule_employe' => $employe->matricule,
                'password_temp' => $motDePasseTemporaire,
                'must_change_password' => true
            ]);

            // 🔥 ENVOYER L'EMAIL À L'EMPLOYÉ
            $emailEnvoye = false;
            try {
                $donneesEmail = [
                    'nom' => $employe->nom,
                    'prenom' => $employe->prenom,
                    'email' => $user->email,
                    'matricule' => $employe->matricule,
                    'motDePasse' => $motDePasseTemporaire,
                    'fonction' => $employe->fonction,
                    'dateEmbauche' => $employe->dateEmbauche->format('d/m/Y')
                ];

                Mail::to($user->email)->send(new CompteEmployeCree($donneesEmail));
                $emailEnvoye = true;
                Log::info("✅ Email envoyé à: " . $user->email);
                
            } catch (\Exception $emailException) {
                Log::error('❌ Erreur envoi email: ' . $emailException->getMessage());
                // On continue même si l'email échoue
            }

            DB::commit();

            // Charger les relations pour la réponse
            $employe->load(['structure', 'superieur', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Employé créé avec succès' . ($emailEnvoye ? ' et email envoyé' : ' (erreur envoi email)'),
                'employe' => $employe,
                'tempPassword' => $motDePasseTemporaire,
                'email_envoye' => $emailEnvoye
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans EmployeController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $matricule)
    {
        DB::beginTransaction();
        
        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();

            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0|max:365',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule',
                'email' => 'required|email|unique:users,email,' . $employe->user->idUtilisateur . ',idUtilisateur',
                'role' => 'required|in:employe,superieur,rh,admin'
            ]);

            // Mettre à jour l'employé
            $employe->update([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'sexe' => $validated['sexe'],
                'fonction' => $validated['fonction'],
                'soldeConge' => $validated['soldeConge'],
                'dateEmbauche' => $validated['dateEmbauche'],
                'idStructure' => $validated['idStructure'],
                'superieur_id' => $validated['superieur_id'] ?: null
            ]);

            // Mettre à jour l'utilisateur
            $employe->user->update([
                'email' => $validated['email'],
                'role' => $validated['role']
            ]);

            DB::commit();

            $employe->load(['structure', 'superieur', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Employé mis à jour avec succès',
                'employe' => $employe
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans EmployeController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($matricule)
    {
        DB::beginTransaction();
        
        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();

            // Supprimer l'utilisateur associé
            if ($employe->user) {
                $employe->user->delete();
            }

            // Supprimer l'employé
            $employe->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employé supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans EmployeController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset employee password
     */
    public function resetPassword($matricule)
    {
        DB::beginTransaction();
        
        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();
            
            if (!$employe->user) {
                throw new \Exception('Aucun utilisateur associé à cet employé');
            }

            $nouveauMotDePasse = $this->genererMotDePasseSecurise();

            $employe->user->update([
                'motDePasse' => Hash::make($nouveauMotDePasse),
                'password_temp' => $nouveauMotDePasse,
                'must_change_password' => true
            ]);

            // 🔥 ENVOYER EMAIL POUR RÉINITIALISATION
            $emailEnvoye = false;
            try {
                $donneesEmail = [
                    'nom' => $employe->nom,
                    'prenom' => $employe->prenom,
                    'email' => $employe->user->email,
                    'matricule' => $employe->matricule,
                    'motDePasse' => $nouveauMotDePasse,
                    'fonction' => $employe->fonction,
                    'dateEmbauche' => $employe->dateEmbauche->format('d/m/Y'),
                    'raison' => 'réinitialisation'
                ];

                Mail::to($employe->user->email)->send(new CompteEmployeCree($donneesEmail));
                $emailEnvoye = true;
                Log::info("✅ Email réinitialisation envoyé à: " . $employe->user->email);
                
            } catch (\Exception $emailException) {
                Log::error('❌ Erreur envoi email réinitialisation: ' . $emailException->getMessage());
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès' . ($emailEnvoye ? ' et email envoyé' : ' (erreur envoi email)'),
                'tempPassword' => $nouveauMotDePasse,
                'email_envoye' => $emailEnvoye
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans EmployeController@resetPassword: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation du mot de passe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate secure password
     */
    private function genererMotDePasseSecurise($longueur = 12)
    {
        $majuscules = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $minuscules = 'abcdefghijklmnopqrstuvwxyz';
        $chiffres = '0123456789';
        $speciaux = '!@#$%&*';

        $motDePasse = '';
        
        // Au moins une majuscule
        $motDePasse .= $majuscules[random_int(0, strlen($majuscules) - 1)];
        // Au moins une minuscule
        $motDePasse .= $minuscules[random_int(0, strlen($minuscules) - 1)];
        // Au moins un chiffre
        $motDePasse .= $chiffres[random_int(0, strlen($chiffres) - 1)];
        // Au moins un caractère spécial
        $motDePasse .= $speciaux[random_int(0, strlen($speciaux) - 1)];

        // Remplir le reste
        $tousCaracteres = $majuscules . $minuscules . $chiffres . $speciaux;
        for ($i = strlen($motDePasse); $i < $longueur; $i++) {
            $motDePasse .= $tousCaracteres[random_int(0, strlen($tousCaracteres) - 1)];
        }

        // Mélanger le mot de passe
        return str_shuffle($motDePasse);
    }
}