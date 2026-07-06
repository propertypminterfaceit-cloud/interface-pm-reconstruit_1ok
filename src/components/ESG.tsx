import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, Plus, ArrowLeft, Paperclip, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { EsgSubject, Obligation, Document as DocumentType } from '../types';
import { filterSitesByUser } from '../utils/permissions';

const PILLAR_COLOR: Record<EsgSubject['pillar'], string> = {
  Environnement: 'bg-green-100 text-green-800',
  Social: 'bg-blue-100 text-blue-800',
  Gouvernance: 'bg-purple-100 text-purple-800'
};

const AVANCEMENT_COLOR: Record<string, string> = {
  'Fait': 'bg-green-100 text-green-800',
  'En cours': 'bg-blue-100 text-blue-800',
  'À faire': 'bg-gray-100 text-gray-600'
};

function getProgress(obligations: Obligation[]): number {
  if (obligations.length === 0) return 0;
  const fait = obligations.filter(o => o.avancement === 'Fait').length;
  return Math.round((fait / obligations.length) * 100);
}

export default function ESG() {
  const {
    esgSubjects, obligations, sites, currentRole, currentUser, documents,
    addEsgSubject, updateEsgSubject, addObligation, updateObligation, addDocument, addAuditEntry
  } = useStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ pillar: 'Environnement' as EsgSubject['pillar'], label: '', mandat: '' });
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');

  const canManage = currentRole === 'PM' || currentRole === 'DT';
  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const visibleMandats = Array.from(new Set(visibleSites.map(s => s.mandat).filter((m): m is string => !!m)));

  const visibleSubjects = (esgSubjects || []).filter(s => visibleMandats.includes(s.mandat));
  const activeSubjects = visibleSubjects.filter(s => s.active);

  const getSubjectObligations = (subjectId: string) =>
    (obligations || []).filter(o => o.esgSubjectId === subjectId);

  const selectedSubject = visibleSubjects.find(s => s.id === selectedSubjectId) || null;

  const handleAddSubject = () => {
    if (!newSubject.label.trim() || !newSubject.mandat) return;
    addEsgSubject({
      id: `esg-subj-custom-${Date.now()}`,
      pillar: newSubject.pillar,
      label: newSubject.label.trim(),
      mandat: newSubject.mandat,
      active: true,
      isCustom: true
    });
    setNewSubject({ pillar: 'Environnement', label: '', mandat: '' });
    setShowAddSubject(false);
  };

  const handleAddAction = () => {
    if (!selectedSubject || !newActionTitle.trim()) return;
    const newId = `obl-esg-${Date.now()}`;
    addObligation({
      id: newId,
      source: 'ESG',
      sourceLabel: `ESG — ${selectedSubject.label}`,
      mandat: selectedSubject.mandat,
      esgSubjectId: selectedSubject.id,
      title: newActionTitle.trim(),
      targetModule: 'ESG',
      ruleType: 'Autre',
      params: {},
      status: 'Active',
      createdByName: currentUser?.name || currentRole,
      createdAt: new Date().toLocaleString('fr-FR'),
      avancement: 'À faire'
    });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'Obligation',
      entityId: newId,
      entityLabel: newActionTitle.trim(),
      action: 'Action ajoutée',
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: new Date().toLocaleString('fr-FR')
    });
    setNewActionTitle('');
    setShowAddAction(false);
  };

  const handleSetAvancement = (obligation: Obligation, avancement: Obligation['avancement']) => {
    const now = new Date().toLocaleString('fr-FR');
    updateObligation(obligation.id, {
      avancement,
      avancementUpdatedByName: currentUser?.name || currentRole,
      avancementUpdatedAt: now
    });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'Obligation',
      entityId: obligation.id,
      entityLabel: obligation.title,
      action: `Avancement : ${avancement}`,
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: now
    });
  };

  const handleAttachProof = (obligation: Obligation) => {
    const name = window.prompt('Nom du document justificatif (simulation) :', `Preuve — ${obligation.title}`);
    if (!name) return;
    const doc: DocumentType = {
      id: Date.now().toString(),
      name,
      type: 'ESG',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Validé',
      size: '1.0 MB',
      url: `/documents/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      createdByName: currentUser?.name || currentRole,
      createdByRole: currentRole
    };
    addDocument(doc);
    updateObligation(obligation.id, { documentIdPreuve: doc.id });
  };

  // ----- Vue détail d'un sujet -----
  if (selectedSubject) {
    const subjectObligations = getSubjectObligations(selectedSubject.id);
    const progress = getProgress(subjectObligations);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedSubjectId(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour au catalogue ESG
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${PILLAR_COLOR[selectedSubject.pillar]}`}>{selectedSubject.pillar}</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{selectedSubject.label}</h1>
              <p className="text-gray-600 text-sm">Mandat : {selectedSubject.mandat}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold text-gray-900">{progress}%</p>
              <p className="text-xs text-gray-500">d'avancement</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Actions de suivi</h2>
            {canManage && (
              <button onClick={() => setShowAddAction(true)} className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter une action
              </button>
            )}
          </div>
          {subjectObligations.length === 0 ? (
            <p className="text-sm text-gray-400 p-8 text-center">Aucune action pour ce sujet pour le moment.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {subjectObligations.map(o => (
                <div key={o.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{o.title}</p>
                    {o.avancementUpdatedByName && (
                      <p className="text-xs text-gray-400 mt-0.5">Mis à jour par {o.avancementUpdatedByName} le {o.avancementUpdatedAt}</p>
                    )}
                    {o.documentIdPreuve && (
                      <p className="text-xs text-green-600 flex items-center mt-1"><Paperclip className="w-3 h-3 mr-1" /> Preuve jointe dans Documents</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canManage ? (
                      <>
                        <select
                          value={o.avancement || 'À faire'}
                          onChange={(e) => handleSetAvancement(o, e.target.value as Obligation['avancement'])}
                          className={`text-xs font-medium rounded px-2 py-1 border-0 ${AVANCEMENT_COLOR[o.avancement || 'À faire']}`}
                        >
                          <option value="À faire">À faire</option>
                          <option value="En cours">En cours</option>
                          <option value="Fait">Fait</option>
                        </select>
                        <button onClick={() => handleAttachProof(o)} className="p-1.5 text-gray-400 hover:text-gray-600" title="Joindre une preuve">
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium rounded px-2 py-1 ${AVANCEMENT_COLOR[o.avancement || 'À faire']}`}>{o.avancement || 'À faire'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter une action</h3>
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Ex: Réaliser l'enquête de satisfaction T2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowAddAction(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleAddAction} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1.5" /> Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- Vue catalogue par pilier -----
  const pillars: EsgSubject['pillar'][] = ['Environnement', 'Social', 'Gouvernance'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Leaf className="w-6 h-6 mr-2 text-green-600" />
            ESG
          </h1>
          <p className="text-gray-600">Catalogue configurable des sujets Environnement, Social et Gouvernance — activez, désactivez ou ajoutez un sujet par mandat.</p>
        </div>
        {currentRole === 'DT' && (
          <button onClick={() => setShowAddSubject(true)} className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un sujet
          </button>
        )}
      </div>

      {pillars.map(pillar => {
        const pillarSubjects = visibleSubjects.filter(s => s.pillar === pillar);
        if (pillarSubjects.length === 0) return null;
        return (
          <div key={pillar} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${PILLAR_COLOR[pillar]}`}>{pillar}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {pillarSubjects.map(subject => {
                const subjectObligations = getSubjectObligations(subject.id);
                const progress = getProgress(subjectObligations);
                return (
                  <div key={subject.id} className="p-4 flex items-center justify-between gap-4">
                    <button
                      onClick={() => subject.active && setSelectedSubjectId(subject.id)}
                      className={`text-left min-w-0 ${subject.active ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                      disabled={!subject.active}
                    >
                      <p className="text-sm font-medium text-gray-900">{subject.label}</p>
                      <p className="text-xs text-gray-400">{subject.mandat}{subject.isCustom ? ' — sujet personnalisé' : ''}</p>
                    </button>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {subject.active && (
                        <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                      )}
                      {currentRole === 'DT' && (
                        <button onClick={() => updateEsgSubject(subject.id, { active: !subject.active })} title={subject.active ? 'Désactiver ce sujet' : 'Activer ce sujet'}>
                          {subject.active ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {activeSubjects.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Aucun sujet ESG actif pour ce périmètre.</p>
        </div>
      )}

      {showAddSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter un sujet ESG</h3>
            <div className="space-y-3">
              <select value={newSubject.mandat} onChange={(e) => setNewSubject(prev => ({ ...prev, mandat: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Sélectionner un mandat</option>
                {visibleMandats.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={newSubject.pillar} onChange={(e) => setNewSubject(prev => ({ ...prev, pillar: e.target.value as EsgSubject['pillar'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="Environnement">Environnement</option>
                <option value="Social">Social</option>
                <option value="Gouvernance">Gouvernance</option>
              </select>
              <input
                type="text"
                value={newSubject.label}
                onChange={(e) => setNewSubject(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Nom du sujet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setShowAddSubject(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleAddSubject} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
