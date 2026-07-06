import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Gauge, Zap, Flame, Droplet, Plug, PlugZap, Loader2,
  CheckCircle2, XCircle, ExternalLink, Info
} from 'lucide-react';
import { EnergyConnector } from '../types';

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

export default function Energie() {
  const {
    sites, energyConnectors, energyReadings,
    connectEnergyProvider, disconnectEnergyProvider,
    niveaux, consignesTemperature, obligations, currentRole
  } = useStore();

  const [selectedProviderBySite, setSelectedProviderBySite] = useState<Record<string, EnergyConnector['provider']>>({});
  const [infoProvider, setInfoProvider] = useState<EnergyConnector['provider'] | null>(null);

  const connectors = energyConnectors || [];
  const readings = energyReadings || [];

  const getConnector = (siteId: string) => connectors.find(c => c.siteId === siteId);

  const getLatestReading = (siteId: string) => {
    const siteReadings = readings.filter(r => r.siteId === siteId);
    if (siteReadings.length === 0) return null;
    return siteReadings.reduce((latest, r) => (r.month > latest.month ? r : latest), siteReadings[0]);
  };

  const getSiteReadings = (siteId: string) =>
    readings.filter(r => r.siteId === siteId).sort((a, b) => a.month.localeCompare(b.month));

  // Statistiques globales, calculées uniquement sur les sites réellement connectés
  const connectedCount = connectors.filter(c => c.status === 'Connecté').length;
  const latestBySite = sites.map(s => getLatestReading(s.id)).filter((r): r is NonNullable<typeof r> => !!r);
  const totalElecKwh = latestBySite.reduce((sum, r) => sum + r.electricityKwh, 0);
  const totalGazKwh = latestBySite.reduce((sum, r) => sum + r.gasKwh, 0);
  const totalCost = latestBySite.reduce((sum, r) => sum + r.cost, 0);
  const totalCo2 = latestBySite.reduce((sum, r) => sum + r.co2Kg, 0);

  const handleConnect = (siteId: string) => {
    const provider = selectedProviderBySite[siteId] || PROVIDERS[0].value;
    connectEnergyProvider(siteId, provider);
  };

  const statusBadge = (status: EnergyConnector['status'] | undefined) => {
    switch (status) {
      case 'Connecté':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connecté
          </span>
        );
      case 'Connexion en cours':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Connexion en cours…
          </span>
        );
      case 'Erreur':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Erreur
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            <Plug className="w-3.5 h-3.5 mr-1" /> Non connecté
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Bandeau démo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <span className="font-semibold">Mode démonstration —</span> les connexions ci-dessous simulent le
          comportement réel d'un appairage GTB/IoT (délai réseau, remontée d'historique). Pour un déploiement en
          production, il suffit de brancher une vraie clé API par site sur ces mêmes connecteurs.
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Gauge className="w-6 h-6 mr-2 text-blue-600" />
          Énergie &amp; Smart Building
        </h1>
        <p className="text-gray-600">Supervision des consommations remontées par vos systèmes de GTB / IoT</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Électricité (dernier mois)</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalElecKwh)} kWh</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Flame className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gaz (dernier mois)</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalGazKwh)} kWh</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <PlugZap className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coût estimé</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCost)} €</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Gauge className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sites connectés</p>
              <p className="text-2xl font-bold text-gray-900">{connectedCount} / {sites.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connecteurs par site */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Connecteurs par site</h2>
          <p className="text-sm text-gray-600">Associez chaque site à un fournisseur de supervision énergétique</p>
        </div>

        <div className="divide-y divide-gray-200">
          {sites.map(site => {
            const connector = getConnector(site.id);
            const isConnected = connector?.status === 'Connecté';
            const isConnecting = connector?.status === 'Connexion en cours';

            return (
              <div key={site.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{site.name}</p>
                  <p className="text-sm text-gray-500">{site.address}</p>
                  <div className="mt-1">{statusBadge(connector?.status)}</div>
                  {isConnected && connector?.lastSync && (
                    <p className="text-xs text-gray-400 mt-1">Dernière synchro : {connector.lastSync}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isConnected && !isConnecting && (currentRole === 'PM' || currentRole === 'DT') && (
                    <>
                      <select
                        value={selectedProviderBySite[site.id] || connector?.provider || PROVIDERS[0].value}
                        onChange={(e) =>
                          setSelectedProviderBySite(prev => ({ ...prev, [site.id]: e.target.value as EnergyConnector['provider'] }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {PROVIDERS.map(p => (
                          <option key={p.value} value={p.value}>{p.value}</option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          setInfoProvider(selectedProviderBySite[site.id] || connector?.provider || PROVIDERS[0].value)
                        }
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="En savoir plus sur ce fournisseur"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleConnect(site.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <Plug className="w-4 h-4 mr-1.5" /> Connecter
                      </button>
                    </>
                  )}
                  {!isConnected && !isConnecting && currentRole !== 'PM' && currentRole !== 'DT' && (
                    <span className="text-xs text-gray-400 italic">Connexion réservée au PM/DT</span>
                  )}

                  {isConnecting && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Établissement de la connexion…
                    </span>
                  )}

                  {isConnected && currentRole === 'DT' && (
                    <button
                      onClick={() => connector && disconnectEnergyProvider(connector.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
                    >
                      Déconnecter
                    </button>
                  )}
                  {isConnected && currentRole !== 'DT' && (
                    <span className="text-xs text-gray-400 italic">Déconnexion réservée au DT</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale info fournisseur */}
      {infoProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setInfoProvider(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{infoProvider}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {PROVIDERS.find(p => p.value === infoProvider)?.description}
            </p>
            <button
              onClick={() => setInfoProvider(null)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Consommations détaillées par site connecté */}
      {sites.map(site => {
        const connector = getConnector(site.id);
        if (connector?.status !== 'Connecté') return null;
        const siteReadings = getSiteReadings(site.id);
        if (siteReadings.length === 0) return null;
        const maxElec = Math.max(...siteReadings.map(r => r.electricityKwh));
        const latest = siteReadings[siteReadings.length - 1];

        return (
          <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{site.name}</h3>
                <p className="text-xs text-gray-500 flex items-center">
                  Source : {connector.provider}
                  {connector.apiEndpoint && (
                    <a
                      href={connector.apiEndpoint}
                      onClick={(e) => e.preventDefault()}
                      className="ml-2 text-blue-500 flex items-center"
                      title="Endpoint API simulé (démo)"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center justify-end"><Droplet className="w-4 h-4 mr-1 text-blue-400" /> {formatNumber(latest.waterM3)} m³ (eau, dernier mois)</div>
                <div className="flex items-center justify-end mt-1">Puissance de pointe : {formatNumber(latest.peakPowerKw)} kW</div>
              </div>
            </div>

            {/* Mini graphique en barres (CSS), 6 derniers mois */}
            <div className="flex items-end gap-3 h-32">
              {siteReadings.map(r => (
                <div key={r.month} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="flex items-end gap-0.5 h-full w-full justify-center">
                    <div
                      className="w-3 bg-yellow-400 rounded-t"
                      style={{ height: `${Math.max((r.electricityKwh / maxElec) * 100, 4)}%` }}
                      title={`Électricité : ${formatNumber(r.electricityKwh)} kWh`}
                    />
                    {r.gasKwh > 0 && (
                      <div
                        className="w-3 bg-orange-300 rounded-t"
                        style={{ height: `${Math.max((r.gasKwh / maxElec) * 100, 4)}%` }}
                        title={`Gaz : ${formatNumber(r.gasKwh)} kWh`}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{r.month.slice(5)}/{r.month.slice(2, 4)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-sm mr-1.5" /> Électricité</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-orange-300 rounded-sm mr-1.5" /> Gaz</span>
            </div>
          </div>
        );
      })}

      {/* Panneau Smart Building — consignes de température par niveau (Dnergy) */}
      {sites.map(site => {
        const connector = getConnector(site.id);
        if (connector?.status !== 'Connecté' || connector.provider !== 'Dnergy') return null;

        const siteNiveaux = (niveaux || []).filter(n => n.siteId === site.id).sort((a, b) => a.order - b.order);
        if (siteNiveaux.length === 0) return null;

        // Exigence Smart Building active pour ce site, si elle existe (plage autorisée)
        const consigneObligation = (obligations || []).find(o =>
          o.siteId === site.id && o.ruleType === 'ConsigneTemperature' && o.status === 'Active'
        );

        return (
          <div key={`dnergy-${site.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Gauge className="w-4 h-4 mr-2 text-blue-600" />
                  {site.name} — Smart Building (Dnergy)
                </h3>
                <p className="text-xs text-gray-500">Dernière synchronisation : {connector.lastSync}</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connecté
              </span>
            </div>

            {consigneObligation && (
              <p className="text-xs text-gray-500 mb-3">
                Exigence active ({consigneObligation.sourceLabel}) : consigne autorisée entre {consigneObligation.params.temperatureMin}°C et {consigneObligation.params.temperatureMax}°C
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {siteNiveaux.map(niveau => {
                const consigne = (consignesTemperature || []).find(c => c.niveauId === niveau.id);
                const min = consigneObligation?.params.temperatureMin;
                const max = consigneObligation?.params.temperatureMax;
                const ecart = consigne && min !== undefined && max !== undefined && (consigne.consigne < min || consigne.consigne > max);

                return (
                  <div
                    key={niveau.id}
                    className={`p-3 rounded-lg border text-center ${ecart ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <p className="text-xs text-gray-500">{niveau.label}</p>
                    <p className={`text-lg font-bold ${ecart ? 'text-red-600' : 'text-gray-900'}`}>
                      {consigne ? `${consigne.consigne}°C` : '—'}
                    </p>
                    {ecart && <p className="text-xs text-red-600 mt-1">Hors plage</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
