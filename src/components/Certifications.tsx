import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Award, Plus } from 'lucide-react';
import { Certification } from '../types';

export default function Certifications() {
  const { sites, certifications, obligations, addCertification, currentRole, currentUser } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCert, setNewCert] = useState({
    siteId: '',
    type: 'BREEAM' as Certification['type'],
    niveau: '',
    dateObtention: new Date().toISOString().split('T')[0],
    dateExpiration: ''
  });

  const handleCreate = () => {
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

  const getObligationsFor = (certification: Certification) =>
    (obligations || []).filter(o => o.source === 'Certification' && o.siteId === certification.siteId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Award className="w-6 h-6 mr-2 text-purple-600" />
            Certifications <span className="ml-2 text-sm font-normal text-gray-400">(option à activer)</span>
          </h1>
          <p className="text-gray-600">HQE, BREEAM, OSMOZ, SmartScore, R2S... chaque certification peut générer ses propres obligations de suivi.</p>
        </div>
        {(currentRole === 'PM' || currentRole === 'DT') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter une certification
          </button>
        )}
      </div>

      {certifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Aucune certification enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map(cert => {
            const linkedObligations = getObligationsFor(cert);
            return (
              <div key={cert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{cert.type}{cert.niveau ? ` — ${cert.niveau}` : ''}</h3>
                    <p className="text-sm text-gray-500">{cert.siteName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${cert.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {cert.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                  <p>Obtenue le : {new Date(cert.dateObtention).toLocaleDateString('fr-FR')}</p>
                  {cert.dateExpiration && <p>Expire le : {new Date(cert.dateExpiration).toLocaleDateString('fr-FR')}</p>}
                </div>

                {linkedObligations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Obligations générées par cette certification</p>
                    <div className="space-y-2">
                      {linkedObligations.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-800">{o.title}</p>
                            <p className="text-xs text-gray-400">Module concerné : {o.targetModule}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${o.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {o.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                <select
                  value={newCert.siteId}
                  onChange={(e) => setNewCert(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de certification</label>
                <select
                  value={newCert.type}
                  onChange={(e) => setNewCert(prev => ({ ...prev, type: e.target.value as Certification['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
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
                <input
                  type="text"
                  value={newCert.niveau}
                  onChange={(e) => setNewCert(prev => ({ ...prev, niveau: e.target.value }))}
                  placeholder="Ex: Very Good, Excellent..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'obtention</label>
                  <input
                    type="date"
                    value={newCert.dateObtention}
                    onChange={(e) => setNewCert(prev => ({ ...prev, dateObtention: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    value={newCert.dateExpiration}
                    onChange={(e) => setNewCert(prev => ({ ...prev, dateExpiration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleCreate} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
