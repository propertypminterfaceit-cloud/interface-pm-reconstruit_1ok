import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { FileSignature, CheckCircle2, XCircle, Clock, Sparkles, Info } from 'lucide-react';
import { Obligation } from '../types';

const SOURCE_COLOR: Record<Obligation['source'], string> = {
  Mandat: 'bg-blue-100 text-blue-800',
  Certification: 'bg-purple-100 text-purple-800',
  ESG: 'bg-green-100 text-green-800',
  SmartBuilding: 'bg-cyan-100 text-cyan-800',
  Interne: 'bg-gray-100 text-gray-800'
};

// Obligations "extraites" pré-écrites, utilisées pour simuler ce que rendrait
// une vraie analyse IA d'un mandat — voir l'échange sur le sujet : ceci est
// une simulation pour la démo, pas un vrai appel à un moteur d'extraction.
const SIMULATED_EXTRACTIONS: Omit<Obligation, 'id' | 'status' | 'createdAt'>[] = [
  {
    source: 'Mandat',
    sourceLabel: 'Mandat PIMCO',
    mandat: 'PIMCO',
    clauseReference: 'Article 11.3',
    title: 'Revue ESG trimestrielle obligatoire',
    targetModule: 'ESG',
    ruleType: 'Frequence',
    params: { frequencyDays: 90 },
    createdByName: 'Extraction automatique (IA)'
  }
];

export default function SpecificitesMandat() {
  const { obligations, currentRole, currentUser, addObligation, updateObligation, addAuditEntry } = useStore();
  const [validationTarget, setValidationTarget] = useState<{ obligation: Obligation; action: 'Active' | 'Rejetée' } | null>(null);
  const [comment, setComment] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const sorted = [...(obligations || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const handleSimulateImport = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const extraction = SIMULATED_EXTRACTIONS[Math.floor(Math.random() * SIMULATED_EXTRACTIONS.length)];
      addObligation({
        ...extraction,
        id: `obl-sim-${Date.now()}`,
        status: 'Extraite (IA)',
        createdAt: new Date().toLocaleString('fr-FR')
      });
      setIsSimulating(false);
    }, 1800);
  };

  const openValidation = (obligation: Obligation, action: 'Active' | 'Rejetée') => {
    setValidationTarget({ obligation, action });
    setComment('');
  };

  const confirmValidation = () => {
    if (!validationTarget) return;
    const now = new Date().toLocaleString('fr-FR');
    updateObligation(validationTarget.obligation.id, {
      status: validationTarget.action,
      validatedByName: currentUser?.name || currentRole,
      validatedAt: now,
      validationComment: comment.trim() || undefined
    });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'Obligation',
      entityId: validationTarget.obligation.id,
      entityLabel: validationTarget.obligation.title,
      action: validationTarget.action === 'Active' ? 'Validée' : 'Rejetée',
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: now,
      comment: comment.trim() || undefined
    });
    setValidationTarget(null);
    setComment('');
  };

  const renderRuleSummary = (o: Obligation) => {
    switch (o.ruleType) {
      case 'SeuilValidation':
        return `Au-delà de ${o.params.threshold?.toLocaleString()}€ : ${o.params.devisRequired ? `${o.params.devisRequired} devis, ` : ''}validateurs = ${(o.params.validatorsRequired || []).join(', ')}`;
      case 'Frequence':
        return `Fréquence : tous les ${o.params.frequencyDays} jours${o.params.documentType ? ` (preuve : ${o.params.documentType})` : ''}`;
      case 'ConsigneTemperature':
        return `Plage autorisée : ${o.params.temperatureMin}°C – ${o.params.temperatureMax}°C`;
      case 'KPI':
        return 'Génère un suivi KPI dans le module concerné';
      case 'ObligationDocumentaire':
        return `Preuve attendue : ${o.params.documentType || 'document'}`;
      default:
        return '—';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileSignature className="w-6 h-6 mr-2 text-gray-700" />
            Spécificités du mandat
          </h1>
          <p className="text-gray-600">
            Centre de gouvernance et de traçabilité — chaque obligation ici active une règle réelle dans le module concerné (Travaux, Documents, ESG...), vous n'avez pas besoin de revenir sur cet écran au quotidien.
          </p>
        </div>
        <button
          onClick={handleSimulateImport}
          disabled={isSimulating}
          className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isSimulating ? 'Analyse en cours...' : 'Simuler un import de mandat (IA)'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Mode démonstration —</span> le bouton ci-dessus simule une extraction IA
          d'un document de mandat (délai réaliste, obligation pré-remplie). Une vraie extraction demanderait un
          service serveur dédié appelant un modèle d'analyse de documents.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        {sorted.length === 0 && (
          <p className="text-sm text-gray-400 p-8 text-center">Aucune obligation enregistrée pour le moment.</p>
        )}
        {sorted.map(o => (
          <div key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${SOURCE_COLOR[o.source]}`}>{o.sourceLabel}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{o.targetModule}</span>
                  {o.clauseReference && <span className="text-xs text-gray-400">{o.clauseReference}</span>}
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">{o.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{renderRuleSummary(o)}</p>
                {o.createdByName && (
                  <p className="text-xs text-gray-400 mt-1">Ajoutée par {o.createdByName}{o.createdAt ? ` le ${o.createdAt}` : ''}</p>
                )}
                {o.validatedByName && (
                  <p className="text-xs text-gray-400">
                    {o.status === 'Active' ? 'Validée' : 'Refusée'} par {o.validatedByName} le {o.validatedAt}
                    {o.validationComment && ` — "${o.validationComment}"`}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                {o.status === 'Active' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                  </span>
                )}
                {o.status === 'Rejetée' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Rejetée
                  </span>
                )}
                {(o.status === 'Extraite (IA)' || o.status === 'En attente de validation') && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800 mb-2">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {o.status}
                    </span>
                    {currentRole === 'DT' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openValidation(o, 'Active')}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Activer
                        </button>
                        <button
                          onClick={() => openValidation(o, 'Rejetée')}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {validationTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {validationTarget.action === 'Active' ? 'Activer' : 'Rejeter'} l'obligation
            </h3>
            <p className="text-sm text-gray-600 mb-4">{validationTarget.obligation.title}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setValidationTarget(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={confirmValidation}
                className={`px-4 py-2 text-white rounded-lg ${validationTarget.action === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
