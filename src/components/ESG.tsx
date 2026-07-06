import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, Plus, Filter, Search, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { ESGData } from '../types';

export default function ESG() {
  const { esgData, esgObjectives, sites, energyReadings, addESGData, upsertEsgObjective, currentRole } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const currentYear = new Date().getFullYear();
  const canManage = currentRole === 'PM' || currentRole === 'DT';

  const [newESGData, setNewESGData] = useState({
    siteId: '',
    month: new Date().toISOString().slice(0, 7),
    energy: 0,
    water: 0,
    waste: 0,
    co2: 0
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
      co2: newESGData.co2
    };

    addESGData(esgEntry);
    setShowCreateForm(false);
    setNewESGData({
      siteId: '',
      month: new Date().toISOString().slice(0, 7),
      energy: 0,
      water: 0,
      waste: 0,
      co2: 0
    });
  };

  // Cumul de l'année en cours par site, comparé à l'objectif annuel unique du
  // site — remplace la comparaison mois par mois qui n'avait pas de sens.
  const getAnnualPerformance = (siteId: string) => {
    const entries = esgData.filter(d => d.siteId === siteId && d.month.startsWith(String(currentYear)));
    const cumulative = entries.reduce((acc, e) => ({
      energy: acc.energy + e.energy,
      water: acc.water + e.water,
      waste: acc.waste + e.waste,
      co2: acc.co2 + e.co2
    }), { energy: 0, water: 0, waste: 0, co2: 0 });
    const objective = esgObjectives.find(o => o.siteId === siteId && o.year === currentYear);
    // Si le site remonte de vraies données de consommation (Énergie & Smart
    // Building), on les utilise pour l'énergie plutôt que la saisie manuelle —
    // c'est la donnée la plus fiable disponible.
    const realEnergyReadings = (energyReadings || []).filter(r => r.siteId === siteId && r.month.startsWith(String(currentYear)));
    const realEnergyTotal = realEnergyReadings.length > 0
      ? realEnergyReadings.reduce((sum, r) => sum + r.electricityKwh, 0)
      : null;
    return { cumulative, objective, realEnergyTotal, monthsRecorded: entries.length };
  };

  const handleSaveObjective = (siteId: string, field: 'energy' | 'water' | 'waste' | 'co2', value: number) => {
    const existing = esgObjectives.find(o => o.siteId === siteId && o.year === currentYear);
    upsertEsgObjective(siteId, currentYear, {
      energy: field === 'energy' ? value : (existing?.energy || 0),
      water: field === 'water' ? value : (existing?.water || 0),
      waste: field === 'waste' ? value : (existing?.waste || 0),
      co2: field === 'co2' ? value : (existing?.co2 || 0)
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

      {/* Objectifs annuels & performance lissée par site */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Objectifs annuels {currentYear} — performance lissée</h2>
          <p className="text-xs text-gray-500">Un seul objectif par an et par site, comparé au cumul réel de l'année (données de consommation remontées quand le site est connecté).</p>
        </div>
        <div className="divide-y divide-gray-100">
          {sites.map(site => {
            const { cumulative, objective, realEnergyTotal, monthsRecorded } = getAnnualPerformance(site.id);
            if (monthsRecorded === 0 && !objective) return null;
            const energyValue = realEnergyTotal ?? cumulative.energy;
            const energyRatio = objective && objective.energy > 0 ? Math.round((energyValue / objective.energy) * 100) : null;
            return (
              <div key={site.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{site.name}</p>
                  {realEnergyTotal !== null && (
                    <span className="text-xs text-green-600">Énergie basée sur les données Smart Building réelles</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {(['energy', 'water', 'waste', 'co2'] as const).map(field => {
                    const actual = field === 'energy' ? energyValue : cumulative[field];
                    const objVal = objective?.[field];
                    const ratio = objVal && objVal > 0 ? Math.round((actual / objVal) * 100) : null;
                    const color = ratio === null ? 'text-gray-500' : ratio <= 100 ? 'text-green-600' : ratio <= 110 ? 'text-orange-600' : 'text-red-600';
                    const fieldLabel = field === 'energy' ? 'Énergie' : field === 'water' ? 'Eau' : field === 'waste' ? 'Déchets' : 'CO₂';
                    return (
                      <div key={field} className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{fieldLabel}</p>
                        <p className={`font-semibold ${color}`}>{Math.round(actual * 10) / 10}</p>
                        {canManage ? (
                          <input
                            type="number"
                            value={objVal ?? ''}
                            onChange={(e) => handleSaveObjective(site.id, field, parseFloat(e.target.value) || 0)}
                            placeholder="Objectif annuel"
                            className="w-full mt-1 px-1.5 py-1 border border-gray-200 rounded text-xs"
                          />
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Objectif : {objVal ?? '—'}</p>
                        )}
                        {ratio !== null && <p className={`text-xs ${color}`}>{ratio}% de l'objectif</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.energy.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.water.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.waste.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.co2.toFixed(1)}</td>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                Les objectifs se définissent une fois par an, dans la section "Objectifs annuels" en haut de la page — pas ici, à chaque saisie mensuelle.
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