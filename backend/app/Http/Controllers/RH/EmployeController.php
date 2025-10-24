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
            // Validation MODIFIÉE - sans email/role/mot de passe
            $validated = $request->validate([
                'matricule' => 'required|string|unique:employes,matricule|max:20',
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0|max:365',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule'
            ]);

            // Créer UNIQUEMENT l'employé (sans compte utilisateur)
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

            DB::commit();

            // Charger les relations pour la réponse
            $employe->load(['structure', 'superieur']);

            return response()->json([
                'success' => true,
                'message' => 'Employé créé avec succès. L\'employé pourra créer son compte ultérieurement.',
                'employe' => $employe
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

            // Validation MODIFIÉE - sans email/role
            $validated = $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0|max:365',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule'
            ]);

            // Mettre à jour UNIQUEMENT l'employé
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

            DB::commit();

            $employe->load(['structure', 'superieur']);

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

            // Supprimer l'utilisateur associé s'il existe
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
     * Create user account for existing employee (Self-registration)
     */
    public function creerCompteEmploye(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $validated = $request->validate([
                'matricule' => 'required|exists:employes,matricule',
                'email' => 'required|email|unique:users,email',
                'motDePasse' => 'required|string|min:8|confirmed'
            ], [
                'matricule.exists' => 'Matricule non reconnu. Vérifiez votre matricule.',
                'email.unique' => 'Cette adresse email est déjà utilisée.',
                'motDePasse.confirmed' => 'Les mots de passe ne correspondent pas.'
            ]);

            $employe = Employe::where('matricule', $validated['matricule'])->firstOrFail();
            
            // Vérifier que l'employé n'a pas déjà un compte
            if ($employe->user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un compte existe déjà pour cet employé. Contactez les RH si vous avez oublié vos identifiants.'
                ], 422);
            }

            // Créer le compte utilisateur avec le mot de passe choisi par l'employé
            $user = User::create([
                'email' => $validated['email'],
                'motDePasse' => Hash::make($validated['motDePasse']),
                'role' => 'employe', // Par défaut pour l'auto-inscription
                'matricule_employe' => $employe->matricule,
                'password_temp' => null,
                'must_change_password' => false // L'employé a déjà choisi son mot de passe
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compte créé avec succès! Vous pouvez maintenant vous connecter.',
                'user' => $user
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
            Log::error('Erreur création compte employé: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employees without user accounts
     */
    public function employesSansCompte()
    {
        try {
            $employesSansCompte = Employe::whereDoesntHave('user')
                ->with(['structure'])
                ->get()
                ->map(function ($employe) {
                    return [
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'fonction' => $employe->fonction,
                        'structure' => $employe->structure,
                        'dateEmbauche' => $employe->dateEmbauche->format('Y-m-d')
                    ];
                });

            return response()->json([
                'success' => true,
                'employes' => $employesSansCompte
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans EmployeController@employesSansCompte: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des employés sans compte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create user account for specific employee (Admin function)
     */
    public function creerCompteUtilisateur(Request $request, $matricule)
    {
        DB::beginTransaction();
        
        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();

            // Vérifier que l'employé n'a pas déjà un compte
            if ($employe->user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet employé a déjà un compte utilisateur'
                ], 422);
            }

            $validated = $request->validate([
                'email' => 'required|email|unique:users,email',
                'role' => 'required|in:employe,superieur,rh,admin',
                'genererMotDePasse' => 'required|boolean',
                'motDePasse' => $request->genererMotDePasse ? 'nullable|string' : 'required|string|min:8'
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
                'password_temp' => $request->genererMotDePasse ? $motDePasseTemporaire : null,
                'must_change_password' => $request->genererMotDePasse
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compte utilisateur créé avec succès',
                'user' => $user,
                'tempPassword' => $request->genererMotDePasse ? $motDePasseTemporaire : null
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
            Log::error('Erreur dans EmployeController@creerCompteUtilisateur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte utilisateur',
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