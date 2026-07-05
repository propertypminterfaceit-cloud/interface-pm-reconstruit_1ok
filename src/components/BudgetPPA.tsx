import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DollarSign, Plus, Filter, Search, Calendar, FileText, CheckCircle, Clock, Eye, XCircle, ShieldCheck } from 'lucide-react';
import { BudgetPPA as BudgetPPAType } from '../types';
import { filterBySiteAccess, filterSitesByUser } from '../utils/permissions';

export default function BudgetPPA() {
  const { budgetPPA, sites, addBudgetPPA, updateBudgetPPA, currentRole, currentUser, addAuditEntry } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetPPAType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [validationTarget, setValidationTarget] = useState<{ budget: BudgetPPAType; action: 'Validé' | 'Refusé' } | null>(null);
  const [validationComment, setValidationComment] = useState('');

  const [newBudget, setNewBudget] = useState({
    siteId: '',
    year: new Date().getFullYear(),
    duration: 1,
    amount: 0,
    object: ''
  });

  // Périmètre réellement visible par la personne connectée (DT = tout, PM/Propriétaire = leurs actifs)
  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const visibleBudgetPPA = filterBySiteAccess(budgetPPA, currentUser, currentRole, sites);

  const filteredBudgets = visibleBudgetPPA.filter(budget => {
    const matchesSearch = budget.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || budget.status === filterStatus;
    const matchesSite = !filterSite || budget.siteId === filterSite;
    
    return matchesSearch && matchesStatus && matchesSite;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Non démarré': return 'bg-gray-100 text-gray-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Terminé': return 'bg-green-100 text-green-800';
      case 'Réceptionné': return 'bg-purple-100 text-purple-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Non démarré': return <Clock className="w-5 h-5 text-gray-600" />;
      case 'En cours': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Terminé': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Réceptionné': return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'Annulé': return <CheckCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleCreateBudget = () => {
    const site = sites.find(s => s.id === newBudget.siteId);
    if (!site) return;

    // Si c'est le Propriétaire qui ajoute lui-même la ligne, elle est considérée
    // validée d'emblée (il n'a pas besoin de s'auto-approuver) ; si c'est le PM/DT,
    // elle reste "En attente" jusqu'à validation par le Propriétaire du site concerné.
    const isOwnerCreating = currentRole === 'Propriétaire';
    const now = new Date().toLocaleString('fr-FR');

    const budget: BudgetPPAType = {
      id: Date.now().toString(),
      siteId: newBudget.siteId,
      siteName: site.name,
      year: newBudget.year,
      duration: newBudget.duration,
      amount: newBudget.amount,
      object: newBudget.object,
      status: 'Non démarré',
      pvSigned: false,
      createdByName: currentUser?.name || currentRole,
      createdByRole: currentRole,
      createdAt: now,
      validationStatus: isOwnerCreating ? 'Validé' : 'En attente',
      ...(isOwnerCreating ? { validatedByName: currentUser?.name, validatedAt: now, validationComment: 'Ligne ajoutée directement par le Propriétaire' } : {})
    };

    addBudgetPPA(budget);
    setShowCreateForm(false);
    setNewBudget({
      siteId: '',
      year: new Date().getFullYear(),
      duration: 1,
      amount: 0,
      object: ''
    });
  };

  const openValidationDialog = (budget: BudgetPPAType, action: 'Validé' | 'Refusé') => {
    setValidationTarget({ budget, action });
    setValidationComment('');
  };

  const confirmValidation = () => {
    if (!validationTarget) return;
    const now = new Date().toLocaleString('fr-FR');
    updateBudgetPPA(validationTarget.budget.id, {
      validationStatus: validationTarget.action,
      validatedByName: currentUser?.name || currentRole,
      validatedAt: now,
      validationComment: validationComment.trim() || undefined
    });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'BudgetPPA',
      entityId: validationTarget.budget.id,
      entityLabel: `${validationTarget.budget.object} — ${validationTarget.budget.siteName}`,
      action: validationTarget.action,
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: now,
      comment: validationComment.trim() || undefined
    });
    setValidationTarget(null);
    setValidationComment('');
  };

  const handleSignPV = (budgetId: string) => {
    updateBudgetPPA(budgetId, {
      pvSigned: true,
      signatureDate: new Date().toISOString().split('T')[0],
      status: 'Réceptionné'
    });
  };

  const handleAddDevis = (budgetId: string) => {
    updateBudgetPPA(budgetId, {
      devis: `devis-${budgetId}.pdf`
    });
  };

  const handleViewBudget = (budget: BudgetPPAType) => {
    setSelectedBudget(budget);
    setShowBudgetDetails(true);
  };

  const budgetStats = {
    total: visibleBudgetPPA.length,
    totalAmount: visibleBudgetPPA.reduce((sum, budget) => sum + budget.amount, 0),
    nonDemarre: visibleBudgetPPA.filter(b => b.status === 'Non démarré').length,
    enCours: visibleBudgetPPA.filter(b => b.status === 'En cours').length,
    termine: visibleBudgetPPA.filter(b => b.status === 'Terminé').length,
    receptionne: visibleBudgetPPA.filter(b => b.status === 'Réceptionné').length
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projets</p>
              <p className="text-2xl font-bold text-gray-900">{budgetStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget Total</p>
              <p className="text-2xl font-bold text-gray-900">{budgetStats.totalAmount.toLocaleString()}€</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{budgetStats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Réceptionnés</p>
              <p className="text-2xl font-bold text-gray-900">{budgetStats.receptionne}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget PPA / CAPEX</h1>
          <p className="text-gray-600">{visibleBudgetPPA.length} projets au total</p>
        </div>
        
        {(currentRole === 'PM' || currentRole === 'DT' || currentRole === 'Propriétaire') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une ligne au PPA
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
              placeholder="Rechercher un projet..."
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
            <option value="Non démarré">Non démarré</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Réceptionné">Réceptionné</option>
            <option value="Annulé">Annulé</option>
          </select>
          
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les sites</option>
            {visibleSites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des budgets PPA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Projets PPA / CAPEX</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validation Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PV Signé
                </th>
                {(currentRole === 'PM' || currentRole === 'DT' || currentRole === 'Propriétaire') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBudgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(budget.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {budget.validationStatus === 'Validé' && (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validé
                        </span>
                        {budget.validatedByName && (
                          <div className="text-xs text-gray-400 mt-1">par {budget.validatedByName}{budget.validatedAt ? ` le ${budget.validatedAt}` : ''}</div>
                        )}
                      </div>
                    )}
                    {budget.validationStatus === 'Refusé' && (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Refusé
                        </span>
                        {budget.validatedByName && (
                          <div className="text-xs text-gray-400 mt-1">par {budget.validatedByName}{budget.validatedAt ? ` le ${budget.validatedAt}` : ''}</div>
                        )}
                        {budget.validationComment && (
                          <div className="text-xs text-gray-500 mt-0.5 italic">"{budget.validationComment}"</div>
                        )}
                      </div>
                    )}
                    {(!budget.validationStatus || budget.validationStatus === 'En attente') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5 mr-1" /> En attente
                      </span>
                    )}
                    {budget.createdByName && (
                      <div className="text-xs text-gray-400 mt-1">Ajouté par {budget.createdByName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{budget.siteName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{budget.object}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{budget.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{budget.duration} an{budget.duration > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{budget.amount.toLocaleString()}€</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {budget.devis ? (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-600">Disponible</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Aucun devis</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {budget.pvSigned ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <div>
                          <div className="text-sm text-green-600">Signé</div>
                          {budget.signatureDate && (
                            <div className="text-xs text-gray-500">
                              {new Date(budget.signatureDate).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Non signé</span>
                    )}
                  </td>
                  {(currentRole === 'PM' || currentRole === 'DT' || currentRole === 'Propriétaire') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewBudget(budget)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!budget.devis && (currentRole === 'PM' || currentRole === 'DT') && (
                          <button
                            onClick={() => handleAddDevis(budget.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Ajouter devis
                          </button>
                        )}
                        {currentRole === 'Propriétaire' && (!budget.validationStatus || budget.validationStatus === 'En attente') && (
                          <>
                            <button
                              onClick={() => openValidationDialog(budget, 'Validé')}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => openValidationDialog(budget, 'Refusé')}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        {budget.status === 'Terminé' && !budget.pvSigned && currentRole === 'Propriétaire' && (
                          <button
                            onClick={() => handleSignPV(budget.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Signer PV
                          </button>
                        )}
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900">Créer un nouveau projet PPA</h2>
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
                  value={newBudget.siteId}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un site</option>
                  {visibleSites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objet du projet</label>
                <input
                  type="text"
                  value={newBudget.object}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, object: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Rénovation système CTA"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                  <input
                    type="number"
                    value={newBudget.year}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phasage (années)</label>
                  <select
                    value={newBudget.duration}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 an</option>
                    <option value={2}>2 ans</option>
                    <option value={3}>3 ans</option>
                    <option value={4}>4 ans</option>
                    <option value={5}>5 ans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant (€)</label>
                  <input
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
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
                onClick={handleCreateBudget}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer le projet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du budget */}
      {showBudgetDetails && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails du projet PPA - {selectedBudget.object}</h2>
              <button
                onClick={() => setShowBudgetDetails(false)}
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
                  <p><strong>Site:</strong> {selectedBudget.siteName}</p>
                  <p><strong>Objet:</strong> {selectedBudget.object}</p>
                  <p><strong>Année:</strong> {selectedBudget.year}</p>
                  <p><strong>Durée:</strong> {selectedBudget.duration} an{selectedBudget.duration > 1 ? 's' : ''}</p>
                  <p><strong>Montant:</strong> {selectedBudget.amount.toLocaleString()}€</p>
                  <p><strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedBudget.status)}`}>
                      {selectedBudget.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Documents et validation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Documents et validation</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Devis:</p>
                    {selectedBudget.devis ? (
                      <div className="flex items-center mt-1">
                        <FileText className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-600">Disponible - {selectedBudget.devis}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Aucun devis disponible</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">PV de réception:</p>
                    {selectedBudget.pvSigned ? (
                      <div className="flex items-center mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <div>
                          <span className="text-sm text-green-600">Signé</span>
                          {selectedBudget.signatureDate && (
                            <div className="text-xs text-gray-500">
                              Le {new Date(selectedBudget.signatureDate).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Non signé</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Validation Propriétaire:</p>
                    {selectedBudget.createdByName && (
                      <p className="text-xs text-gray-500">Ligne ajoutée par {selectedBudget.createdByName} ({selectedBudget.createdByRole}){selectedBudget.createdAt ? ` le ${selectedBudget.createdAt}` : ''}</p>
                    )}
                    {selectedBudget.validationStatus === 'Validé' && (
                      <p className="text-sm text-green-700 mt-1">✓ Validée par {selectedBudget.validatedByName} le {selectedBudget.validatedAt}</p>
                    )}
                    {selectedBudget.validationStatus === 'Refusé' && (
                      <div className="mt-1">
                        <p className="text-sm text-red-700">✗ Refusée par {selectedBudget.validatedByName} le {selectedBudget.validatedAt}</p>
                        {selectedBudget.validationComment && (
                          <p className="text-xs text-gray-600 italic mt-1">"{selectedBudget.validationComment}"</p>
                        )}
                      </div>
                    )}
                    {(!selectedBudget.validationStatus || selectedBudget.validationStatus === 'En attente') && (
                      <p className="text-sm text-amber-700 mt-1">En attente de validation par le Propriétaire</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Historique et suivi */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Historique du projet</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Projet créé - {selectedBudget.year}</span>
                    </div>
                    {selectedBudget.devis && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm">Devis ajouté</span>
                      </div>
                    )}
                    {selectedBudget.pvSigned && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm">PV signé - {selectedBudget.signatureDate && new Date(selectedBudget.signatureDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBudgetDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modale de validation / refus d'une ligne PPA par le Propriétaire */}
      {validationTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {validationTarget.action === 'Validé' ? 'Valider' : 'Refuser'} la ligne PPA
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {validationTarget.budget.object} — {validationTarget.budget.siteName} ({validationTarget.budget.amount.toLocaleString()}€)
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire {validationTarget.action === 'Refusé' ? '(recommandé pour expliquer le refus)' : '(optionnel)'}
            </label>
            <textarea
              value={validationComment}
              onChange={(e) => setValidationComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Ex: Montant à revoir avant validation définitive"
            />
            <p className="text-xs text-gray-400 mb-4">
              Cette action sera horodatée et associée à votre nom ({currentUser?.name || currentRole}).
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setValidationTarget(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmValidation}
                className={`px-4 py-2 text-white rounded-lg ${validationTarget.action === 'Validé' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirmer {validationTarget.action === 'Validé' ? 'la validation' : 'le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}