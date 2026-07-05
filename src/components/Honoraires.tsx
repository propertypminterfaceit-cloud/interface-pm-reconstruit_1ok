import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, Plus, Trash2, Save, Building2 } from 'lucide-react';
import { FeeTier } from '../utils/feeSchedule';

export default function Honoraires() {
  const { sites, feeSchedules, upsertFeeSchedule } = useStore();

  // Un mandat peut exister de deux façons : parce qu'au moins un site lui est
  // déjà rattaché, OU parce que le DT l'a créé à l'avance (barème préparé
  // avant même d'y attacher un premier site — utile pour un nouveau client).
  const mandats = Array.from(new Set([
    ...sites.map(s => s.mandat).filter((m): m is string => !!m),
    ...feeSchedules.map(s => s.mandat)
  ]));

  const [draftTiers, setDraftTiers] = useState<Record<string, FeeTier[]>>({});
  const [newMandatName, setNewMandatName] = useState('');

  const handleCreateMandat = () => {
    const name = newMandatName.trim();
    if (!name || mandats.includes(name)) return;
    upsertFeeSchedule(name, []);
    setNewMandatName('');
  };

  const getTiers = (mandat: string): FeeTier[] => {
    if (draftTiers[mandat]) return draftTiers[mandat];
    const existing = feeSchedules.find(s => s.mandat === mandat);
    return existing ? existing.tiers : [];
  };

  const setTiers = (mandat: string, tiers: FeeTier[]) => {
    setDraftTiers(prev => ({ ...prev, [mandat]: tiers }));
  };

  const addTier = (mandat: string) => {
    const tiers = getTiers(mandat);
    const lastMax = tiers.length > 0 ? tiers[tiers.length - 1].max : null;
    setTiers(mandat, [...tiers, { min: lastMax || 0, max: null, rate: 0 }]);
  };

  const updateTier = (mandat: string, index: number, field: keyof FeeTier, value: number | null) => {
    const tiers = [...getTiers(mandat)];
    tiers[index] = { ...tiers[index], [field]: value };
    setTiers(mandat, tiers);
  };

  const removeTier = (mandat: string, index: number) => {
    const tiers = getTiers(mandat).filter((_, i) => i !== index);
    setTiers(mandat, tiers);
  };

  const handleSave = (mandat: string) => {
    upsertFeeSchedule(mandat, getTiers(mandat));
    setDraftTiers(prev => {
      const { [mandat]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Wallet className="w-6 h-6 mr-2 text-green-600" />
          Honoraires — Barèmes par mandat
        </h1>
        <p className="text-gray-600">
          Définissez les taux d'honoraires PM par tranche de montant de chantier, propres à chaque mandat.
          Ce sont ces barèmes qui alimentent le calcul automatique visible dans le module Travaux.
        </p>
      </div>

      {mandats.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Aucun mandat classé pour le moment — renseignez le champ "mandat" sur vos sites.</p>
        </div>
      )}

      {/* Création d'un nouveau mandat, indépendamment de tout site existant */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Créer un nouveau mandat</h3>
        <p className="text-xs text-gray-500 mb-3">
          Préparez le barème d'honoraires d'un nouveau client avant même de lui rattacher un site — celui-ci apparaîtra ensuite dans les suggestions lors de la création/édition d'un site.
        </p>
        <div className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            value={newMandatName}
            onChange={(e) => setNewMandatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateMandat()}
            placeholder="Ex: Amundi"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleCreateMandat}
            disabled={!newMandatName.trim() || mandats.includes(newMandatName.trim())}
            className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" /> Créer
          </button>
        </div>
      </div>

      {mandats.map(mandat => {
        const siteCount = sites.filter(s => s.mandat === mandat).length;
        const tiers = getTiers(mandat);
        const hasDraft = !!draftTiers[mandat];

        return (
          <div key={mandat} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{mandat}</h2>
                  <p className="text-xs text-gray-500">{siteCount} site{siteCount > 1 ? 's' : ''} rattaché{siteCount > 1 ? 's' : ''} à ce mandat</p>
                </div>
              </div>
              {hasDraft && (
                <button
                  onClick={() => handleSave(mandat)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Enregistrer le barème
                </button>
              )}
            </div>

            <div className="p-4">
              {tiers.length === 0 && (
                <p className="text-sm text-gray-400 mb-3">Aucun palier défini — les chantiers de ce mandat ne génèrent pas d'honoraires calculés tant qu'aucun palier n'est ajouté.</p>
              )}
              <div className="space-y-2">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6">#{index + 1}</span>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">À partir de (€)</label>
                      <input
                        type="number"
                        value={tier.min}
                        onChange={(e) => updateTier(mandat, index, 'min', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Jusqu'à (€) — vide = illimité</label>
                      <input
                        type="number"
                        value={tier.max ?? ''}
                        placeholder="Illimité"
                        onChange={(e) => updateTier(mandat, index, 'max', e.target.value === '' ? null : parseInt(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-gray-500 mb-1">Taux (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={tier.rate}
                        onChange={(e) => updateTier(mandat, index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeTier(mandat, index)}
                      className="mt-5 p-1.5 text-red-500 hover:bg-red-50 rounded"
                      title="Supprimer ce palier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addTier(mandat)}
                className="mt-3 flex items-center px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter un palier
              </button>
              {tiers.length > 0 && !tiers[tiers.length - 1] && null}
              <p className="text-xs text-gray-400 mt-3">
                Au-delà du dernier palier (s'il a un montant maximum défini), le surplus n'est pas calculé automatiquement — il est signalé comme "à négocier de gré à gré" dans le module Travaux.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
