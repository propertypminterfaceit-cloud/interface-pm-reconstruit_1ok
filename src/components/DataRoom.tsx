import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { FolderArchive, FileText, Download, Loader2 } from 'lucide-react';
import { filterSitesByUser } from '../utils/permissions';
import { getDataRoomCategory } from '../utils/documentCategories';

interface FolderDef {
  label: string;
  icon: string;
}

const FOLDERS: FolderDef[] = [
  { label: 'Réglementaire', icon: '📋' },
  { label: 'Contrôle', icon: '🔍' },
  { label: 'PPA réalisé', icon: '💶' },
  { label: 'Interventions', icon: '🔧' },
  { label: 'Contrats prestataires', icon: '📄' },
  { label: 'Suivi ESG', icon: '🌱' }
];

export default function DataRoom() {
  const {
    sites, documents, conformities, budgetPPA, interventions, prestataires, esgData,
    currentRole, currentUser
  } = useStore();
  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);
  const [selectedSiteId, setSelectedSiteId] = useState(visibleSites[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);

  const site = visibleSites.find(s => s.id === selectedSiteId);

  const getFolderContent = (folder: string) => {
    if (!site) return [];
    switch (folder) {
      case 'Réglementaire':
        return [
          ...documents.filter(d => d.siteId === site.id && (getDataRoomCategory(d.type) === 'Réglementaire')).map(d => `[Document] ${d.name} — ${d.status}`),
        ];
      case 'Contrôle':
        return conformities.filter(c => c.siteId === site.id).map(c => `[Conformité] ${c.obligation} — ${c.status}`);
      case 'PPA réalisé':
        return budgetPPA.filter(b => b.siteId === site.id && (b.status === 'Terminé' || b.status === 'Réceptionné'))
          .map(b => `[PPA] ${b.object} — ${b.amount.toLocaleString()}€ — ${b.status}`);
      case 'Interventions':
        return interventions.filter(i => i.siteId === site.id && (i.status === 'Clôturée' || i.status === 'Réalisée'))
          .map(i => `[Travaux] ${i.description} — ${i.amount ? `${i.amount.toLocaleString()}€ — ` : ''}${i.status}`);
      case 'Contrats prestataires':
        return prestataires.filter(p => (p.sites || []).includes(site.id))
          .map(p => `[Prestataire] ${p.name} (${p.metier})${p.contractEndDate ? ` — contrat jusqu'au ${new Date(p.contractEndDate).toLocaleDateString('fr-FR')}` : ''}`);
      case 'Suivi ESG':
        return esgData.filter(e => e.siteId === site.id)
          .map(e => `[ESG ${e.month}] Énergie ${e.energy} / Eau ${e.water} / Déchets ${e.waste} / CO2 ${e.co2}`);
      default:
        return [];
    }
  };

  const handleExport = async () => {
    if (!site) return;
    setIsExporting(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const root = zip.folder(site.name.replace(/[^a-zA-Z0-9 ]/g, '')) || zip;

      FOLDERS.forEach(folder => {
        const items = getFolderContent(folder.label);
        const folderZip = root.folder(folder.label);
        if (folderZip) {
          const content = items.length > 0
            ? items.join('\n\n')
            : 'Aucun élément dans cette catégorie pour ce site.';
          folderZip.file(`${folder.label}.txt`, content);
        }
      });

      root.file('README.txt',
        `Data room — ${site.name}\nGénéré le ${new Date().toLocaleString('fr-FR')}\n\n` +
        `Cette version démo contient des fiches récapitulatives par catégorie, pas les fichiers binaires originaux (non stockés dans cette démo).`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-room-${site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FolderArchive className="w-6 h-6 mr-2 text-blue-600" />
            Data Room par site
          </h1>
          <p className="text-gray-600">Vue consolidée de tous les documents et éléments d'un site, classés par sujet.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {visibleSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting || !site}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? 'Préparation...' : 'Exporter la data room (ZIP)'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        Mode démonstration — l'export contient des fiches récapitulatives par catégorie (pas de vrais fichiers PDF, puisqu'aucun binaire n'est stocké dans cette version démo).
      </div>

      {!site ? (
        <p className="text-sm text-gray-400">Aucun site disponible pour ce périmètre.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOLDERS.map(folder => {
            const items = getFolderContent(folder.label);
            return (
              <div key={folder.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">{folder.icon}</span> {folder.label}
                  <span className="ml-2 text-xs font-normal text-gray-400">({items.length})</span>
                </h3>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun élément.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.slice(0, 6).map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <FileText className="w-3.5 h-3.5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                    {items.length > 6 && <li className="text-xs text-gray-400">+ {items.length - 6} autre(s)</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
