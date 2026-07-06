import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Filter, Search, AlertTriangle, CheckCircle, Clock, FileText, Wrench, DollarSign, Repeat } from 'lucide-react';
import { computeObligationAlerts } from '../utils/obligationAlerts';
import { filterSitesByUser } from '../utils/permissions';

export default function Alertes() {
  const { alerts, markAlertAsRead, currentRole, currentUser, sites, obligations, documents } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterRead, setFilterRead] = useState('');

  const visibleSiteIds = new Set(filterSitesByUser(currentUser, currentRole, sites).map(s => s.id));
  const obligationAlerts = computeObligationAlerts(obligations || [], documents || [])
    .filter(a => !a.siteId || visibleSiteIds.has(a.siteId));

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.siteName && alert.siteName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !filterType || alert.type === filterType;
    const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
    const matchesRead = !filterRead || (filterRead === 'read' ? alert.read : !alert.read);
    
    return matchesSearch && matchesType && matchesSeverity && matchesRead;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conformité': return <CheckCircle className="w-5 h-5 text-orange-600" />;
      case 'budget': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'sinistre': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'intervention': return <Wrench className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Critique';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return 'Inconnue';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'conformité': return 'Conformité';
      case 'budget': return 'Budget';
      case 'document': return 'Document';
      case 'sinistre': return 'Sinistre';
      case 'intervention': return 'Intervention';
      default: return 'Autre';
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const alertStats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    high: alerts.filter(a => a.severity === 'high' && !a.read).length,
    medium: alerts.filter(a => a.severity === 'medium' && !a.read).length,
    low: alerts.filter(a => a.severity === 'low' && !a.read).length
  };

  return (
    <div className="space-y-6">
      {/* Alertes issues du moteur d'obligations (mandat, certification...) */}
      {obligationAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center">
            <Repeat className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-base font-bold text-gray-900">Échéances et preuves des obligations</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {obligationAlerts.map(a => (
              <div key={a.id} className="p-3 flex items-center">
                <span className={`px-2 py-1 text-xs font-medium rounded mr-3 ${a.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                  {a.severity === 'high' ? 'Urgent' : 'À traiter'}
                </span>
                <p className="text-sm text-gray-700">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Non lues</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats.unread}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critiques</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats.high}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Moyennes</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats.medium}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre d'Alertes</h1>
          <p className="text-gray-600">{alerts.length} alertes au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="conformité">Conformité</option>
            <option value="budget">Budget</option>
            <option value="document">Document</option>
            <option value="sinistre">Sinistre</option>
            <option value="intervention">Intervention</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les gravités</option>
            <option value="high">Critique</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
          
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Alertes par gravité et type</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-6 hover:bg-gray-50 transition-colors ${!alert.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(alert.severity)}`}>
                        {getSeverityLabel(alert.severity)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                        {getTypeLabel(alert.type)}
                      </span>
                      {!alert.read && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Nouveau
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${!alert.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {alert.message}
                    </p>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <span>{new Date(alert.date).toLocaleDateString('fr-FR')}</span>
                      {alert.siteName && (
                        <span>Site: {alert.siteName}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Marquer comme lu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredAlerts.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Aucune alerte trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Résumé des alertes par type */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['conformité', 'intervention', 'document', 'sinistre', 'budget'].map(type => {
          const typeAlerts = alerts.filter(a => a.type === type && !a.read);
          if (typeAlerts.length === 0) return null;
          
          return (
            <div key={type} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getTypeIcon(type)}
                  <h3 className="ml-2 text-lg font-semibold text-gray-900 capitalize">
                    {getTypeLabel(type)}
                  </h3>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  {typeAlerts.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {typeAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="text-sm text-gray-600 truncate">
                    • {alert.message}
                  </div>
                ))}
                {typeAlerts.length > 3 && (
                  <div className="text-sm text-gray-500">
                    ... et {typeAlerts.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}