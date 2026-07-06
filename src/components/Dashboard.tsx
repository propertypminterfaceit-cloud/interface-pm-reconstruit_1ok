import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { BarChart3, AlertTriangle, CheckCircle, Clock, MapPin, FileText, Wrench, DollarSign, Users, FileBarChart } from 'lucide-react';
import { filterSitesByUser, filterBySiteAccess } from '../utils/permissions';
import RapportSynthese from './RapportSynthese';

export default function Dashboard() {
  const { 
    sites, interventions, sinistres, documents, conformities, alerts, currentRole, currentUser, users,
    budgetPPA, demandesPrestation, setActiveTab
  } = useStore();
  const [showRapport, setShowRapport] = useState(false);

  // Périmètre réellement visible par la personne connectée (DT = tout, PM/Propriétaire = leurs actifs)
  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const visibleSiteIds = new Set(visibleSites.map(s => s.id));
  const visibleInterventions = filterBySiteAccess(interventions, currentUser, currentRole, sites);
  const visibleSinistres = filterBySiteAccess(sinistres, currentUser, currentRole, sites);
  const visibleDocuments = filterBySiteAccess(documents, currentUser, currentRole, sites);
  const visibleConformities = filterBySiteAccess(conformities, currentUser, currentRole, sites);
  const visibleBudgetPPA = filterBySiteAccess(budgetPPA, currentUser, currentRole, sites);

  const stats = {
    sites: visibleSites.length,
    interventions: visibleInterventions.filter(i => i.status === 'En attente').length,
    sinistres: visibleSinistres.filter(s => s.status === 'En cours' || s.status === 'Expertise').length,
    documents: visibleDocuments.filter(d => d.status === 'En attente').length,
    conformityScore: visibleSites.length
      ? Math.round(visibleSites.reduce((acc, site) => acc + site.conformityScore, 0) / visibleSites.length)
      : 0,
    alertsCount: alerts.filter(a => !a.read && (!a.siteId || visibleSiteIds.has(a.siteId))).length
  };

  const alertsByType = {
    high: alerts.filter(a => a.severity === 'high' && !a.read && (!a.siteId || visibleSiteIds.has(a.siteId))).length,
    medium: alerts.filter(a => a.severity === 'medium' && !a.read && (!a.siteId || visibleSiteIds.has(a.siteId))).length,
    low: alerts.filter(a => a.severity === 'low' && !a.read && (!a.siteId || visibleSiteIds.has(a.siteId))).length
  };

  const conformityByStatus = {
    retard: visibleConformities.filter(c => c.status === 'Retard').length,
    echeance: visibleConformities.filter(c => c.status === 'À échéance').length,
    ok: visibleConformities.filter(c => c.status === 'OK').length
  };

  // Calculer les validations en attente pour PM/DT
  const getValidationAlerts = () => {
    if (currentRole !== 'PM' && currentRole !== 'DT') return [];
    
    const alerts = [];
    
    // Interventions/Travaux en attente
    const pendingInterventions = (visibleInterventions || []).filter(intervention => 
      intervention.status === 'En attente' && 
      intervention.validationLevel < intervention.requiredValidators.length
    ).length;
    
    if (pendingInterventions > 0) {
      alerts.push({
        module: 'Travaux',
        moduleId: 'travaux',
        count: pendingInterventions,
        message: `${pendingInterventions} validation${pendingInterventions > 1 ? 's' : ''} en attente dans le module Travaux`
      });
    }
    
    // Budget PPA en attente
    const pendingBudgets = (visibleBudgetPPA || []).filter(budget => 
      budget.status === 'Non démarré'
    ).length;
    
    if (pendingBudgets > 0) {
      alerts.push({
        module: 'Budget PPA',
        moduleId: 'budget-ppa',
        count: pendingBudgets,
        message: `${pendingBudgets} demande${pendingBudgets > 1 ? 's' : ''} CAPEX à valider`
      });
    }
    
    // Demandes de prestation en attente
    const pendingDemandes = (demandesPrestation || []).filter(demande => 
      (demande.status === 'Transmise' || demande.status === 'En attente de devis') &&
      (!demande.siteId || visibleSiteIds.has(demande.siteId))
    ).length;
    
    if (pendingDemandes > 0) {
      alerts.push({
        module: 'Demandes de prestation',
        moduleId: 'demande-prestation',
        count: pendingDemandes,
        message: `${pendingDemandes} demande${pendingDemandes > 1 ? 's' : ''} de prestation en attente`
      });
    }
    
    // Documents en attente (PM uniquement)
    if (currentRole === 'PM') {
    const pendingDocuments = (visibleDocuments || []).filter(document => 
      document.status === 'En attente'
    ).length;
    
    if (pendingDocuments > 0) {
      alerts.push({
        module: 'Documents',
        moduleId: 'documents',
        count: pendingDocuments,
          message: `${pendingDocuments} document${pendingDocuments > 1 ? 's' : ''} en attente de validation`
      });
    }
    }
    
    return alerts;
  };

  const validationAlerts = getValidationAlerts();
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card-unified p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="title-section">Dashboard</h1>
            <p className="subtitle-section">Vue d'ensemble de votre portefeuille immobilier</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRapport(true)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              <FileBarChart className="w-4 h-4 mr-2" />
              Générer le rapport
            </button>
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vue consolidée multi-PM / multi-Asset Manager — DT uniquement */}
      {currentRole === 'DT' && (
        <div className="card-unified p-4">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-2 rounded-lg mr-3">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="title-section">Répartition du patrimoine</h3>
              <p className="text-xs text-gray-500">Vue consolidée par gestionnaire, tous périmètres confondus</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Property Managers</h4>
              <div className="space-y-2">
                {users.filter(u => u.role === 'PM').map(pm => (
                  <div key={pm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">{pm.name}</span>
                    <span className="status-badge status-blue">{pm.sites?.length || 0} sites</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Asset Managers / Propriétaires</h4>
              <div className="space-y-2">
                {users.filter(u => u.role === 'Propriétaire').map(owner => (
                  <div key={owner.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">{owner.name} <span className="text-xs text-gray-400">({owner.mandat})</span></span>
                    <span className="status-badge status-green">{owner.sites?.length || 0} actifs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertes de validation pour PM/DT */}
      {validationAlerts.length > 0 && (
        <div className="space-y-4">
          {validationAlerts.map((alert, index) => (
            <div key={index} className="card-unified p-4 border-l-4 border-red-400 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 rounded-lg mr-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-red-900">Validations en attente</h4>
                    <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab(alert.moduleId)}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-sm font-medium"
                >
                  Traiter maintenant
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Vue synthétique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg mr-3">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sites</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sites}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score Conformité</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conformityScore || '—'}%</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2 rounded-lg mr-3">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interventions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.interventions}</p>
              <p className="text-xs text-gray-500">en attente</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-2 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alertsCount}</p>
              <p className="text-xs text-gray-500">non lues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes par gravité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-unified p-4">
          <h3 className="title-section mb-4">Alertes par Gravité</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Critique</span>
              </div>
              <span className="status-badge status-red">{alertsByType.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Moyenne</span>
              </div>
              <span className="status-badge status-orange">{alertsByType.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Faible</span>
              </div>
              <span className="status-badge status-green">{alertsByType.low}</span>
            </div>
          </div>
        </div>

        <div className="card-unified p-4">
          <h3 className="title-section mb-4">État Conformité</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">En retard</span>
              </div>
              <span className="status-badge status-red">{conformityByStatus.retard}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">À échéance</span>
              </div>
              <span className="status-badge status-orange">{conformityByStatus.echeance}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Conforme</span>
              </div>
              <span className="status-badge status-green">{conformityByStatus.ok}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-unified card-hover p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Sinistres</h3>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-1.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.sinistres}</div>
          <p className="text-sm text-gray-600">en cours de traitement</p>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Documents</h3>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.documents}</div>
          <p className="text-sm text-gray-600">en attente de validation</p>
        </div>

        {(currentRole === 'PM' || currentRole === 'DT' || currentRole === 'Propriétaire') && (
          <div className="card-unified card-hover p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Budget PPA</h3>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-1.5 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">3</div>
            <p className="text-sm text-gray-600">projets en cours</p>
          </div>
        )}
      </div>

      {/* Alerte spéciale PM */}
      {currentRole === 'PM' && (
        <div className="card-unified p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-blue-900">Nouveau site attribué</h4>
              <p className="text-sm text-blue-700 mt-1">Un nouveau site vous a été attribué par le DT. Consultez l'onglet Sites pour plus de détails.</p>
            </div>
          </div>
        </div>
      )}

      {showRapport && <RapportSynthese onClose={() => setShowRapport(false)} />}
    </div>
  );
}