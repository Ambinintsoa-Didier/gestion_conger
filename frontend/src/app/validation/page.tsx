'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Employe {
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
}

interface DemandeConge {
  idDemande: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  dateEnvoi: string;
  idEmploye: string;
  idType: number;
  idStatut: number;
  typeConge?: {
    idType: number;
    nom: string;
  };
  statut?: {
    idStatut: number;
    libelle: string;
  };
  employe?: Employe;
}

export default function ValidationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('a-valider');
  const [demandesAValider, setDemandesAValider] = useState<DemandeConge[]>([]);
  const [historique, setHistorique] = useState<DemandeConge[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
      
      console.log('🚀 Début du chargement des données de validation...');
      
      const [aValiderRes, historiqueRes] = await Promise.all([
        axios.get('/validation/demandes'),
        axios.get('/validation/historique')
      ]);

      console.log('✅ RÉPONSE API - Demandes à valider:', aValiderRes.data);
      console.log('✅ RÉPONSE API - Historique:', historiqueRes.data);

      // Analyse détaillée des données
      if (aValiderRes.data.demandes) {
        console.log(`📊 ${aValiderRes.data.demandes.length} demande(s) à valider`);
        aValiderRes.data.demandes.forEach((demande: any, index: number) => {
          console.log(`🔍 Demande ${index + 1}:`, {
            id: demande.idDemande,
            idType: demande.idType,
            typeConge: demande.typeConge,
            hasTypeConge: !!demande.typeConge,
            idStatut: demande.idStatut,
            statut: demande.statut,
            hasStatut: !!demande.statut,
            employe: demande.employe,
            hasEmploye: !!demande.employe
          });
        });
      }

      if (historiqueRes.data.demandes) {
        console.log(`📜 ${historiqueRes.data.demandes.length} demande(s) dans l'historique`);
        historiqueRes.data.demandes.forEach((demande: any, index: number) => {
          console.log(`📋 Historique ${index + 1}:`, {
            id: demande.idDemande,
            typeConge: demande.typeConge,
            statut: demande.statut
          });
        });
      }

      setDemandesAValider(aValiderRes.data.demandes || []);
      setHistorique(historiqueRes.data.demandes || []);
      
    } catch (error: any) {
      console.error('❌ Erreur chargement données validation:', error);
      console.error('❌ Response error:', error.response?.data);
      alert('Erreur lors du chargement des données de validation');
    } finally {
      setLoading(false);
    }
  };

  const validerDemande = async (idDemande: number) => {
    try {
      setActionLoading(idDemande);
      await axios.post(`/validation/valider/${idDemande}`);
      alert('Demande validée avec succès!');
      loadData(); // Recharge les données
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const refuserDemande = async (idDemande: number) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) {
      return;
    }

    try {
      setActionLoading(idDemande);
      await axios.post(`/validation/refuser/${idDemande}`);
      alert('Demande refusée avec succès!');
      loadData(); // Recharge les données
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
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

  const calculateJours = (dateDebut: string, dateFin: string) => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                <h1 className="text-2xl font-bold text-gray-900">Validation des Congés</h1>
                <p className="text-gray-600 mt-1">
                  Gestion des demandes de votre équipe
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
                  onClick={() => setActiveTab('a-valider')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'a-valider'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  À Valider
                  {demandesAValider.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {demandesAValider.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('historique')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'historique'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Historique
                </button>
              </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {activeTab === 'a-valider' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Demandes en attente de validation
                  </h2>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Chargement des demandes...</p>
                    </div>
                  ) : demandesAValider.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande à valider</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Toutes les demandes de votre équipe ont été traitées.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {demandesAValider.map((demande) => (
                        <div key={demande.idDemande} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {demande.employe?.prenom || 'Inconnu'} {demande.employe?.nom || 'Inconnu'}
                              </h3>
                              <p className="text-gray-600">{demande.employe?.fonction || 'Fonction inconnue'}</p>
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              En attente
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Période</p>
                              <p className="font-medium">
                                {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                              </p>
                              <p className="text-sm text-gray-500">
                                ({calculateJours(demande.dateDebut, demande.dateFin)} jours)
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Type de congé</p>
                              <p className="font-medium">
                                {demande.typeConge?.nom || `Type ${demande.idType}`}
                              </p>
                              {!demande.typeConge && (
                                <p className="text-xs text-red-500">Relation non chargée</p>
                              )}
                            </div>
                          </div>

                          {demande.motif && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Motif</p>
                              <p className="text-gray-900">{demande.motif}</p>
                            </div>
                          )}

                          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => refuserDemande(demande.idDemande)}
                              disabled={actionLoading === demande.idDemande}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                              {actionLoading === demande.idDemande ? 'Traitement...' : 'Refuser'}
                            </button>
                            <button
                              onClick={() => validerDemande(demande.idDemande)}
                              disabled={actionLoading === demande.idDemande}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {actionLoading === demande.idDemande ? 'Traitement...' : 'Valider'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'historique' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Historique des validations
                  </h2>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Chargement de l'historique...</p>
                    </div>
                  ) : historique.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun historique</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucune demande n'a encore été traitée.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employé
                            </th>
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
                              Date décision
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {historique.map((demande) => (
                            <tr key={demande.idDemande} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {demande.employe?.prenom || 'Inconnu'} {demande.employe?.nom || 'Inconnu'}
                                </div>
                                <div className="text-sm text-gray-500">{demande.employe?.fonction || 'Fonction inconnue'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(demande.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(demande.dateFin).toLocaleDateString('fr-FR')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {demande.typeConge?.nom || `Type ${demande.idType}`}
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