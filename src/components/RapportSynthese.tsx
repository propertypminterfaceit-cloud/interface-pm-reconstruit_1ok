import React from 'react';
import { useStore } from '../store/useStore';
import { X, Printer, FileText } from 'lucide-react';
import { filterSitesByUser, filterBySiteAccess } from '../utils/permissions';

interface RapportSyntheseProps {
  onClose: () => void;
}

export default function RapportSynthese({ onClose }: RapportSyntheseProps) {
  const {
    sites, currentRole, currentUser, budgetPPA, esgData, esgObjectives, energyReadings,
    sinistres, conformities
  } = useStore();

  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const visibleSiteIds = new Set(visibleSites.map(s => s.id));
  const visibleBudget = filterBySiteAccess(budgetPPA, currentUser, currentRole, sites);
  const visibleSinistres = filterBySiteAccess(sinistres, currentUser, currentRole, sites);
  const visibleConformities = filterBySiteAccess(conformities, currentUser, currentRole, sites);
  const visibleEsg = (esgData || []).filter(e => visibleSiteIds.has(e.siteId));
  const visibleEnergy = (energyReadings || []).filter(r => visibleSiteIds.has(r.siteId));

  const avgConformity = visibleSites.length
    ? Math.round(visibleSites.reduce((sum, s) => sum + s.conformityScore, 0) / visibleSites.length)
    : 0;

  const budgetTotal = visibleBudget.reduce((sum, b) => sum + b.amount, 0);
  const budgetValide = visibleBudget.filter(b => b.validationStatus === 'Validé').reduce((sum, b) => sum + b.amount, 0);
  const budgetEnAttente = visibleBudget.filter(b => !b.validationStatus || b.validationStatus === 'En attente').length;

  const currentYear = new Date().getFullYear();
  const esgLatestBySite = visibleSites.map(site => {
    const entries = visibleEsg.filter(e => e.siteId === site.id && e.month.startsWith(String(currentYear)));
    if (entries.length === 0) return null;
    const cumulative = entries.reduce((acc, e) => ({
      energy: acc.energy + e.energy,
      water: acc.water + e.water,
      waste: acc.waste + e.waste,
      co2: acc.co2 + e.co2
    }), { energy: 0, water: 0, waste: 0, co2: 0 });
    const objective = (esgObjectives || []).find(o => o.siteId === site.id && o.year === currentYear);
    return { site, cumulative, objective };
  }).filter((e): e is NonNullable<typeof e> => !!e);

  const energyLatestBySite = visibleSites.map(site => {
    const entries = visibleEnergy.filter(r => r.siteId === site.id).sort((a, b) => b.month.localeCompare(a.month));
    return { site, latest: entries[0] };
  }).filter(e => e.latest);

  const sinistresEnCours = visibleSinistres.filter(s => s.status === 'Déclaré' || s.status === 'Expertise').length;
  const conformiteRetard = visibleConformities.filter(c => c.status === 'Retard').length;

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:static">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
        {/* Barre d'actions, masquée à l'impression */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between print:hidden sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Rapport de synthèse</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Imprimer / Exporter en PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu du rapport */}
        <div className="p-8">
          <div className="mb-8 text-center border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rapport de synthèse — Portefeuille immobilier</h1>
            <p className="text-sm text-gray-500 mt-1">Généré le {today} — {currentUser?.name || currentRole}{currentUser?.mandat ? ` (${currentUser.mandat})` : ''}</p>
            <p className="text-sm text-gray-500">{visibleSites.length} site{visibleSites.length > 1 ? 's' : ''} dans le périmètre</p>
          </div>

          {/* Vue d'ensemble */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Vue d'ensemble</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Score conformité moyen</p>
                <p className="text-xl font-bold text-gray-900">{avgConformity}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Non-conformités en retard</p>
                <p className="text-xl font-bold text-gray-900">{conformiteRetard}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Sinistres en cours</p>
                <p className="text-xl font-bold text-gray-900">{sinistresEnCours}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Lignes PPA en attente</p>
                <p className="text-xl font-bold text-gray-900">{budgetEnAttente}</p>
              </div>
            </div>
          </section>

          {/* Budget PPA */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Budget PPA / CAPEX</h2>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Budget total engagé</p>
                <p className="text-xl font-bold text-gray-900">{budgetTotal.toLocaleString()}€</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Dont validé</p>
                <p className="text-xl font-bold text-green-700">{budgetValide.toLocaleString()}€</p>
              </div>
            </div>
            {visibleBudget.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-1">Site</th>
                    <th className="py-1">Objet</th>
                    <th className="py-1 text-right">Montant</th>
                    <th className="py-1 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBudget.map(b => (
                    <tr key={b.id} className="border-b border-gray-100">
                      <td className="py-1">{b.siteName}</td>
                      <td className="py-1">{b.object}</td>
                      <td className="py-1 text-right">{b.amount.toLocaleString()}€</td>
                      <td className="py-1 text-right">{b.validationStatus || 'En attente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* ESG */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Suivi ESG (cumul {currentYear} vs objectif annuel)</h2>
            {esgLatestBySite.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée ESG disponible pour ce périmètre.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-1">Site</th>
                    <th className="py-1 text-right">Énergie</th>
                    <th className="py-1 text-right">Eau</th>
                    <th className="py-1 text-right">Déchets</th>
                    <th className="py-1 text-right">CO₂</th>
                  </tr>
                </thead>
                <tbody>
                  {esgLatestBySite.map(({ site, cumulative, objective }) => (
                    <tr key={site.id} className="border-b border-gray-100">
                      <td className="py-1">{site.name}</td>
                      <td className="py-1 text-right">{cumulative.energy}{objective ? ` / obj. ${objective.energy}` : ''}</td>
                      <td className="py-1 text-right">{cumulative.water}{objective ? ` / obj. ${objective.water}` : ''}</td>
                      <td className="py-1 text-right">{cumulative.waste}{objective ? ` / obj. ${objective.waste}` : ''}</td>
                      <td className="py-1 text-right">{cumulative.co2.toFixed(1)}{objective ? ` / obj. ${objective.co2}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Énergie / Smart Building */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Énergie & Smart Building (dernier mois connecté)</h2>
            {energyLatestBySite.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun site connecté à un fournisseur de supervision énergétique pour ce périmètre.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-1">Site</th>
                    <th className="py-1 text-right">Électricité</th>
                    <th className="py-1 text-right">Gaz</th>
                    <th className="py-1 text-right">Coût estimé</th>
                  </tr>
                </thead>
                <tbody>
                  {energyLatestBySite.map(({ site, latest }) => (
                    <tr key={site.id} className="border-b border-gray-100">
                      <td className="py-1">{site.name}</td>
                      <td className="py-1 text-right">{latest.electricityKwh.toLocaleString()} kWh</td>
                      <td className="py-1 text-right">{latest.gasKwh > 0 ? `${latest.gasKwh.toLocaleString()} kWh` : '—'}</td>
                      <td className="py-1 text-right">{latest.cost.toLocaleString()}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
