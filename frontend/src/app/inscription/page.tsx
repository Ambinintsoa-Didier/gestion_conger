// app/inscription/page.tsx - VERSION CORRIGÉE
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
  matricule: string;
  email: string;
  motDePasse: string;
  motDePasse_confirmation: string;
}

export default function Inscription() {
  const [formData, setFormData] = useState<FormData>({
    matricule: '',
    email: '',
    motDePasse: '',
    motDePasse_confirmation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const router = useRouter();

  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    if (password.length < 8) {
      setPasswordStrength('Faible - Minimum 8 caractères');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    switch (strength) {
      case 1:
        setPasswordStrength('Faible');
        break;
      case 2:
        setPasswordStrength('Moyen');
        break;
      case 3:
        setPasswordStrength('Fort');
        break;
      case 4:
        setPasswordStrength('Très fort');
        break;
      default:
        setPasswordStrength('Faible');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'motDePasse') {
      checkPasswordStrength(value);
    }
  };

  const genererEmailAutomatique = () => {
    if (formData.matricule) {
      const email = `employe.${formData.matricule.toLowerCase()}@spat.com`;
      setFormData(prev => ({ ...prev, email }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation côté client
    if (formData.motDePasse !== formData.motDePasse_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      // 👇 CORRECTION ICI : Supprimer "/api" du début de l'URL
      const response = await axios.post('/employes/creer-compte', {
        matricule: formData.matricule,
        email: formData.email,
        motDePasse: formData.motDePasse,
        motDePasse_confirmation: formData.motDePasse_confirmation
      });

      if (response.data.success) {
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setFormData({
          matricule: '',
          email: '',
          motDePasse: '',
          motDePasse_confirmation: ''
        });
        
        // Redirection automatique après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      
      // 👇 GESTION DÉTAILLÉE DES ERREURS
      if (error.response?.status === 405) {
        setError('Erreur de méthode. Veuillez contacter l\'administrateur.');
      } else if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        setError(errors.join(', '));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion.');
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Très fort': return 'text-green-600';
      case 'Fort': return 'text-green-500';
      case 'Moyen': return 'text-yellow-500';
      case 'Faible': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Créer votre compte</CardTitle>
          <CardDescription className="text-center">
            Employé SPAT - Première connexion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Matricule */}
            <div className="space-y-2">
              <Label htmlFor="matricule" className="flex items-center gap-1">
                Matricule <span className="text-red-500">*</span>
              </Label>
              <Input
                id="matricule"
                name="matricule"
                type="text"
                required
                placeholder="Ex: DEV2024001"
                value={formData.matricule}
                onChange={(e) => handleInputChange('matricule', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Votre matricule vous a été communiqué par les Ressources Humaines
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="email" className="flex items-center gap-1">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={genererEmailAutomatique}
                  disabled={!formData.matricule}
                  className="h-8 text-xs"
                >
                  Générer
                </Button>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="prenom.nom@spat.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format recommandé: prenom.nom@spat.com
              </p>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="motDePasse" className="flex items-center gap-1">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motDePasse"
                name="motDePasse"
                type="password"
                required
                placeholder="Minimum 8 caractères"
                value={formData.motDePasse}
                onChange={(e) => handleInputChange('motDePasse', e.target.value)}
              />
              {passwordStrength && (
                <p className={`text-xs ${getPasswordStrengthColor()}`}>
                  Force du mot de passe: {passwordStrength}
                </p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="motDePasse_confirmation" className="flex items-center gap-1">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="motDePasse_confirmation"
                name="motDePasse_confirmation"
                type="password"
                required
                placeholder="Confirmez votre mot de passe"
                value={formData.motDePasse_confirmation}
                onChange={(e) => handleInputChange('motDePasse_confirmation', e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création du compte...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          {/* Lien vers login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Informations importantes */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations importantes
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Votre matricule doit correspondre à celui fourni par les RH</li>
              <li>• Utilisez un mot de passe sécurisé</li>
              <li>• Après création, vous pourrez vous connecter immédiatement</li>
              <li>• En cas de problème, contactez le service RH</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}