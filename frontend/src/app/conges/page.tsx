'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface TypeConge {
  idType: number;
  nom: string;
  nombreJour: number;
}

interface StatutDemande {
  idStatut: number;
  libelle: string;
}

interface DemandeConge {
  idDemande: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  dateEnvoi: string;
  typeConge: TypeConge;
  statut: StatutDemande;
}

export default function CongesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('nouvelle');
  const [typesConge, setTypesConge] = useState<TypeConge[]>([]);
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [solde, setSolde] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire nouvelle demande
  const [formData, setFormData] = useState({
    dateDebut: '',
    dateFin: '',
    idType: '',
    motif: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
  try {
    setLoading(true);
    
    console.log('🔍 Début du chargement des données...');
    
    const [typesRes, demandesRes, soldeRes] = await Promise.all([
      axios.get('/conges/types'),
      axios.get('/conges'),
      axios.get('/conges/solde')
    ]);

    // LOG DÉTAILLÉ
    console.log('✅ TYPES DE CONGÉ:', typesRes.data);
    console.log('✅ RÉPONSE COMPLÈTE DEMANDES:', demandesRes.data);
    
    if (demandesRes.data.demandes && demandesRes.data.demandes.length > 0) {
      console.log('📋 NOMBRE DE DEMANDES:', demandesRes.data.demandes.length);
      demandesRes.data.demandes.forEach((demande: any, index: number) => {
        console.log(`🔍 Demande ${index + 1}:`, {
          id: demande.idDemande,
          typeConge: demande.typeConge,
          idType: demande.idType,
          hasTypeConge: !!demande.typeConge,
          typeCongeNom: demande.typeConge?.nom
        });
      });
    } else {
      console.log('❌ AUCUNE DEMANDE TROUVÉE');
    }

    console.log('💰 SOLDE:', soldeRes.data);

    setTypesConge(typesRes.data.types);
    setDemandes(demandesRes.data.demandes);
    setSolde(soldeRes.data.solde);
    
  } catch (error: any) {
    console.error('❌ Erreur chargement données:', error);
    console.error('❌ Détails erreur:', error.response?.data);
    alert('Erreur lors du chargement des données');
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dateDebut || !formData.dateFin || !formData.idType) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/conges', formData);
      alert('Demande de congé créée avec succès!');
      setFormData({ dateDebut: '', dateFin: '', idType: '', motif: '' });
      setActiveTab('historique');
      loadData(); // Recharge les données
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la demande';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Validée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Refusée': return 'bg-red-100 text-red-800 border-red-200';
      case 'En attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateJours = () => {
    if (!formData.dateDebut || !formData.dateFin) return 0;
    
    const start = new Date(formData.dateDebut);
    const end = new Date(formData.dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link 
                href="/dashboard" 
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
                <p className="text-gray-600 mt-1">
                  Solde disponible : <span className="font-semibold text-blue-600">{solde} jours</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user.nom_complet}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            {/* Navigation par onglets */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('nouvelle')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'nouvelle'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Nouvelle Demande
                </button>
                <button
                  onClick={() => setActiveTab('historique')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'historique'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mes Demandes
                </button>
              </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {activeTab === 'nouvelle' && (
                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Nouvelle demande de congé</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de début *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateDebut}
                          onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de fin *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateFin}
                          onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                          min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {formData.dateDebut && formData.dateFin && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          Durée du congé : <strong>{calculateJours()} jours</strong>
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de congé *
                      </label>
                      <select
                        required
                        value={formData.idType}
                        onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez un type de congé</option>
                        {typesConge.map((type) => (
                          <option key={type.idType} value={type.idType}>
                            {type.nom} {type.nombreJour > 0 && `(${type.nombreJour} jours/an)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif (optionnel)
                      </label>
                      <textarea
                        value={formData.motif}
                        onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Décrivez la raison de votre demande de congé..."
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {formData.motif.length}/500 caractères
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !formData.dateDebut || !formData.dateFin || !formData.idType}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        {submitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                          </span>
                        ) : (
                          'Soumettre la demande'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'historique' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Historique de mes demandes</h2>
                    <button
                      onClick={() => setActiveTab('nouvelle')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Nouvelle demande
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Chargement des demandes...</p>
                    </div>
                  ) : demandes.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Vous n'avez pas encore de demande de congé.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setActiveTab('nouvelle')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Créer une demande
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Période
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date de demande
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {demandes.map((demande) => (
                            <tr key={demande.idDemande} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                                </div>
                                {demande.motif && (
                                  <div className="text-sm text-gray-500 mt-1">{demande.motif}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                {demande.typeConge?.nom || 'Type inconnu'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                    demande.statut?.libelle || 'Inconnu'
                                )}`}
                                >
                                {demande.statut?.libelle || 'Inconnu'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(demande.dateEnvoi).toLocaleDateString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}