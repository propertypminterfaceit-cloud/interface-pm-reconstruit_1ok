import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Wrench, Plus, Filter, Search, Clock, CheckCircle, AlertTriangle, DollarSign, Upload, Camera } from 'lucide-react';
import { Intervention } from '../types';
import { filterSitesByUser } from '../utils/permissions';

export default function Interventions() {
  const { interventions, sites, prestataires, addIntervention, updateIntervention, currentRole, currentUser } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [showRelanceForm, setShowRelanceForm] = useState(false);
  const [relanceMessage, setRelanceMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [newIntervention, setNewIntervention] = useState({
    siteId: '',
    category: 'curatif' as 'urgence' | 'curatif' | 'préventif',
    description: '',
    dateRequested: new Date().toISOString().split('T')[0],
    prestataire: '',
    attachments: [] as string[],
    photos: [] as string[],
    comments: [] as string[]
  });

  // Périmètre réellement accessible : un Prestataire ne voit que les
  // interventions de sa propre entreprise, sur les sites qui lui sont
  // attribués ; PM/Propriétaire déjà couverts ailleurs ; DT voit tout.
  const visibleSiteIds = new Set(filterSitesByUser(currentUser, currentRole, sites).map(s => s.id));
  const scopedInterventions = interventions.filter(intervention => {
    if (currentRole === 'Prestataire') {
      return intervention.prestataire === currentUser?.prestataireId && visibleSiteIds.has(intervention.siteId);
    }
    return visibleSiteIds.has(intervention.siteId);
  });

  const filteredInterventions = scopedInterventions.filter(intervention => {
    const matchesSearch = intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || intervention.status === filterStatus;
    const matchesCategory = !filterCategory || intervention.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'En cours': return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'Réalisée': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Clôturée': return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'En cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Réalisée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Clôturée': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgence': return 'bg-red-100 text-red-800';
      case 'curatif': return 'bg-orange-100 text-orange-800';
      case 'préventif': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidationRequirements = (amount: number) => {
    if (amount < 10000) return { devis: 1, validators: ['PM', 'DT'] };
    if (amount < 50000) return { devis: 2, validators: ['PM', 'DT', 'Propriétaire'] };
    if (amount < 100000) return { devis: 3, validators: ['PM', 'DT', 'Propriétaire'] };
    return { devis: 3, validators: ['PM', 'DT', 'Propriétaire', 'Directeur de Pôle'] };
  };

  const handleCreateIntervention = () => {
    const site = sites.find(s => s.id === newIntervention.siteId);
    if (!site) return;

    const requirements = getValidationRequirements(newIntervention.amount);
    
    const intervention: Intervention = {
      id: Date.now().toString(),
      siteId: newIntervention.siteId,
      siteName: site.name,
      category: newIntervention.category,
      description: newIntervention.description,
      dateRequested: newIntervention.dateRequested,
      prestataire: newIntervention.prestataire,
      status: 'En attente',
      validationLevel: 0,
      requiredValidators: ['PM'],
      documents: newIntervention.attachments || [],
      photos: newIntervention.photos || [],
      comments: []
    };

    addIntervention(intervention);
    setShowCreateForm(false);
    setNewIntervention({
      siteId: '',
      category: 'curatif',
      description: '',
      dateRequested: new Date().toISOString().split('T')[0],
      prestataire: '',
      attachments: [],
      photos: [],
      comments: []
    });
  };

  const handleValidateIntervention = (interventionId: string) => {
    const intervention = interventions.find(i => i.id === interventionId);
    if (!intervention) return;

    if (intervention.validationLevel < intervention.requiredValidators.length - 1) {
      updateIntervention(interventionId, {
        validationLevel: intervention.validationLevel + 1
      });
    } else {
      updateIntervention(interventionId, {
        status: 'En cours',
        validationLevel: intervention.requiredValidators.length
      });
    }
  };

  const handleAddAttachment = () => {
    const fileName = `document-${Date.now()}.pdf`;
    setNewIntervention(prev => ({
      ...prev,
      attachments: [...prev.attachments, fileName]
    }));
  };

  const handleAddPhoto = () => {
    const photoName = `photo-${Date.now()}.jpg`;
    setNewIntervention(prev => ({
      ...prev,
      photos: [...prev.photos, photoName],
      comments: []
    }));
  };

  const interventionStats = {
    total: interventions.length,
    enAttente: interventions.filter(i => i.status === 'En attente').length,
    enCours: interventions.filter(i => i.status === 'En cours').length,
    realisees: interventions.filter(i => i.status === 'Réalisée').length,
    cloturees: interventions.filter(i => i.status === 'Clôturée').length
  };
  const handleViewDetails = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowDetailsModal(true);
  };

  const handleRelancePrestataire = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowRelanceForm(true);
  };

  const handleSendRelance = () => {
    if (!selectedIntervention) return;
    
    const updatedComments = [
      ...(selectedIntervention.comments || []),
      `Relance PM: ${relanceMessage} - ${new Date().toLocaleString('fr-FR')}`
    ];
    
    updateIntervention(selectedIntervention.id, { comments: updatedComments });
    setShowRelanceForm(false);
    setRelanceMessage('');
    setSelectedIntervention(null);
  };

  const handleAddComment = () => {
    if (!selectedIntervention || !newComment.trim()) return;
    
    const updatedComments = [
      ...(selectedIntervention.comments || []),
      `${currentRole}: ${newComment} - ${new Date().toLocaleString('fr-FR')}`
    ];
    
    updateIntervention(selectedIntervention.id, { comments: updatedComments });
    setNewComment('');
    
    // Refresh selected intervention
    const updated = { ...selectedIntervention, comments: updatedComments };
    setSelectedIntervention(updated);
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card-unified p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="title-section">Interventions</h1>
            <p className="subtitle-section">{interventions.length} interventions dans le système</p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une intervention
          </button>
        </div>
      </div>

      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg mr-3">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-gray-900">{interventionStats.total}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</p>
              <p className="text-xl font-bold text-gray-900">{interventionStats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg mr-3">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En cours</p>
              <p className="text-xl font-bold text-gray-900">{interventionStats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Réalisées</p>
              <p className="text-xl font-bold text-gray-900">{interventionStats.realisees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card-unified p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une intervention..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="En cours">En cours</option>
            <option value="Réalisée">Réalisée</option>
            <option value="Clôturée">Clôturée</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Toutes les catégories</option>
            <option value="urgence">Urgence</option>
            <option value="curatif">Curatif</option>
            <option value="préventif">Préventif</option>
          </select>
          
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="card-unified">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="title-section">Liste des interventions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date demandée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suivi prestataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInterventions.map((intervention) => {
                return (
                  <tr key={intervention.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(intervention.status)}
                        <span className={`ml-2 status-badge ${getStatusColor(intervention.status)}`}>
                          {intervention.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{intervention.siteName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getCategoryColor(intervention.category)}`}>
                        {intervention.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{intervention.description}</div>
                      {intervention.documents?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          📎 {(intervention.documents || []).length} document(s)
                        </div>
                      )}
                      {intervention.photos?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          📷 {(intervention.photos || []).length} photo(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(intervention.dateRequested).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {prestataires.find(p => p.id === intervention.prestataire)?.name || 'Non assigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {currentRole === 'Prestataire' && intervention.prestataire === currentUser?.prestataireId ? (
                        <select
                          value={intervention.prestataireStatus || 'Non traité'}
                          onChange={(e) => updateIntervention(intervention.id, {
                            prestataireStatus: e.target.value as any,
                            prestataireStatusUpdatedAt: new Date().toLocaleString('fr-FR')
                          })}
                          className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg"
                        >
                          <option value="Non traité">Non traité</option>
                          <option value="Vu / pris en compte">Vu / pris en compte</option>
                          <option value="Devis en cours">Devis en cours</option>
                          <option value="En attente sous-traitant">En attente sous-traitant</option>
                          <option value="Planifié">Planifié</option>
                          <option value="Traité">Traité</option>
                        </select>
                      ) : (
                        <div>
                          <span className="status-badge status-blue">{intervention.prestataireStatus || 'Non traité'}</span>
                          {intervention.prestataireStatusUpdatedAt && (
                            <p className="text-xs text-gray-400 mt-1">{intervention.prestataireStatusUpdatedAt}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(intervention)}
                         className="btn-primary text-sm"
                        >
                          Voir détails
                        </button>
                        {(currentRole === 'PM' || currentRole === 'DT') && intervention.prestataire && (
                          <button
                            onClick={() => handleRelancePrestataire(intervention)}
                           className="btn-primary bg-orange-600 hover:bg-orange-700 text-sm"
                          >
                            Relancer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Créer une nouvelle intervention</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                <select
                  value={newIntervention.siteId}
                  onChange={(e) => setNewIntervention(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={newIntervention.category}
                  onChange={(e) => setNewIntervention(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="urgence">Urgence</option>
                  <option value="curatif">Curatif</option>
                  <option value="préventif">Préventif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newIntervention.description}
                  onChange={(e) => setNewIntervention(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez l'intervention nécessaire..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date souhaitée</label>
                <input
                  type="date"
                  value={newIntervention.dateRequested}
                  onChange={(e) => setNewIntervention(prev => ({ ...prev, dateRequested: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prestataire suggéré</label>
                <select
                  value={newIntervention.prestataire}
                  onChange={(e) => setNewIntervention(prev => ({ ...prev, prestataire: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un prestataire</option>
                  {prestataires.map(prestataire => (
                    <option key={prestataire.id} value={prestataire.id}>{prestataire.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pièces jointes et photos</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter un document
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Ajouter une photo
                    </button>
                  </div>
                  
                  {(newIntervention.attachments.length > 0 || newIntervention.photos.length > 0) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {newIntervention.attachments.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700">Documents:</p>
                          <ul className="text-sm text-gray-600">
                            {newIntervention.attachments.map((doc, index) => (
                              <li key={index}>• {doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {newIntervention.photos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Photos:</p>
                          <ul className="text-sm text-gray-600">
                            {newIntervention.photos.map((photo, index) => (
                              <li key={index}>• {photo}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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
                onClick={handleCreateIntervention}
                className="btn-primary"
              >
                Créer l'intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails de l'intervention</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Site:</strong> {selectedIntervention.siteName}</p>
                  <p><strong>Catégorie:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getCategoryColor(selectedIntervention.category)}`}>
                      {selectedIntervention.category}
                    </span>
                  </p>
                  <p><strong>Description:</strong> {selectedIntervention.description}</p>
                  <p><strong>Date demandée:</strong> {new Date(selectedIntervention.dateRequested).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedIntervention.status)}`}>
                      {selectedIntervention.status}
                    </span>
                  </p>
                  <p><strong>Prestataire:</strong> {prestataires.find(p => p.id === selectedIntervention.prestataire)?.name || 'Non assigné'}</p>
                </div>
              </div>

              {/* Documents et photos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Documents et photos</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents:</p>
                    {(selectedIntervention.documents || []).length > 0 ? (
                      <ul className="text-sm text-gray-600 mt-1">
                        {(selectedIntervention.documents || []).map((doc, index) => (
                          <li key={index}>• {doc}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-500">Aucun document</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Photos:</p>
                    {(selectedIntervention.photos || []).length > 0 ? (
                      <ul className="text-sm text-gray-600 mt-1">
                        {(selectedIntervention.photos || []).map((photo, index) => (
                          <li key={index}>• {photo}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-500">Aucune photo</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Commentaires et échanges */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Échanges et commentaires</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {(selectedIntervention.comments || []).length > 0 ? (
                      (selectedIntervention.comments || []).map((comment, index) => (
                        <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-500">
                          <p className="text-sm text-gray-800">{comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Aucun commentaire</p>
                    )}
                  </div>
                  
                  {/* Ajouter un commentaire */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-primary bg-gray-600 hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de relance prestataire */}
      {showRelanceForm && selectedIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Relancer le prestataire</h2>
              <button
                onClick={() => setShowRelanceForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Intervention:</strong> {selectedIntervention.description}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Prestataire:</strong> {prestataires.find(p => p.id === selectedIntervention.prestataire)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message de relance</label>
                <textarea
                  value={relanceMessage}
                  onChange={(e) => setRelanceMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Merci de nous tenir informés de l'avancement..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRelanceForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendRelance}
               className="btn-primary bg-orange-600 hover:bg-orange-700"
              >
                Envoyer la relance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}