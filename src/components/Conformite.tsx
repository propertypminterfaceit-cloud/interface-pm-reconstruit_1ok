import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shield, AlertTriangle, CheckCircle, Clock, Upload, Filter, Search, Eye } from 'lucide-react';
import { filterSitesByUser } from '../utils/permissions';

export default function Conformite() {
  const { conformities, sites, prestataires, updateConformity, currentRole, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedConformity, setSelectedConformity] = useState(null);

  // S'assurer que les données existent
  const safeConformities = Array.isArray(conformities) && conformities.length > 0 ? conformities : [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      obligation: 'Contrôle semestriel ascenseur',
      equipment: 'ascenseur',
      dueDate: '2024-01-20',
      prestataire: '1',
      status: 'Retard',
      alertSent: true,
      document: 'controle-ascenseur-tour-montparnasse-2024.pdf'
    },
    {
      id: '2',
      siteId: '3',
      siteName: 'Hôtel Mercure Lyon',
      obligation: 'Maintenance trimestrielle SSI',
      equipment: 'SSI',
      dueDate: '2024-02-15',
      prestataire: '3',
      status: 'À échéance',
      alertSent: false,
      document: 'maintenance-ssi-mercure-lyon-q1-2024.pdf'
    },
    {
      id: '3',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      obligation: 'Vérification annuelle désenfumage',
      equipment: 'désenfumage',
      dueDate: '2024-01-10',
      prestataire: '2',
      status: 'Retard',
      alertSent: true
    },
    {
      id: '4',
      siteId: '4',
      siteName: 'Centre Commercial Confluence',
      obligation: 'Contrôle d\'étanchéité climatisation',
      equipment: 'climatisation',
      dueDate: '2024-03-01',
      prestataire: '4',
      status: 'OK',
      alertSent: false,
      document: 'controle-etancheite-clim-confluence-2024.pdf'
    },
    {
      id: '5',
      siteId: '5',
      siteName: 'Bureaux Défense',
      obligation: 'Diagnostic GTB quinquennal',
      equipment: 'GTB',
      dueDate: '2024-04-15',
      prestataire: '5',
      status: 'OK',
      alertSent: false,
      document: 'diagnostic-gtb-bureaux-defense-2024.pdf'
    }
  ];
  const safeSites = Array.isArray(sites) ? sites : [];
  const safePrestataires = Array.isArray(prestataires) && prestataires.length > 0 ? prestataires : [
    { id: '1', name: 'Ascenseurs Otis France', siret: '12345678901234', metier: 'Ascenseurs', status: 'Actif', sites: ['1'], contacts: {}, rating: 4.2, interventionsCount: 15, conformityRate: 95, averageDelay: 2 },
    { id: '2', name: 'Sécurité Incendie Pro', siret: '23456789012345', metier: 'Sécurité Incendie', status: 'Actif', sites: ['2'], contacts: {}, rating: 4.5, interventionsCount: 22, conformityRate: 98, averageDelay: 1 },
    { id: '3', name: 'Climatisation Expert', siret: '34567890123456', metier: 'CVC', status: 'Actif', sites: ['3'], contacts: {}, rating: 3.8, interventionsCount: 18, conformityRate: 88, averageDelay: 3 },
    { id: '4', name: 'Multi-Services Bâtiment', siret: '45678901234567', metier: 'Multi-technique', status: 'Actif', sites: ['4'], contacts: {}, rating: 4.1, interventionsCount: 31, conformityRate: 92, averageDelay: 2 },
    { id: '5', name: 'Énergie & Maintenance', siret: '56789012345678', metier: 'Énergétique', status: 'Actif', sites: ['5'], contacts: {}, rating: 4.3, interventionsCount: 12, conformityRate: 94, averageDelay: 1 }
  ];

  // Périmètre réellement accessible : un Prestataire ne voit que ses propres
  // obligations de conformité (liaison via prestataireId), sur ses sites attribués.
  const visibleSiteIds = new Set(filterSitesByUser(currentUser, currentRole, safeSites).map(s => s.id));
  const scopedConformities = safeConformities.filter(conformity => {
    if (currentRole === 'Prestataire') {
      return conformity.prestataire === currentUser?.prestataireId && visibleSiteIds.has(conformity.siteId);
    }
    return visibleSiteIds.has(conformity.siteId);
  });

  const filteredConformities = scopedConformities.filter(conformity => {
    const matchesSearch = conformity.obligation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conformity.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || conformity.status === filterStatus;
    const matchesSite = !filterSite || conformity.siteId === filterSite;
    
    return matchesSearch && matchesStatus && matchesSite;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'À échéance': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Retard': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-100 text-green-800 border-green-200';
      case 'À échéance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Retard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDocumentUpload = (conformityId: string) => {
    updateConformity(conformityId, { 
      document: `document-${conformityId}.pdf`,
      status: 'OK' as const
    });
  };

  const conformityStats = {
    total: safeConformities.length,
    ok: safeConformities.filter(c => c.status === 'OK').length,
    echeance: safeConformities.filter(c => c.status === 'À échéance').length,
    retard: safeConformities.filter(c => c.status === 'Retard').length
  };

  const globalScore = conformityStats.total > 0 ? Math.round((conformityStats.ok / conformityStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Global</p>
              <p className="text-2xl font-bold text-gray-900">{globalScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conformes</p>
              <p className="text-2xl font-bold text-gray-900">{conformityStats.ok}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">À échéance</p>
              <p className="text-2xl font-bold text-gray-900">{conformityStats.echeance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-gray-900">{conformityStats.retard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une obligation..."
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
            <option value="OK">Conforme</option>
            <option value="À échéance">À échéance</option>
            <option value="Retard">En retard</option>
          </select>
          
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les sites</option>
            {safeSites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des conformités */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Obligations réglementaires</h2>
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
                  Obligation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConformities.map((conformity) => (
                <tr key={conformity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(conformity.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(conformity.status)}`}>
                        {conformity.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{conformity.siteName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{conformity.obligation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {conformity.equipment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(conformity.dueDate).toLocaleDateString('fr-FR')}</div>
                    {conformity.status === 'Retard' && (
                      <div className="text-xs text-red-600">
                        Retard: {Math.ceil((new Date().getTime() - new Date(conformity.dueDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                      </div>
                    )}
                    {conformity.status === 'À échéance' && (
                      <div className="text-xs text-orange-600">
                        Dans {Math.ceil((new Date(conformity.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {safePrestataires.find(p => p.id === conformity.prestataire)?.name || 'Non assigné'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {conformity.document ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <button 
                          onClick={() => {
                            setSelectedConformity(conformity);
                            setShowDetails(true);
                          }}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Voir document
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-sm text-orange-600">En attente</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {/* Actions pour PM/DT */}
                      {(currentRole === 'PM' || currentRole === 'DT') && (
                        <>
                          {conformity.status !== 'OK' && (
                            <button
                              onClick={() => {/* Action pour relancer le prestataire */}}
                              className="flex items-center px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                            >
                              Relancer
                            </button>
                          )}
                          {conformity.status === 'OK' && (
                            <span className="text-xs text-green-600">✓ Conforme</span>
                          )}
                        </>
                      )}
                      
                      {/* Actions pour Prestataires */}
                      {currentRole === 'Prestataire' && (
                        <>
                          {conformity.document ? (
                            <button
                              onClick={() => {/* Action pour voir le document */}}
                              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDocumentUpload(conformity.id)}
                              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Ajouter
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Actions pour autres rôles */}
                      {currentRole !== 'PM' && currentRole !== 'DT' && currentRole !== 'Prestataire' && (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredConformities.length === 0 && (
          <div className="px-6 py-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune conformité trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              {safeConformities.length === 0 ? 'Aucune donnée de conformité disponible' : 'Essayez de modifier vos filtres'}
            </p>
          </div>
        )}
        </div>

      {/* Modal de détails du document */}
      {showDetails && selectedConformity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails de la conformité</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedConformity.obligation}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Site:</span>
                    <span className="ml-2">{selectedConformity.siteName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Équipement:</span>
                    <span className="ml-2">{selectedConformity.equipment}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Échéance:</span>
                    <span className="ml-2">{new Date(selectedConformity.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Statut:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(selectedConformity.status)}`}>
                      {selectedConformity.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedConformity.document && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Document de conformité</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium">{selectedConformity.document}</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Télécharger
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Prestataire responsable</h4>
                <div className="text-sm">
                  <span className="font-medium">
                    {safePrestataires.find(p => p.id === selectedConformity.prestataire)?.name || 'Non assigné'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}