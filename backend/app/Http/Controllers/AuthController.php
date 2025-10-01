<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authentification de l'utilisateur
     */
        public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('employe')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->motDePasse)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // Supprime les anciens tokens
        $user->tokens()->delete();

        // Crée un nouveau token
        $token = $user->createToken('auth-token')->plainTextToken;

        $nomComplet = $user->employe ? $user->employe->prenom . ' ' . $user->employe->nom : 'Non assigné';

        return response()->json([
            'user' => [
                'id' => $user->idUtilisateur,
                'email' => $user->email,
                'role' => $user->role,
                'nom_complet' => $nomComplet,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion de l'utilisateur
     */
    public function logout(Request $request)
    {
        try {
            // Vérifie si l'utilisateur est authentifié
            if ($request->user()) {
                // Supprime le token courant
                $request->user()->currentAccessToken()->delete();
            }

            return response()->json([
                'message' => 'Déconnexion réussie'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la déconnexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupération des informations de l'utilisateur connecté
     */
    public function user(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Charge les relations nécessaires
            $user->load('employe.structure');

            $nomComplet = 'Non assigné';
            $structure = null;

            if ($user->employe) {
                $nomComplet = $user->employe->prenom . ' ' . $user->employe->nom;
                $structure = $user->employe->structure;
            }

            return response()->json([
                'user' => [
                    'id' => $user->idUtilisateur,
                    'email' => $user->email,
                    'role' => $user->role,
                    'nom_complet' => $nomComplet,
                    'employe' => $user->employe ? [
                        'matricule' => $user->employe->matricule,
                        'nom' => $user->employe->nom,
                        'prenom' => $user->employe->prenom,
                        'fonction' => $user->employe->fonction,
                        'solde_conge' => $user->employe->soldeConge,
                        'structure' => $structure ? [
                            'id' => $structure->idStructure,
                            'nom' => $structure->nom,
                            'type' => $structure->type
                        ] : null
                    ] : null
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des informations utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rafraîchissement du token (optionnel)
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Supprime l'ancien token
            $request->user()->currentAccessToken()->delete();

            // Crée un nouveau token
            $token = $user->createToken('auth-token', ['*'], now()->addWeek())->plainTextToken;

            return response()->json([
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 60 * 24 * 7 // 1 semaine en minutes
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du rafraîchissement du token',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérification de la validité du token
     */
    public function checkAuth(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'authenticated' => false
                ], 401);
            }

            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => $user->idUtilisateur,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'authenticated' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}