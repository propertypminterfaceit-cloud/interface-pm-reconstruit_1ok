import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, Plus, Filter, Search, Camera, FileText, Wrench } from 'lucide-react';
import { Sinistre } from '../types';

export default function Sinistres() {
  const { sinistres, sites, addSinistre, updateSinistre, addIntervention, currentRole } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [newSinistre, setNewSinistre] = useState({
    siteId: '',
    type: '',
    customType: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    description: '',
    isCustomType: false
  });

  const filteredSinistres = sinistres.filter(sinistre => {
    const matchesSearch = sinistre.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sinistre.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || sinistre.status === filterStatus;
    const matchesType = !filterType || sinistre.type.toLowerCase().includes(filterType.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Déclaré': return 'bg-blue-100 text-blue-800';
      case 'Expertise': return 'bg-orange-100 text-orange-800';
      case 'Accepté': return 'bg-green-100 text-green-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      case 'Clôturé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dégât des eaux': return 'bg-blue-100 text-blue-800';
      case 'incendie': return 'bg-red-100 text-red-800';
      case 'vol': return 'bg-purple-100 text-purple-800';
      case 'vandalisme': return 'bg-orange-100 text-orange-800';
      case 'bris de glace': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateSinistre = () => {
    const site = sites.find(s => s.id === newSinistre.siteId);
    if (!site) return;

    const sinistre: Sinistre = {
      id: Date.now().toString(),
      siteId: newSinistre.siteId,
      siteName: site.name,
      type: newSinistre.isCustomType ? newSinistre.customType : newSinistre.type,
      date: newSinistre.date,
      time: newSinistre.time,
      location: newSinistre.location,
      description: newSinistre.description,
      status: 'Déclaré',
      photos: newSinistre.photos || [],
      interventionGenerated: false
    };

    addSinistre(sinistre);
    setShowCreateForm(false);
    setNewSinistre({
      siteId: '',
      type: '',
      customType: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      description: '',
      isCustomType: false
    });
  };

  const handleGenerateIntervention = (sinistreId: string) => {
    const sinistre = sinistres.find(s => s.id === sinistreId);
    if (!sinistre) return;

    const intervention = {
      id: Date.now().toString(),
      siteId: sinistre.siteId,
      siteName: sinistre.siteName,
      category: 'urgence' as const,
      description: `Intervention conservatoire suite sinistre: ${sinistre.description}`,
      dateRequested: new Date().toISOString().split('T')[0],
      amount: 0,
      status: 'En attente' as const,
      validationLevel: 0,
      requiredValidators: ['PM', 'DT'],
      documents: [],
      photos: []
    };

    addIntervention(intervention);
    updateSinistre(sinistreId, { interventionGenerated: true });
  };

  const sinistreStats = {
    total: sinistres.length,
    declares: sinistres.filter(s => s.status === 'Déclaré').length,
    expertise: sinistres.filter(s => s.status === 'Expertise').length,
    acceptes: sinistres.filter(s => s.status === 'Accepté').length,
    refuses: sinistres.filter(s => s.status === 'Refusé').length,
    clotures: sinistres.filter(s => s.status === 'Clôturé').length
  };

  const sinistreTypes = ['Dégât des eaux', 'Incendie', 'Vol', 'Vandalisme', 'Bris de glace', 'Autre'];

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{sinistreStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Déclarés</p>
              <p className="text-2xl font-bold text-gray-900">{sinistreStats.declares}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expertise</p>
              <p className="text-2xl font-bold text-gray-900">{sinistreStats.expertise}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acceptés</p>
              <p className="text-2xl font-bold text-gray-900">{sinistreStats.acceptes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clôturés</p>
              <p className="text-2xl font-bold text-gray-900">{sinistreStats.clotures}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sinistres</h1>
          <p className="text-gray-600">{sinistres.length} sinistres au total</p>
        </div>
        
        {currentRole !== 'Propriétaire' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Déclarer un sinistre
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
              placeholder="Rechercher un sinistre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="Déclaré">Déclaré</option>
            <option value="Expertise">Expertise</option>
            <option value="Accepté">Accepté</option>
            <option value="Refusé">Refusé</option>
            <option value="Clôturé">Clôturé</option>
          </select>
          
          <input
            type="text"
            placeholder="Filtrer par type..."
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des sinistres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des sinistres</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intervention
                </th>
                {(currentRole === 'PM' || currentRole === 'DT') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSinistres.map((sinistre) => (
                <tr key={sinistre.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sinistre.siteName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(sinistre.type)}`}>
                      {sinistre.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(sinistre.date).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{sinistre.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(sinistre.status)}`}>
                      {sinistre.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Camera className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{sinistre.photos.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sinistre.interventionGenerated ? (
                      <div className="flex items-center">
                        <Wrench className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-600">Générée</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Aucune</span>
                    )}
                  </td>
                  {(currentRole === 'PM' || currentRole === 'DT') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!sinistre.interventionGenerated && (
                        <button
                          onClick={() => handleGenerateIntervention(sinistre.id)}
                          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                        >
                          Générer intervention
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Déclarer un nouveau sinistre</h2>
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
                  value={newSinistre.siteId}
                  onChange={(e) => setNewSinistre(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de sinistre</label>
                  <select
                    value={newSinistre.type}
                    onChange={(e) => setNewSinistre(prev => ({ 
                      ...prev, 
                      type: e.target.value,
                      isCustomType: e.target.value === 'Autre'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {sinistreTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {newSinistre.isCustomType && (
                    <input
                      type="text"
                      value={newSinistre.customType}
                      onChange={(e) => setNewSinistre(prev => ({ ...prev, customType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="Précisez le type de sinistre"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date du sinistre</label>
                    <input
                      type="date"
                      value={newSinistre.date}
                      onChange={(e) => setNewSinistre(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure (optionnel)</label>
                    <input
                      type="time"
                      value={newSinistre.time}
                      onChange={(e) => setNewSinistre(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation (optionnel)</label>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date du sinistre</label>
                  <input
                    type="text"
                    value={newSinistre.location}
                    onChange={(e) => setNewSinistre(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Niveau 3, Extérieur parking, Hall d'entrée..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description détaillée</label>
                <textarea
                  value={newSinistre.description}
                  onChange={(e) => setNewSinistre(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez le sinistre en détail..."
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Ajoutez des photos du sinistre</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG jusqu'à 5MB par photo</p>
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
                onClick={handleCreateSinistre}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Déclarer le sinistre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}