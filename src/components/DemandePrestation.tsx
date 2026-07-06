import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ClipboardList, Plus, Filter, Search, Eye, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { DemandePrestation as DemandeType } from '../types';

export default function DemandePrestation() {
  const { demandesPrestation, sites, bpuItems, addDemandePrestation, updateDemandePrestation, currentRole, currentUser } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandeType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const [newDemande, setNewDemande] = useState({
    siteId: '',
    localisation: '',
    typePrestation: 'Propreté' as 'Propreté' | 'Sécurité' | 'Maintenance' | 'Travaux' | 'Espaces verts' | 'Autres',
    modalite: 'BPU' as 'BPU' | 'DEVIS' | 'CONTRAT',
    description: '',
    lignes: [] as { poste: string; quantite: number; unite: string; prixUnitaireHT?: number }[]
  });

  const filteredDemandes = demandesPrestation.filter(demande => {
    const matchesSearch = demande.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demande.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || demande.status === filterStatus;
    const matchesType = !filterType || demande.typePrestation === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Brouillon': return 'bg-gray-100 text-gray-800';
      case 'Transmise': return 'bg-blue-100 text-blue-800';
      case 'En attente de devis': return 'bg-orange-100 text-orange-800';
      case 'Chiffrage reçu': return 'bg-purple-100 text-purple-800';
      case 'Refusée': return 'bg-red-100 text-red-800';
      case 'Acceptée': return 'bg-green-100 text-green-800';
      case 'Programmée': return 'bg-indigo-100 text-indigo-800';
      case 'Clôturée': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Brouillon': return <FileText className="w-5 h-5 text-gray-600" />;
      case 'Transmise': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'En attente de devis': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Chiffrage reçu': return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'Refusée': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Acceptée': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Programmée': return <CheckCircle className="w-5 h-5 text-indigo-600" />;
      case 'Clôturée': return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleCreateDemande = () => {
    const site = sites.find(s => s.id === newDemande.siteId);
    if (!site || !currentUser) return;

    const isFromPrestataire = currentRole === 'Prestataire';

    const demande: DemandeType = {
      id: Date.now().toString(),
      siteId: newDemande.siteId,
      siteName: site.name,
      localisation: newDemande.localisation,
      typePrestation: newDemande.typePrestation,
      modalite: newDemande.modalite,
      description: newDemande.description,
      dateCreation: new Date().toISOString().split('T')[0],
      createdBy: currentUser.id,
      // Un prestataire signale directement un besoin au PM (pas de brouillon) ;
      // un PM/DT part d'un brouillon qu'il complète avant transmission.
      status: isFromPrestataire ? 'Transmise' : 'Brouillon',
      lignes: newDemande.lignes.map((ligne, index) => ({
        id: (index + 1).toString(),
        poste: ligne.poste,
        quantite: ligne.quantite,
        unite: ligne.unite,
        prixUnitaireHT: ligne.prixUnitaireHT,
        montantHT: ligne.prixUnitaireHT ? ligne.quantite * ligne.prixUnitaireHT : undefined
      })),
      montantTotal: newDemande.lignes.reduce((total, ligne) => 
        total + (ligne.prixUnitaireHT ? ligne.quantite * ligne.prixUnitaireHT : 0), 0
      ),
      historique: [{
        date: new Date().toISOString().split('T')[0],
        action: isFromPrestataire ? 'Signalée par le prestataire' : 'Création',
        utilisateur: currentUser.name
      }]
    };

    addDemandePrestation(demande);
    setShowCreateForm(false);
    setNewDemande({
      siteId: '',
      localisation: '',
      typePrestation: 'Propreté',
      modalite: 'BPU',
      description: '',
      lignes: []
    });
  };

  const handleAddLigne = () => {
    setNewDemande(prev => ({
      ...prev,
      lignes: [...prev.lignes, { poste: '', quantite: 1, unite: 'm²' }]
    }));
  };

  const handleUpdateLigne = (index: number, field: string, value: any) => {
    setNewDemande(prev => ({
      ...prev,
      lignes: prev.lignes.map((ligne, i) => 
        i === index ? { ...ligne, [field]: value } : ligne
      )
    }));
  };

  const handleRemoveLigne = (index: number) => {
    setNewDemande(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const handleTransmitDemande = (demandeId: string) => {
    updateDemandePrestation(demandeId, { 
      status: 'Transmise',
      historique: [
        ...(demandesPrestation.find(d => d.id === demandeId)?.historique || []),
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Transmission',
          utilisateur: currentUser?.name || 'Utilisateur'
        }
      ]
    });
  };

  const handleViewDetails = (demande: DemandeType) => {
    setSelectedDemande(demande);
    setShowDetailsModal(true);
  };

  const demandeStats = {
    total: demandesPrestation.length,
    brouillons: demandesPrestation.filter(d => d.status === 'Brouillon').length,
    transmises: demandesPrestation.filter(d => d.status === 'Transmise').length,
    enAttente: demandesPrestation.filter(d => d.status === 'En attente de devis').length,
    acceptees: demandesPrestation.filter(d => d.status === 'Acceptée').length
  };

  const prestationTypes = ['Propreté', 'Sécurité', 'Maintenance', 'Travaux', 'Espaces verts', 'Autres'];
  const unites = ['m²', 'ml', 'unité', 'heure', 'forfait', 'kg', 'litre'];

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{demandeStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">{demandeStats.brouillons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{demandeStats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acceptées</p>
              <p className="text-2xl font-bold text-gray-900">{demandeStats.acceptees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de Prestation</h1>
          <p className="text-gray-600">{demandesPrestation.length} demandes au total</p>
        </div>
        
        {(currentRole === 'PM' || currentRole === 'DT' || currentRole === 'Prestataire') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {currentRole === 'Prestataire' ? 'Signaler un besoin au PM' : 'Créer une demande'}
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
              placeholder="Rechercher une demande..."
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
            <option value="Brouillon">Brouillon</option>
            <option value="Transmise">Transmise</option>
            <option value="En attente de devis">En attente de devis</option>
            <option value="Chiffrage reçu">Chiffrage reçu</option>
            <option value="Acceptée">Acceptée</option>
            <option value="Refusée">Refusée</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            {prestationTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Demandes de prestation</h2>
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modalité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDemandes.map((demande) => (
                <tr key={demande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(demande.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(demande.status)}`}>
                        {demande.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{demande.siteName}</div>
                    <div className="text-sm text-gray-500">{demande.localisation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {demande.typePrestation}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{demande.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {demande.modalite}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {demande.montantTotal ? `${demande.montantTotal.toLocaleString()}€ HT` : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(demande)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {demande.status === 'Brouillon' && (currentRole === 'PM' || currentRole === 'DT') && (
                        <button
                          onClick={() => handleTransmitDemande(demande.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Transmettre
                        </button>
                      )}
                    </div>
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
              <h2 className="text-xl font-bold text-gray-900">Créer une demande de prestation</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                  <select
                    value={newDemande.siteId}
                    onChange={(e) => setNewDemande(prev => ({ ...prev, siteId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un site</option>
                    {(currentRole === 'Prestataire' ? sites.filter(s => (currentUser?.sites || []).includes(s.id)) : sites).map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                  <input
                    type="text"
                    value={newDemande.localisation}
                    onChange={(e) => setNewDemande(prev => ({ ...prev, localisation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Niveau 3 - Hall d'accueil"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de prestation</label>
                  <select
                    value={newDemande.typePrestation}
                    onChange={(e) => setNewDemande(prev => ({ ...prev, typePrestation: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {prestationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modalité</label>
                  <select
                    value={newDemande.modalite}
                    onChange={(e) => setNewDemande(prev => ({ ...prev, modalite: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BPU">BPU (Bordereau de Prix Unitaires)</option>
                    <option value="DEVIS">Devis sur mesure</option>
                    <option value="CONTRAT">Contrat existant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newDemande.description}
                  onChange={(e) => setNewDemande(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez la prestation demandée..."
                />
              </div>

              {newDemande.modalite === 'BPU' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Lignes de prestation</h3>
                    <button
                      onClick={handleAddLigne}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Ajouter une ligne
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newDemande.lignes.map((ligne, index) => (
                      <div key={index} className="grid grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Poste</label>
                          <input
                            type="text"
                            value={ligne.poste}
                            onChange={(e) => handleUpdateLigne(index, 'poste', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="Ex: Sol dur"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                          <input
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => handleUpdateLigne(index, 'quantite', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unité</label>
                          <select
                            value={ligne.unite}
                            onChange={(e) => handleUpdateLigne(index, 'unite', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            {unites.map(unite => (
                              <option key={unite} value={unite}>{unite}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire HT</label>
                          <input
                            type="number"
                            step="0.01"
                            value={ligne.prixUnitaireHT || ''}
                            onChange={(e) => handleUpdateLigne(index, 'prixUnitaireHT', parseFloat(e.target.value) || undefined)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => handleRemoveLigne(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {newDemande.lignes.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">
                        Total estimé: {newDemande.lignes.reduce((total, ligne) => 
                          total + (ligne.prixUnitaireHT ? ligne.quantite * ligne.prixUnitaireHT : 0), 0
                        ).toLocaleString()}€ HT
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateDemande}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails de la demande</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Site:</strong> {selectedDemande.siteName}</p>
                  <p><strong>Localisation:</strong> {selectedDemande.localisation}</p>
                  <p><strong>Type:</strong> {selectedDemande.typePrestation}</p>
                  <p><strong>Modalité:</strong> {selectedDemande.modalite}</p>
                  <p><strong>Description:</strong> {selectedDemande.description}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedDemande.status)}`}>
                      {selectedDemande.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Détails financiers</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Montant total:</strong> {selectedDemande.montantTotal ? `${selectedDemande.montantTotal.toLocaleString()}€ HT` : 'Non défini'}</p>
                  <p><strong>Date de création:</strong> {new Date(selectedDemande.dateCreation).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {selectedDemande.lignes && selectedDemande.lignes.length > 0 && (
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900">Lignes de prestation</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Poste</th>
                          <th className="text-right py-2">Quantité</th>
                          <th className="text-center py-2">Unité</th>
                          <th className="text-right py-2">Prix unitaire HT</th>
                          <th className="text-right py-2">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDemande.lignes.map((ligne) => (
                          <tr key={ligne.id} className="border-b border-gray-100">
                            <td className="py-2">{ligne.poste}</td>
                            <td className="text-right py-2">{ligne.quantite}</td>
                            <td className="text-center py-2">{ligne.unite}</td>
                            <td className="text-right py-2">{ligne.prixUnitaireHT ? `${ligne.prixUnitaireHT.toFixed(2)}€` : '—'}</td>
                            <td className="text-right py-2 font-medium">{ligne.montantHT ? `${ligne.montantHT.toFixed(2)}€` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
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