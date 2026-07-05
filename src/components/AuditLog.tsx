import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { History, Filter } from 'lucide-react';
import { AuditEntry } from '../types';

const ENTITY_LABELS: Record<AuditEntry['entityType'], string> = {
  BudgetPPA: 'Budget PPA',
  Document: 'Document',
  Sinistre: 'Sinistre',
  Connexion: 'Connexion'
};

const ACTION_COLOR: Record<string, string> = {
  'Validé': 'bg-green-100 text-green-800',
  'Accepté': 'bg-green-100 text-green-800',
  'Activée': 'bg-green-100 text-green-800',
  'Refusé': 'bg-red-100 text-red-800',
  'Rejeté': 'bg-red-100 text-red-800',
  'Désactivée': 'bg-red-100 text-red-800'
};

export default function AuditLog() {
  const { auditLog } = useStore();
  const [filterType, setFilterType] = useState<AuditEntry['entityType'] | ''>('');

  const entries = (auditLog || [])
    .filter(e => !filterType || e.entityType === filterType)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <History className="w-6 h-6 mr-2 text-gray-700" />
          Journal d'audit
        </h1>
        <p className="text-gray-600">Historique complet des actions sensibles : qui a validé, refusé ou modifié quoi, et quand.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AuditEntry['entityType'] | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 p-8 text-center">Aucune action enregistrée pour le moment.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {entries.map(entry => (
              <div key={entry.id} className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{ENTITY_LABELS[entry.entityType]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ACTION_COLOR[entry.action] || 'bg-gray-100 text-gray-700'}`}>{entry.action}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{entry.entityLabel}</p>
                  {entry.comment && <p className="text-xs text-gray-500 italic mt-0.5">"{entry.comment}"</p>}
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0 ml-4">
                  <p className="font-medium text-gray-600">{entry.performedByName}</p>
                  <p>{entry.performedByRole}</p>
                  <p className="mt-1">{entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
