import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link, Plus, Filter, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Connection } from '../types';

export default function Connexion() {
  const { connections, sites, addConnection, updateConnection, currentRole } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [newConnection, setNewConnection] = useState({
    name: '',
    url: '',
    type: 'unidirectionnelle' as 'unidirectionnelle' | 'bidirectionnelle',
    modules: [] as string[],
    sites: [] as string[],
    description: ''
  });

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || connection.status === filterStatus;
    const matchesType = !filterType || connection.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Actif': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Inactif': return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'Erreur': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-800';
      case 'Inactif': return 'bg-gray-100 text-gray-800';
      case 'Erreur': return 'bg-red-100 text-red-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bidirectionnelle': return 'bg-blue-100 text-blue-800';
      case 'unidirectionnelle': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateConnection = () => {
    const connection: Connection = {
      id: Date.now().toString(),
      name: newConnection.name,
      url: newConnection.url,
      type: newConnection.type,
      status: 'Inactif',
      lastSync: 'Jamais',
      modules: newConnection.modules,
      sites: newConnection.sites,
      description: newConnection.description,
      errors: []
    };

    addConnection(connection);
    setShowCreateForm(false);
    setNewConnection({
      name: '',
      url: '',
      type: 'unidirectionnelle',
      modules: [],
      sites: [],
      description: ''
    });
  };

  const handleModuleChange = (module: string) => {
    setNewConnection(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }));
  };

  const handleSiteChange = (siteId: string) => {
    setNewConnection(prev => ({
      ...prev,
      sites: prev.sites.includes(siteId)
        ? prev.sites.filter(s => s !== siteId)
        : [...prev.sites, siteId]
    }));
  };

  const handleToggleConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    const newStatus = connection.status === 'Actif' ? 'Inactif' : 'Actif';

    // Désactiver une connexion coupe la remontée de données pour tous les sites
    // concernés : on exige une confirmation explicite pour éviter une coupure
    // accidentelle en un clic.
    if (newStatus === 'Inactif') {
      const siteCount = connection.sites?.length || 0;
      const confirmed = window.confirm(
        `Désactiver "${connection.name}" interrompra la remontée de données pour ${siteCount} site${siteCount > 1 ? 's' : ''} (${connection.modules?.join(', ') || 'modules concernés'}). Confirmer la désactivation ?`
      );
      if (!confirmed) return;
    }

    const lastSync = newStatus === 'Actif' ? new Date().toLocaleString('fr-FR') : connection.lastSync;

    updateConnection(connectionId, {
      status: newStatus,
      lastSync: lastSync,
      errors: newStatus === 'Actif' ? [] : connection.errors
    });
  };

  const connectionStats = {
    total: connections.length,
    actives: connections.filter(c => c.status === 'Actif').length,
    inactives: connections.filter(c => c.status === 'Inactif').length,
    erreurs: connections.filter(c => c.status === 'Erreur').length
  };

  const availableModules = ['Sites', 'Interventions', 'Conformité', 'Documents', 'Budget PPA', 'ESG', 'Sinistres'];

  // Vérifier que l'utilisateur a les droits d'accès
  if (currentRole !== 'PM' && currentRole !== 'DT') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Ce module est réservé aux Property Managers et Directeurs Techniques.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Link className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{connectionStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actives</p>
              <p className="text-2xl font-bold text-gray-900">{connectionStats.actives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactives</p>
              <p className="text-2xl font-bold text-gray-900">{connectionStats.inactives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Erreurs</p>
              <p className="text-2xl font-bold text-gray-900">{connectionStats.erreurs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connexions API</h1>
          <p className="text-gray-600">{connections.length} connexions configurées</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une connexion
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une connexion..."
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
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Erreur">Erreur</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="unidirectionnelle">Unidirectionnelle</option>
            <option value="bidirectionnelle">Bidirectionnelle</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des connexions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connexions configurées</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConnections.map((connection) => (
                <tr key={connection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                      <div className="text-sm text-gray-500">{connection.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{connection.url}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(connection.type)}`}>
                      {connection.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(connection.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(connection.status)}`}>
                        {connection.status}
                      </span>
                    </div>
                    {connection.errors.length > 0 && (
                      <div className="mt-1">
                        {connection.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-600">
                            • {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{connection.lastSync}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {connection.modules.slice(0, 2).map(module => (
                        <span key={module} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {module}
                        </span>
                      ))}
                      {connection.modules.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{connection.modules.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{connection.sites.length} sites</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleConnection(connection.id)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        connection.status === 'Actif'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {connection.status === 'Actif' ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ajouter une nouvelle connexion</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du service</label>
                  <input
                    type="text"
                    value={newConnection.name}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Yardi Voyager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL API / Endpoint</label>
                  <input
                    type="url"
                    value={newConnection.url}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.service.com/v1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de synchronisation</label>
                <select
                  value={newConnection.type}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unidirectionnelle">Unidirectionnelle (Import uniquement)</option>
                  <option value="bidirectionnelle">Bidirectionnelle (Import/Export)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description d'usage</label>
                <textarea
                  value={newConnection.description}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez l'usage de cette connexion..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Configuration sécurisée</h4>
                <p className="text-sm text-yellow-800">
                  Les clés API, tokens et identifiants OAuth2 seront configurés de manière sécurisée après la création de la connexion.
                </p>
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
                onClick={handleCreateConnection}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer la connexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}