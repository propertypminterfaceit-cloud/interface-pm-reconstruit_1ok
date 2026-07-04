import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, Plus, Filter, Search, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { ESGData } from '../types';

export default function ESG() {
  const { esgData, sites, addESGData, currentRole } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const [newESGData, setNewESGData] = useState({
    siteId: '',
    month: new Date().toISOString().slice(0, 7),
    energy: 0,
    water: 0,
    waste: 0,
    co2: 0,
    objectives: {
      energy: 0,
      water: 0,
      waste: 0,
      co2: 0
    }
  });

  const filteredESGData = esgData.filter(data => {
    const matchesSite = !filterSite || data.siteId === filterSite;
    const matchesMonth = !filterMonth || data.month === filterMonth;
    
    return matchesSite && matchesMonth;
  });

  const getPerformanceIcon = (actual: number, objective: number) => {
    if (actual <= objective) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getPerformanceColor = (actual: number, objective: number) => {
    const ratio = actual / objective;
    if (ratio <= 0.9) return 'text-green-600';
    if (ratio <= 1.1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformancePercentage = (actual: number, objective: number) => {
    return Math.round(((actual - objective) / objective) * 100);
  };

  const handleCreateESGData = () => {
    const site = sites.find(s => s.id === newESGData.siteId);
    if (!site) return;

    const esgEntry: ESGData = {
      id: Date.now().toString(),
      siteId: newESGData.siteId,
      siteName: site.name,
      month: newESGData.month,
      energy: newESGData.energy,
      water: newESGData.water,
      waste: newESGData.waste,
      co2: newESGData.co2,
      objectives: newESGData.objectives
    };

    addESGData(esgEntry);
    setShowCreateForm(false);
    setNewESGData({
      siteId: '',
      month: new Date().toISOString().slice(0, 7),
      energy: 0,
      water: 0,
      waste: 0,
      co2: 0,
      objectives: {
        energy: 0,
        water: 0,
        waste: 0,
        co2: 0
      }
    });
  };

  const esgStats = {
    totalSites: new Set(esgData.map(d => d.siteId)).size,
    totalEntries: esgData.length,
    energyTotal: esgData.reduce((sum, data) => sum + data.energy, 0),
    waterTotal: esgData.reduce((sum, data) => sum + data.water, 0),
    wasteTotal: esgData.reduce((sum, data) => sum + data.waste, 0),
    co2Total: esgData.reduce((sum, data) => sum + data.co2, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Leaf className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sites suivis</p>
              <p className="text-2xl font-bold text-gray-900">{esgStats.totalSites}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Énergie (kWh)</p>
              <p className="text-2xl font-bold text-gray-900">{esgStats.energyTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-cyan-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Eau (m³)</p>
              <p className="text-2xl font-bold text-gray-900">{esgStats.waterTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CO2 (tonnes)</p>
              <p className="text-2xl font-bold text-gray-900">{esgStats.co2Total.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton de création */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ESG - Environnement</h1>
          <p className="text-gray-600">{esgData.length} entrées de données au total</p>
        </div>
        
        {(currentRole === 'PM' || currentRole === 'DT') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Saisir des données ESG
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Informations sur le Comité Vert */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2">Comité Vert Intégré</h3>
        <div className="text-sm text-green-800 grid grid-cols-1 md:grid-cols-2 gap-2">
          <p><strong>Réunions mensuelles</strong> par site pour définir les actions ESG</p>
          <p><strong>Suivi des décisions</strong> et mise en œuvre des mesures</p>
          <p><strong>Historique complet</strong> des actions environnementales</p>
          <p><strong>Intégration RMA/RME</strong> pour données automatiques</p>
        </div>
      </div>

      {/* Liste des données ESG */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Données environnementales par site</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mois
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Énergie (kWh)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eau (m³)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Déchets (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CO2 (tonnes)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredESGData.map((data) => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{data.siteName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(data.month + '-01').toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPerformanceIcon(data.energy, data.objectives.energy)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{data.energy.toLocaleString()}</div>
                        <div className={`text-xs ${getPerformanceColor(data.energy, data.objectives.energy)}`}>
                          Obj: {data.objectives.energy.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPerformanceIcon(data.water, data.objectives.water)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{data.water.toLocaleString()}</div>
                        <div className={`text-xs ${getPerformanceColor(data.water, data.objectives.water)}`}>
                          Obj: {data.objectives.water.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPerformanceIcon(data.waste, data.objectives.waste)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{data.waste.toLocaleString()}</div>
                        <div className={`text-xs ${getPerformanceColor(data.waste, data.objectives.waste)}`}>
                          Obj: {data.objectives.waste.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPerformanceIcon(data.co2, data.objectives.co2)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{data.co2.toFixed(1)}</div>
                        <div className={`text-xs ${getPerformanceColor(data.co2, data.objectives.co2)}`}>
                          Obj: {data.objectives.co2.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className={`text-xs font-medium ${getPerformanceColor(data.energy, data.objectives.energy)}`}>
                        Énergie: {getPerformancePercentage(data.energy, data.objectives.energy) > 0 ? '+' : ''}{getPerformancePercentage(data.energy, data.objectives.energy)}%
                      </div>
                      <div className={`text-xs font-medium ${getPerformanceColor(data.co2, data.objectives.co2)}`}>
                        CO2: {getPerformancePercentage(data.co2, data.objectives.co2) > 0 ? '+' : ''}{getPerformancePercentage(data.co2, data.objectives.co2)}%
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900">Saisir des données ESG</h2>
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
                    value={newESGData.siteId}
                    onChange={(e) => setNewESGData(prev => ({ ...prev, siteId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                  <input
                    type="month"
                    value={newESGData.month}
                    onChange={(e) => setNewESGData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommations réelles</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Énergie (kWh)</label>
                    <input
                      type="number"
                      value={newESGData.energy}
                      onChange={(e) => setNewESGData(prev => ({ ...prev, energy: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eau (m³)</label>
                    <input
                      type="number"
                      value={newESGData.water}
                      onChange={(e) => setNewESGData(prev => ({ ...prev, water: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Déchets (kg)</label>
                    <input
                      type="number"
                      value={newESGData.waste}
                      onChange={(e) => setNewESGData(prev => ({ ...prev, waste: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CO2 (tonnes)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newESGData.co2}
                      onChange={(e) => setNewESGData(prev => ({ ...prev, co2: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objectif Énergie (kWh)</label>
                    <input
                      type="number"
                      value={newESGData.objectives.energy}
                      onChange={(e) => setNewESGData(prev => ({ 
                        ...prev, 
                        objectives: { ...prev.objectives, energy: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objectif Eau (m³)</label>
                    <input
                      type="number"
                      value={newESGData.objectives.water}
                      onChange={(e) => setNewESGData(prev => ({ 
                        ...prev, 
                        objectives: { ...prev.objectives, water: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objectif Déchets (kg)</label>
                    <input
                      type="number"
                      value={newESGData.objectives.waste}
                      onChange={(e) => setNewESGData(prev => ({ 
                        ...prev, 
                        objectives: { ...prev.objectives, waste: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objectif CO2 (tonnes)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newESGData.objectives.co2}
                      onChange={(e) => setNewESGData(prev => ({ 
                        ...prev, 
                        objectives: { ...prev.objectives, co2: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                onClick={handleCreateESGData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer les données
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}