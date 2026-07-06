import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Award, Plus, ArrowLeft, Paperclip, Save } from 'lucide-react';
import { Certification, Obligation, Document as DocumentType } from '../types';
import { filterSitesByUser } from '../utils/permissions';

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

export default function Certifications() {
  const {
    sites, certifications, obligations, documents, currentRole, currentUser,
    addCertification, updateObligation, addObligation, addDocument, addAuditEntry
  } = useStore();

  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newCert, setNewCert] = useState({
    siteId: '', type: 'BREEAM' as Certification['type'], niveau: '',
    dateObtention: new Date().toISOString().split('T')[0], dateExpiration: ''
  });

  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const visibleSiteIds = new Set(visibleSites.map(s => s.id));
  const visibleCertifications = certifications.filter(c => visibleSiteIds.has(c.siteId));

  const getObligationsFor = (certification: Certification) =>
    (obligations || []).filter(o => o.source === 'Certification' && o.siteId === certification.siteId);

  const canManage = currentRole === 'PM' || currentRole === 'DT';
  const selectedCert = visibleCertifications.find(c => c.id === selectedCertId) || null;

  const handleCreateCert = () => {
    const site = sites.find(s => s.id === newCert.siteId);
    if (!site) return;
    addCertification({
      id: Date.now().toString(),
      siteId: newCert.siteId,
      siteName: site.name,
      type: newCert.type,
      niveau: newCert.niveau || undefined,
      dateObtention: newCert.dateObtention,
      dateExpiration: newCert.dateExpiration || undefined,
      status: 'Active'
    });
    setShowCreateForm(false);
    setNewCert({ siteId: '', type: 'BREEAM', niveau: '', dateObtention: new Date().toISOString().split('T')[0], dateExpiration: '' });
  };

  const handleAddManualAction = () => {
    if (!selectedCert || !newActionTitle.trim()) return;
    const newId = `obl-manual-${Date.now()}`;
    addObligation({
      id: newId,
      source: 'Certification',
      sourceLabel: `Certification ${selectedCert.type} — ${selectedCert.siteName}`,
      siteId: selectedCert.siteId,
      title: newActionTitle.trim(),
      targetModule: 'Documents',
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

  // Joindre une preuve = créer un vrai document dans la data room existante,
  // classé automatiquement, plutôt qu'un fichier isolé propre aux certifications.
  const handleAttachProof = (obligation: Obligation) => {
    const name = window.prompt('Nom du document justificatif (simulation — pas de vrai upload dans cette démo) :', `Preuve — ${obligation.title}`);
    if (!name) return;
    const doc: DocumentType = {
      id: Date.now().toString(),
      name,
      type: 'Conformité',
      siteId: obligation.siteId,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Validé',
      size: '1.0 MB',
      url: `/documents/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      createdByName: currentUser?.name || currentRole,
      createdByRole: currentRole
    };
    addDocument(doc);
    updateObligation(obligation.id, { documentIdPreuve: doc.id });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'Obligation',
      entityId: obligation.id,
      entityLabel: obligation.title,
      action: 'Preuve jointe',
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: new Date().toLocaleString('fr-FR'),
      comment: name
    });
  };

  // ----- Vue détail d'une certification -----
  if (selectedCert) {
    const certObligations = getObligationsFor(selectedCert);
    const progress = getProgress(certObligations);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCertId(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour aux certifications
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedCert.type}{selectedCert.niveau ? ` — ${selectedCert.niveau}` : ''}</h1>
              <p className="text-gray-600">{selectedCert.siteName}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Obtenue le {new Date(selectedCert.dateObtention).toLocaleDateString('fr-FR')}</span>
                {selectedCert.dateExpiration && <span>Expire le {new Date(selectedCert.dateExpiration).toLocaleDateString('fr-FR')}</span>}
              </div>
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
            <h2 className="text-base font-bold text-gray-900">Checklist des actions</h2>
            {canManage && (
              <button
                onClick={() => setShowAddAction(true)}
                className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter une action
              </button>
            )}
          </div>
          {certObligations.length === 0 ? (
            <p className="text-sm text-gray-400 p-8 text-center">Aucune action pour cette certification.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {certObligations.map(o => (
                <div key={o.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{o.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Module concerné : {o.targetModule}</p>
                    {o.avancementUpdatedByName && (
                      <p className="text-xs text-gray-400">Mis à jour par {o.avancementUpdatedByName} le {o.avancementUpdatedAt}</p>
                    )}
                    {o.documentIdPreuve && (
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <Paperclip className="w-3 h-3 mr-1" /> Preuve jointe dans Documents
                      </p>
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
                        <button
                          onClick={() => handleAttachProof(o)}
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                          title="Joindre une preuve"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium rounded px-2 py-1 ${AVANCEMENT_COLOR[o.avancement || 'À faire']}`}>
                        {o.avancement || 'À faire'}
                      </span>
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter une action manuelle</h3>
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Ex: Préparer l'audit annuel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowAddAction(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={handleAddManualAction} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-1.5" /> Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- Vue liste d'ensemble -----
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Award className="w-6 h-6 mr-2 text-purple-600" />
            Certifications <span className="ml-2 text-sm font-normal text-gray-400">(option à activer)</span>
          </h1>
          <p className="text-gray-600">HQE, BREEAM, OSMOZ, SmartScore, R2S... suivi réel des actions requises pour chaque certification.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter une certification
          </button>
        )}
      </div>

      {visibleCertifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Aucune certification enregistrée pour ce périmètre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCertifications.map(cert => {
            const certObligations = getObligationsFor(cert);
            const progress = getProgress(certObligations);
            const fait = certObligations.filter(o => o.avancement === 'Fait').length;
            const enCours = certObligations.filter(o => o.avancement === 'En cours').length;
            const aFaire = certObligations.filter(o => !o.avancement || o.avancement === 'À faire').length;
            const daysToExpiry = cert.dateExpiration
              ? Math.ceil((new Date(cert.dateExpiration).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <button
                key={cert.id}
                onClick={() => canManage && setSelectedCertId(cert.id)}
                className={`text-left bg-white rounded-lg shadow-sm border border-gray-200 p-5 transition-shadow ${canManage ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{cert.type}{cert.niveau ? ` — ${cert.niveau}` : ''}</h3>
                    <p className="text-xs text-gray-500">{cert.siteName}</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {fait} fait{fait > 1 ? 's' : ''}, {enCours} en cours, {aFaire} à faire
                </p>
                {cert.dateExpiration && (
                  <p className={`text-xs ${daysToExpiry !== null && daysToExpiry < 0 ? 'text-red-600' : daysToExpiry !== null && daysToExpiry < 90 ? 'text-orange-600' : 'text-gray-400'}`}>
                    Échéance : {new Date(cert.dateExpiration).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter une certification</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select value={newCert.siteId} onChange={(e) => setNewCert(prev => ({ ...prev, siteId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Sélectionner un site</option>
                  {visibleSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de certification</label>
                <select value={newCert.type} onChange={(e) => setNewCert(prev => ({ ...prev, type: e.target.value as Certification['type'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="HQE">HQE</option>
                  <option value="BREEAM">BREEAM</option>
                  <option value="OSMOZ">OSMOZ</option>
                  <option value="SmartScore">SmartScore</option>
                  <option value="R2S">R2S</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau (facultatif)</label>
                <input type="text" value={newCert.niveau} onChange={(e) => setNewCert(prev => ({ ...prev, niveau: e.target.value }))} placeholder="Ex: Very Good, Excellent..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'obtention</label>
                  <input type="date" value={newCert.dateObtention} onChange={(e) => setNewCert(prev => ({ ...prev, dateObtention: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input type="date" value={newCert.dateExpiration} onChange={(e) => setNewCert(prev => ({ ...prev, dateExpiration: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreateCert} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
