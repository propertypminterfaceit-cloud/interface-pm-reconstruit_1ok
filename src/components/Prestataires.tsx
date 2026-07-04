import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Users, Plus, Filter, Search, Star, Phone, Mail, Building, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Prestataire } from '../types';

export default function Prestataires() {
  const { prestataires, sites, addPrestataire, updatePrestataire, currentRole } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPrestataire, setEditingPrestataire] = useState<Prestataire | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetier, setFilterMetier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [newPrestataire, setNewPrestataire] = useState({
    name: '',
    siret: '',
    selectedDomain: '',
    selectedMetiers: [] as string[],
    customMetier: '',
    sites: [] as string[],
    contacts: {} as { [siteId: string]: { name: string; email: string; phone: string } }
  });

  const metiersByDomain = {
    'Maintenance / Exploitation technique': [
      'Électricité CFO/CFA',
      'Plomberie / Sanitaire',
      'Chauffage / Ventilation / Climatisation (CVC)',
      'Maintenance Multi-technique',
      'GTB / GTC',
      'Maintenance ascenseurs',
      'Maintenance portes automatiques',
      'Maintenance groupes électrogènes',
      'SSI/ Détection incendie',
      'Sécurité incendie (Maintenance RIA/ Extincteur/ colonnes sèche / désenfumage …)',
      'Contrôle d\'accès / Alarme intrusion',
      'Sûreté / Vidéosurveillance',
      'Autre'
    ],
    'Travaux / Réhabilitation': [
      'Tous corps d\'état (TCE)',
      'Peinture / Revêtement mural',
      'Sols / Revêtement de sol/ sol technique',
      'Menuiserie intérieure / extérieure',
      'Cloisonnement / Plafond',
      'Serrurerie / Métallerie',
      'Façade / Bardage / Étanchéité',
      'Ravalement',
      'Charpente / Couverture',
      'VRD / Terrassement',
      'Autre'
    ],
    'Services généraux / Propreté / Espaces verts': [
      'Nettoyage / Propreté',
      'Désinfection / Dératisation / Désinsectisation',
      'Gestion des déchets / encombrants',
      'Espace verts / paysagisme',
      'Vitrerie / Lavage de vitres',
      'Autre'
    ],
    'Techniques spécialisées / expertises': [
      'Thermographie / Détection de fuite',
      'Amiante / Plomb / HAP',
      'Diagnostics techniques (électricité, gaz, sécurité)',
      'Bureau d\'études techniques (BET)',
      'Contrôle technique construction',
      'Maîtrise d\'œuvre / AMO',
      'Coordination SPS',
      'Géomètre / Relevés techniques',
      'Relevés 3D / BIM',
      'Architecte',
      'Vérifications réglementaires (bureau de contrôle)',
      'Autre'
    ]
  };

  const filteredPrestataires = prestataires.filter(prestataire => {
    const matchesSearch = prestataire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prestataire.siret.includes(searchTerm);
    const matchesMetier = !filterMetier || prestataire.metier.toLowerCase().includes(filterMetier.toLowerCase());
    const matchesStatus = !filterStatus || prestataire.status === filterStatus;
    
    return matchesSearch && matchesMetier && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-800';
      case 'Suspendu': return 'bg-red-100 text-red-800';
      case 'En validation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleMetierChange = (metier: string) => {
    setNewPrestataire(prev => ({
      ...prev,
      selectedMetiers: prev.selectedMetiers.includes(metier)
        ? prev.selectedMetiers.filter(m => m !== metier)
        : [...prev.selectedMetiers, metier]
    }));
  };

  const handleCreatePrestataire = () => {
    let finalMetiers = [...newPrestataire.selectedMetiers];
    if (newPrestataire.selectedMetiers.includes('Autre') && newPrestataire.customMetier.trim()) {
      finalMetiers = finalMetiers.filter(m => m !== 'Autre');
      finalMetiers.push(newPrestataire.customMetier.trim());
    }
    
    const prestataire: Prestataire = {
      id: Date.now().toString(),
      name: newPrestataire.name,
      siret: newPrestataire.siret,
      metier: finalMetiers.join(', '),
      status: 'En validation',
      sites: newPrestataire.sites,
      contacts: newPrestataire.contacts,
      rating: 0,
      interventionsCount: 0,
      conformityRate: 0,
      averageDelay: 0
    };

    addPrestataire(prestataire);
    setShowCreateForm(false);
    setNewPrestataire({
      name: '',
      siret: '',
      selectedDomain: '',
      selectedMetiers: [],
      customMetier: '',
      sites: [],
      contacts: {}
    });
  };

  const handleSiteChange = (siteId: string, checked: boolean) => {
    if (checked) {
      setNewPrestataire(prev => ({
        ...prev,
        sites: [...prev.sites, siteId],
        contacts: {
          ...prev.contacts,
          [siteId]: { name: '', email: '', phone: '' }
        }
      }));
    } else {
      setNewPrestataire(prev => ({
        ...prev,
        sites: prev.sites.filter(id => id !== siteId),
        contacts: Object.fromEntries(
          Object.entries(prev.contacts).filter(([key]) => key !== siteId)
        )
      }));
    }
  };

  const handleContactChange = (siteId: string, field: string, value: string) => {
    setNewPrestataire(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [siteId]: {
          ...prev.contacts[siteId],
          [field]: value
        }
      }
    }));
  };

  const handleValidatePrestataire = (prestataireId: string) => {
    updatePrestataire(prestataireId, { status: 'Actif' });
  };

  const handleRejectPrestataire = (prestataireId: string) => {
    updatePrestataire(prestataireId, { status: 'Suspendu' });
  };

  const handleEditPrestataire = (prestataire: Prestataire) => {
    setEditingPrestataire({
      ...prestataire,
      sites: [...prestataire.sites],
      contacts: { ...prestataire.contacts }
    });
    setShowEditForm(true);
  };

  const handleUpdatePrestataire = () => {
    if (!editingPrestataire) return;
    
    updatePrestataire(editingPrestataire.id, {
      sites: editingPrestataire.sites,
      contacts: editingPrestataire.contacts
    });
    
    setShowEditForm(false);
    setEditingPrestataire(null);
  };

  const handleEditSiteChange = (siteId: string, checked: boolean) => {
    if (!editingPrestataire) return;
    
    if (checked) {
      setEditingPrestataire(prev => prev ? {
        ...prev,
        sites: [...prev.sites, siteId],
        contacts: {
          ...prev.contacts,
          [siteId]: { name: '', email: '', phone: '' }
        }
      } : null);
    } else {
      setEditingPrestataire(prev => prev ? {
        ...prev,
        sites: prev.sites.filter(id => id !== siteId),
        contacts: Object.fromEntries(
          Object.entries(prev.contacts).filter(([key]) => key !== siteId)
        )
      } : null);
    }
  };

  const handleEditContactChange = (siteId: string, field: string, value: string) => {
    if (!editingPrestataire) return;
    
    setEditingPrestataire(prev => prev ? {
      ...prev,
      contacts: {
        ...prev.contacts,
        [siteId]: {
          ...prev.contacts[siteId],
          [field]: value
        }
      }
    } : null);
  };
  const prestataireStats = {
    total: prestataires.length,
    actifs: prestataires.filter(p => p.status === 'Actif').length,
    enValidation: prestataires.filter(p => p.status === 'En validation').length,
    suspendus: prestataires.filter(p => p.status === 'Suspendu').length
  };

  // Bloquer le scroll du body quand un modal est ouvert
  useEffect(() => {
    if (showCreateForm || showEditForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup: rétablir le scroll quand le composant se démonte
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showCreateForm, showEditForm]);

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{prestataireStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{prestataireStats.actifs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En validation</p>
              <p className="text-2xl font-bold text-gray-900">{prestataireStats.enValidation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspendus</p>
              <p className="text-2xl font-bold text-gray-900">{prestataireStats.suspendus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestataires</h1>
          <p className="text-gray-600">{prestataires.length} prestataires au total</p>
        </div>
        
        {(currentRole === 'PM' || currentRole === 'DT') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un prestataire
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <input
            type="text"
            placeholder="Filtrer par métier..."
            value={filterMetier}
            onChange={(e) => setFilterMetier(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="En validation">En validation</option>
            <option value="Suspendu">Suspendu</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des prestataires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrestataires.map((prestataire) => (
          <div key={prestataire.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{prestataire.name}</h3>
                  <p className="text-sm text-gray-600">SIRET: {prestataire.siret}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prestataire.status)}`}>
                {prestataire.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Métier:</span>
                <span className="text-sm font-medium text-gray-900">{prestataire.metier}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sites assignés:</span>
                <span className="text-sm font-medium text-gray-900">{prestataire.sites?.length || 0}</span>
              </div>

              {prestataire.rating > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Note moyenne:</span>
                  <div className="flex items-center">
                    <Star className={`w-4 h-4 mr-1 ${getRatingColor(prestataire.rating)}`} />
                    <span className={`text-sm font-medium ${getRatingColor(prestataire.rating)}`}>
                      {prestataire.rating.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Interventions:</span>
                <span className="text-sm font-medium text-gray-900">{prestataire.interventionsCount}</span>
              </div>

              {prestataire.conformityRate > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taux conformité:</span>
                  <span className="text-sm font-medium text-gray-900">{prestataire.conformityRate}%</span>
                </div>
              )}

              {prestataire.averageDelay > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Délai moyen:</span>
                  <span className="text-sm font-medium text-gray-900">{prestataire.averageDelay} jours</span>
                </div>
              )}

              {/* Contacts par site */}
              {prestataire.sites && prestataire.sites.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contacts par site:</h4>
                  <div className="space-y-2">
                    {(prestataire.sites || []).map(siteId => {
                      const site = sites.find(s => s.id === siteId);
                      const contact = prestataire.contacts[siteId];
                      return (
                        <div key={siteId} className="text-xs text-gray-600">
                          <div className="font-medium">{site?.name}</div>
                          {contact && (
                            <div className="ml-2 space-y-1">
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {contact.name}
                              </div>
                              <div className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {contact.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {contact.phone}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions pour PM uniquement */}
              {currentRole === 'DT' && prestataire.status === 'En validation' && (
                <div className="pt-3 border-t border-gray-200 flex space-x-2">
                  <button
                    onClick={() => handleValidatePrestataire(prestataire.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleRejectPrestataire(prestataire.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Rejeter
                  </button>
                </div>
              )}
              
              {/* Modification pour PM et DT */}
              {(currentRole === 'PM' || currentRole === 'DT') && prestataire.status === 'Actif' && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEditPrestataire(prestataire)}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier sites et contacts
                  </button>
                </div>
              )}
              
              {/* Upload de documents pour Prestataires */}
              {currentRole === 'Prestataire' && prestataire.status === 'Actif' && (
                <div className="pt-3 border-t border-gray-200">
                  <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Uploader un document
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un nouveau prestataire</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={newPrestataire.name}
                    onChange={(e) => setNewPrestataire(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Ascenseurs Otis France"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
                  <input
                    type="text"
                    value={newPrestataire.siret}
                    onChange={(e) => setNewPrestataire(prev => ({ ...prev, siret: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678901234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domaine d'activité</label>
                <select
                  value={newPrestataire.selectedDomain}
                  onChange={(e) => setNewPrestataire(prev => ({ 
                    ...prev, 
                    selectedDomain: e.target.value,
                    selectedMetiers: [],
                    customMetier: ''
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                >
                  <option value="">Sélectionner un domaine</option>
                  {Object.keys(metiersByDomain).map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>

                {newPrestataire.selectedDomain && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Métiers (sélectionner un ou plusieurs)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {metiersByDomain[newPrestataire.selectedDomain as keyof typeof metiersByDomain].map(metier => (
                        <label key={metier} className="flex items-start">
                          <input
                            type="checkbox"
                            checked={newPrestataire.selectedMetiers.includes(metier)}
                            onChange={() => handleMetierChange(metier)}
                            className="mr-2 mt-1"
                          />
                          <span className="text-sm">{metier}</span>
                        </label>
                      ))}
                    </div>
                    
                    {newPrestataire.selectedMetiers.includes('Autre') && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Précisez le métier</label>
                        <input
                          type="text"
                          value={newPrestataire.customMetier}
                          onChange={(e) => setNewPrestataire(prev => ({ ...prev, customMetier: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Saisissez le métier personnalisé"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {newPrestataire.selectedMetiers.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Métiers sélectionnés:</strong> {
                        newPrestataire.selectedMetiers
                          .filter(m => m !== 'Autre')
                          .concat(newPrestataire.selectedMetiers.includes('Autre') && newPrestataire.customMetier.trim() ? [newPrestataire.customMetier.trim()] : [])
                          .join(', ')
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Sélection des sites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Sites assignés</label>
                <div className="space-y-4">
                  {sites.map(site => (
                    <div key={site.id} className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          checked={newPrestataire.sites.includes(site.id)}
                          onChange={(e) => handleSiteChange(site.id, e.target.checked)}
                          className="mr-3"
                        />
                        <span className="font-medium">{site.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({site.address})</span>
                      </label>

                      {newPrestataire.sites.includes(site.id) && (
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du contact</label>
                            <input
                              type="text"
                              value={newPrestataire.contacts[site.id]?.name || ''}
                              onChange={(e) => handleContactChange(site.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="Nom Prénom"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={newPrestataire.contacts[site.id]?.email || ''}
                              onChange={(e) => handleContactChange(site.id, 'email', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="contact@entreprise.fr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                            <input
                              type="tel"
                              value={newPrestataire.contacts[site.id]?.phone || ''}
                              onChange={(e) => handleContactChange(site.id, 'phone', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="01.23.45.67.89"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePrestataire}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter le prestataire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditForm && editingPrestataire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Modifier {editingPrestataire.name}</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Sélection des sites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Sites assignés</label>
                <div className="space-y-4">
                  {sites.map(site => (
                    <div key={site.id} className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          checked={editingPrestataire.sites.includes(site.id)}
                          onChange={(e) => handleEditSiteChange(site.id, e.target.checked)}
                          className="mr-3"
                        />
                        <span className="font-medium">{site.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({site.address})</span>
                      </label>

                      {editingPrestataire.sites.includes(site.id) && (
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du contact</label>
                            <input
                              type="text"
                              value={editingPrestataire.contacts[site.id]?.name || ''}
                              onChange={(e) => handleEditContactChange(site.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="Nom Prénom"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={editingPrestataire.contacts[site.id]?.email || ''}
                              onChange={(e) => handleEditContactChange(site.id, 'email', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="contact@entreprise.fr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                            <input
                              type="tel"
                              value={editingPrestataire.contacts[site.id]?.phone || ''}
                              onChange={(e) => handleEditContactChange(site.id, 'phone', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              placeholder="01.23.45.67.89"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePrestataire}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}