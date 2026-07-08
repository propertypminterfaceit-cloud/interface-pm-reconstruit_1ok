import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Gauge, Zap, Flame, Droplet, Plug, PlugZap, Loader2,
  CheckCircle2, XCircle, ExternalLink, Info, ArrowLeft, Thermometer
} from 'lucide-react';
import { EnergyConnector } from '../types';
import { filterSitesByUser } from '../utils/permissions';

const PROVIDERS: { value: EnergyConnector['provider']; description: string }[] = [
  {
    value: 'Schneider EcoStruxure Building Operation',
    description: 'GTB / supervision multi-fluides (électricité, CVC, éclairage) — leader du marché.'
  },
  {
    value: 'Dnergy',
    description: 'Solution Smart Building : supervision fine par niveau (consignes de température, écarts, alertes).'
  },
  {
    value: 'Ubigreen Energy',
    description: 'Suivi multi-sites, multi-fluides, pensé pour les gestionnaires de parc immobilier.'
  },
  {
    value: 'Advizeo',
    description: 'Plateforme de pilotage énergétique orientée décret tertiaire et reporting OPERAT.'
  },
  {
    value: 'Deltaconso Expert',
    description: 'Monitoring multifluides avec accompagnement sur les Certificats d’Économies d’Énergie.'
  },
  {
    value: 'API générique',
    description: 'Connectez n’importe quelle GTB ou passerelle IoT exposant une API REST.'
  }
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

// Courbe SVG multi-fluides faite maison — pas de librairie de graphiques
// nécessaire, pour ne pas alourdir davantage les dépendances du projet.
function MultiFluidChart({ readings, objective }: { readings: any[]; objective?: number }) {
  const width = 640;
  const height = 220;
  const padding = 36;

  const series = [
    { key: 'electricityKwh', label: 'Électricité', color: '#EAB308' },
    { key: 'gasKwh', label: 'Gaz', color: '#FB923C' },
    { key: 'heatNetworkKwh', label: 'Réseau de chaleur urbain', color: '#EF4444' },
    { key: 'coldNetworkKwh', label: 'Réseau de froid urbain', color: '#06B6D4' }
  ].filter(s => readings.some(r => (r[s.key] || 0) > 0));

  const allValues = readings.flatMap(r => series.map(s => r[s.key] || 0));
  const maxValue = Math.max(...allValues, objective || 0, 1);

  const xStep = (width - padding * 2) / Math.max(readings.length - 1, 1);
  const yScale = (v: number) => height - padding - (v / maxValue) * (height - padding * 2);

  const buildPath = (key: string) =>
    readings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${padding + i * xStep} ${yScale(r[key] || 0)}`).join(' ');

  return (
    <div className="max-w-2xl">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        {/* Ligne d'objectif annuel (électricité) */}
        {objective && (
          <line
            x1={padding} x2={width - padding}
            y1={yScale(objective)} y2={yScale(objective)}
            stroke="#9333EA" strokeDasharray="6 4" strokeWidth={1.5}
          />
        )}
        {series.map(s => (
          <path key={s.key} d={buildPath(s.key)} fill="none" stroke={s.color} strokeWidth={2.5} />
        ))}
        {readings.map((r, i) => (
          <text key={r.month} x={padding + i * xStep} y={height - 8} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 10 }}>
            {r.month.slice(5)}/{r.month.slice(2, 4)}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
        {series.map(s => (
          <span key={s.key} className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: s.color }} /> {s.label}
          </span>
        ))}
        {objective && (
          <span className="flex items-center">
            <span className="w-4 h-0.5 mr-1.5" style={{ backgroundColor: '#9333EA' }} /> Objectif annuel électricité
          </span>
        )}
      </div>
    </div>
  );
}

export default function Energie() {
  const {
    sites, energyConnectors, energyReadings,
    connectEnergyProvider, disconnectEnergyProvider,
    niveaux, consignesTemperature, obligations, esgObjectives,
    currentRole, currentUser
  } = useStore();

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedProviderBySite, setSelectedProviderBySite] = useState<Record<string, EnergyConnector['provider']>>({});
  const [infoProvider, setInfoProvider] = useState<EnergyConnector['provider'] | null>(null);
  const [selectedNiveauId, setSelectedNiveauId] = useState<string>('');

  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const connectors = energyConnectors || [];
  const readings = energyReadings || [];
  const canManage = currentRole === 'PM' || currentRole === 'DT';
  const currentYear = new Date().getFullYear();

  const getConnector = (siteId: string) => connectors.find(c => c.siteId === siteId);
  const getSiteReadings = (siteId: string) => readings.filter(r => r.siteId === siteId).sort((a, b) => a.month.localeCompare(b.month));
  const getLatestReading = (siteId: string) => {
    const list = getSiteReadings(siteId);
    return list.length ? list[list.length - 1] : null;
  };

  const handleConnect = (siteId: string) => {
    const provider = selectedProviderBySite[siteId] || PROVIDERS[0].value;
    connectEnergyProvider(siteId, provider);
  };

  const statusBadge = (status: EnergyConnector['status'] | undefined) => {
    switch (status) {
      case 'Connecté':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connecté</span>;
      case 'Connexion en cours':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Connexion...</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700"><Plug className="w-3.5 h-3.5 mr-1" /> Non connecté</span>;
    }
  };

  const selectedSite = visibleSites.find(s => s.id === selectedSiteId) || null;

  // ----- Vue détail d'un site -----
  if (selectedSite) {
    const connector = getConnector(selectedSite.id);
    const isConnected = connector?.status === 'Connecté';
    const isConnecting = connector?.status === 'Connexion en cours';
    const siteReadings = getSiteReadings(selectedSite.id);
    const latest = siteReadings[siteReadings.length - 1];
    const objective = (esgObjectives || []).find(o => o.siteId === selectedSite.id && o.year === currentYear)?.energy;
    const siteNiveaux = (niveaux || []).filter(n => n.siteId === selectedSite.id).sort((a, b) => a.order - b.order);
    const consigneObligation = (obligations || []).find(o => o.siteId === selectedSite.id && o.ruleType === 'ConsigneTemperature' && o.status === 'Active');

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedSiteId(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour à la vue d'ensemble
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center"><Gauge className="w-5 h-5 mr-2 text-blue-600" />{selectedSite.name}</h1>
              <p className="text-sm text-gray-500">{selectedSite.address}</p>
              <div className="mt-2">{statusBadge(connector?.status)}</div>
              {isConnected && connector?.lastSync && <p className="text-xs text-gray-400 mt-1">Dernière synchro : {connector.lastSync}</p>}
            </div>

            {!isConnected && !isConnecting && canManage && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedProviderBySite[selectedSite.id] || connector?.provider || PROVIDERS[0].value}
                  onChange={(e) => setSelectedProviderBySite(prev => ({ ...prev, [selectedSite.id]: e.target.value as EnergyConnector['provider'] }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.value}</option>)}
                </select>
                <button onClick={() => setInfoProvider(selectedProviderBySite[selectedSite.id] || PROVIDERS[0].value)} className="p-2 text-gray-400 hover:text-gray-600">
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => handleConnect(selectedSite.id)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center">
                  <Plug className="w-4 h-4 mr-1.5" /> Connecter
                </button>
              </div>
            )}
            {isConnecting && <span className="text-sm text-gray-500 flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Établissement de la connexion…</span>}
            {isConnected && currentRole === 'DT' && (
              <button onClick={() => connector && disconnectEnergyProvider(connector.id)} className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50">
                Déconnecter
              </button>
            )}
            {isConnected && currentRole !== 'DT' && <span className="text-xs text-gray-400 italic">Déconnexion réservée au DT</span>}
          </div>
        </div>

        {!isConnected ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-400">
            Connectez ce site à un fournisseur de supervision pour voir ses consommations.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Consommations — source : {connector?.provider}</h3>
                {latest && (
                  <div className="text-right text-xs text-gray-600">
                    <div className="flex items-center justify-end"><Droplet className="w-3.5 h-3.5 mr-1 text-blue-400" /> {formatNumber(latest.waterM3)} m³ (eau, dernier mois)</div>
                    <div className="mt-1">Coût estimé : {formatNumber(latest.cost)} € — Puissance de pointe : {formatNumber(latest.peakPowerKw)} kW</div>
                  </div>
                )}
              </div>
              {siteReadings.length > 0 ? (
                <MultiFluidChart readings={siteReadings} objective={objective} />
              ) : (
                <p className="text-sm text-gray-400">Pas encore d'historique disponible.</p>
              )}
            </div>

            {connector?.provider === 'Dnergy' && siteNiveaux.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center"><Thermometer className="w-4 h-4 mr-2 text-blue-600" />Smart Building — température</h3>
                {consigneObligation && (
                  <p className="text-xs text-gray-500 mb-3">
                    Exigence active ({consigneObligation.sourceLabel}) : {consigneObligation.params.temperatureMin}°C – {consigneObligation.params.temperatureMax}°C
                  </p>
                )}
                {(() => {
                  const allConsignes = siteNiveaux
                    .map(n => (consignesTemperature || []).find(c => c.niveauId === n.id))
                    .filter((c): c is NonNullable<typeof c> => !!c);
                  const average = allConsignes.length
                    ? allConsignes.reduce((sum, c) => sum + c.consigne, 0) / allConsignes.length
                    : null;
                  const min = consigneObligation?.params.temperatureMin;
                  const max = consigneObligation?.params.temperatureMax;

                  const selectedNiveau = siteNiveaux.find(n => n.id === selectedNiveauId);
                  const selectedConsigne = selectedNiveau ? (consignesTemperature || []).find(c => c.niveauId === selectedNiveau.id) : null;

                  const renderValue = (value: number | null) => {
                    const ecart = value !== null && min !== undefined && max !== undefined && (value < min || value > max);
                    return (
                      <div className={`p-4 rounded-lg border text-center ${ecart ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className={`text-3xl font-bold ${ecart ? 'text-red-600' : 'text-gray-900'}`}>{value !== null ? `${value.toFixed(1)}°C` : '—'}</p>
                        {ecart && <p className="text-xs text-red-600 mt-1">Hors plage autorisée</p>}
                      </div>
                    );
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Température moyenne du bâtiment</p>
                        {renderValue(average)}
                      </div>
                      <div>
                        <select
                          value={selectedNiveauId}
                          onChange={(e) => setSelectedNiveauId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                        >
                          <option value="">Voir un étage précis...</option>
                          {siteNiveaux.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                        </select>
                        {selectedNiveau ? renderValue(selectedConsigne?.consigne ?? null) : (
                          <div className="p-4 rounded-lg border border-dashed border-gray-200 text-center text-sm text-gray-400">
                            Sélectionnez un étage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {infoProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setInfoProvider(null)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{infoProvider}</h3>
              <p className="text-sm text-gray-600 mb-4">{PROVIDERS.find(p => p.value === infoProvider)?.description}</p>
              <button onClick={() => setInfoProvider(null)} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Fermer</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- Vue d'ensemble : grille de cartes compactes par site -----
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Gauge className="w-6 h-6 mr-2 text-blue-600" />
          Énergie &amp; Smart Building
        </h1>
        <p className="text-gray-600">Sélectionnez un site pour voir ses consommations en détail.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Mode démonstration —</span> la connexion simule un vrai temps d'appairage réseau.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSites.map(site => {
          const connector = getConnector(site.id);
          const isConnected = connector?.status === 'Connecté';
          const latest = isConnected ? getLatestReading(site.id) : null;

          return (
            <button
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className="text-left bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{site.name}</p>
                  <p className="text-xs text-gray-400 truncate">{site.address}</p>
                </div>
              </div>
              <div className="mb-2">{statusBadge(connector?.status)}</div>
              {isConnected && connector && (
                <p className="text-xs text-gray-500 mb-2">Connecté à : <span className="font-medium text-gray-700">{connector.provider}</span></p>
              )}
              {latest ? (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex items-center"><Zap className="w-3.5 h-3.5 mr-1 text-yellow-500" /> {formatNumber(latest.electricityKwh)} kWh élec.</div>
                  <div className="flex items-center"><PlugZap className="w-3.5 h-3.5 mr-1 text-blue-500" /> {formatNumber(latest.cost)} € estimé</div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Cliquez pour {isConnected ? 'voir le détail' : 'connecter ce site'}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
