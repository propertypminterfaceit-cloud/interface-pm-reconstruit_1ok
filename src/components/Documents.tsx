import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Upload, Filter, Search, Eye, Download, CheckCircle, Clock, XCircle, Archive, FolderOpen } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import { Document } from '../types';
import { getDataRoomCategory, DATA_ROOM_CATEGORIES, DataRoomCategory } from '../utils/documentCategories';

export default function Documents() {
  const { documents, sites, addDocument, updateDocument, currentRole, currentUser, archiveDocumentsForYear, addAuditEntry, setActiveTab } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterCategory, setFilterCategory] = useState<DataRoomCategory | ''>('');
  const [viewMode, setViewMode] = useState<'actifs' | 'archives'>('actifs');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [validationTarget, setValidationTarget] = useState<{ document: Document; action: 'Validé' | 'Rejeté' } | null>(null);
  const [validationComment, setValidationComment] = useState('');

  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'RMA' as 'RMA' | 'RME' | 'Contrats' | 'Interventions' | 'Sinistres' | 'Conformité' | 'PPA' | 'ESG' | 'Autres',
    siteId: '',
    size: '1.2 MB'
  });

  const currentYear = new Date().getFullYear();
  const archivableYears = Array.from(
    new Set<number>((documents || []).filter(d => !d.archivedYear).map(d => new Date(d.uploadDate).getFullYear()))
  ).sort();

  const scopedDocuments = documents.filter(document =>
    viewMode === 'archives' ? !!document.archivedYear : !document.archivedYear
  );

  const filteredDocuments = scopedDocuments.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || document.type === filterType;
    const matchesStatus = !filterStatus || document.status === filterStatus;
    const matchesSite = !filterSite || document.siteId === filterSite;
    const matchesCategory = !filterCategory || getDataRoomCategory(document.type) === filterCategory;
    
    return matchesSearch && matchesType && matchesStatus && matchesSite && matchesCategory;
  });

  const categoryCounts = DATA_ROOM_CATEGORIES.map(category => ({
    category,
    count: scopedDocuments.filter(d => getDataRoomCategory(d.type) === category).length
  }));

  const handleArchiveYear = (year: number) => {
    const count = (documents || []).filter(d => !d.archivedYear && new Date(d.uploadDate).getFullYear() === year).length;
    const confirmed = window.confirm(
      `Archiver les ${count} document(s) de ${year} ? Ils resteront consultables dans l'onglet "Archives", en lecture seule, séparés des documents actifs.`
    );
    if (!confirmed) return;
    archiveDocumentsForYear(year);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Validé': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'En attente': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Rejeté': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé': return 'bg-green-100 text-green-800 border-green-200';
      case 'En attente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Rejeté': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RMA': return 'bg-blue-100 text-blue-800';
      case 'RME': return 'bg-purple-100 text-purple-800';
      case 'Contrats': return 'bg-green-100 text-green-800';
      case 'Interventions': return 'bg-orange-100 text-orange-800';
      case 'Sinistres': return 'bg-red-100 text-red-800';
      case 'Conformité': return 'bg-yellow-100 text-yellow-800';
      case 'PPA': return 'bg-indigo-100 text-indigo-800';
      case 'ESG': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUploadDocument = () => {
    const document = {
      id: Date.now().toString(),
      name: newDocument.name,
      type: newDocument.type,
      siteId: newDocument.siteId || undefined,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'En attente' as const,
      size: newDocument.size,
      url: `/documents/${newDocument.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      createdByName: currentUser?.name || currentRole,
      createdByRole: currentRole
    };

    addDocument(document);
    setShowUploadForm(false);
    setNewDocument({
      name: '',
      type: 'RMA',
      siteId: '',
      size: '1.2 MB'
    });
  };

  const openDocValidationDialog = (document: Document, action: 'Validé' | 'Rejeté') => {
    setValidationTarget({ document, action });
    setValidationComment('');
  };

  const confirmDocValidation = () => {
    if (!validationTarget) return;
    const now = new Date().toLocaleString('fr-FR');
    updateDocument(validationTarget.document.id, {
      status: validationTarget.action,
      validatedByName: currentUser?.name || currentRole,
      validatedAt: now,
      validationComment: validationComment.trim() || undefined
    });
    addAuditEntry({
      id: Date.now().toString(),
      entityType: 'Document',
      entityId: validationTarget.document.id,
      entityLabel: validationTarget.document.name,
      action: validationTarget.action,
      performedByName: currentUser?.name || currentRole,
      performedByRole: currentRole,
      timestamp: now,
      comment: validationComment.trim() || undefined
    });
    setValidationTarget(null);
    setValidationComment('');
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const documentStats = {
    total: scopedDocuments.length,
    valides: scopedDocuments.filter(d => d.status === 'Validé').length,
    enAttente: scopedDocuments.filter(d => d.status === 'En attente').length,
    rejetes: scopedDocuments.filter(d => d.status === 'Rejeté').length
  };

  const documentTypes = ['RMA', 'RME', 'Contrats', 'Interventions', 'Sinistres', 'Conformité', 'PPA', 'ESG', 'Autres'];

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Validés</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.valides}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.enAttente}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejetés</p>
              <p className="text-2xl font-bold text-gray-900">{documentStats.rejetes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec bouton d'upload */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">{scopedDocuments.length} document{scopedDocuments.length > 1 ? 's' : ''} {viewMode === 'archives' ? 'archivés' : 'actifs'}</p>
        </div>
        
        {currentRole !== 'Propriétaire' && viewMode === 'actifs' && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Uploader un document
          </button>
        )}
      </div>

      {/* Onglets Data Room : documents actifs vs archives annuelles */}
      <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setViewMode('actifs')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'actifs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FolderOpen className="w-4 h-4 mr-2" /> Documents actifs
          </button>
          <button
            onClick={() => setViewMode('archives')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'archives' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Archive className="w-4 h-4 mr-2" /> Archives
          </button>
        </div>
        {(currentRole === 'PM' || currentRole === 'DT') && viewMode === 'actifs' && archivableYears.filter(y => y < currentYear).length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Archiver une année révolue :</span>
            {archivableYears.filter(y => y < currentYear).map(year => (
              <button
                key={year}
                onClick={() => handleArchiveYear(year)}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Archiver {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Classement par catégorie (propre au module Documents) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Classement par catégorie</h3>
          <button
            onClick={() => setActiveTab && setActiveTab('data-room')}
            className="text-xs text-blue-600 hover:underline"
          >
            Voir la Data Room complète du site (tous modules + export ZIP) →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categoryCounts.map(({ category, count }) => (
            <button
              key={category}
              onClick={() => setFilterCategory(filterCategory === category ? '' : category)}
              className={`p-3 rounded-lg border text-left transition-colors ${filterCategory === category ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <p className="text-xs text-gray-500">{category}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="Validé">Validé</option>
            <option value="En attente">En attente</option>
            <option value="Rejeté">Rejeté</option>
          </select>
          
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Liste des documents</h2>
            {(currentRole === 'PM' || currentRole === 'DT') && (
              <div className="text-sm text-gray-600">
                Validation disponible depuis les modules concernés
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date upload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{document.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(document.type)}`}>
                      {document.type}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{getDataRoomCategory(document.type)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {document.siteId ? sites.find(s => s.id === document.siteId)?.name : 'Global'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(document.uploadDate).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(document.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full border ${
                        document.type === 'RMA' || document.type === 'RME' ? 'bg-green-100 text-green-800 border-green-200' : getStatusColor(document.status)
                      }`}>
                        {document.type === 'RMA' || document.type === 'RME' ? 'Validé' : document.status}
                      </span>
                    </div>
                    {document.validatedByName && (
                      <div className="text-xs text-gray-400 mt-1">par {document.validatedByName} le {document.validatedAt}</div>
                    )}
                    {document.status === 'Rejeté' && document.validationComment && (
                      <div className="text-xs text-gray-500 italic mt-0.5">"{document.validationComment}"</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{document.size}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(currentRole === 'PM' || currentRole === 'DT') && document.type === 'Contrats' && (
                        <button 
                          onClick={() => handleViewDocument(document)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Ouvrir avec Assistant IA"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      {(currentRole === 'PM' || currentRole === 'DT') && document.status === 'En attente' && (
                        <>
                          <button
                            onClick={() => openDocValidationDialog(document, 'Validé')}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => openDocValidationDialog(document, 'Rejeté')}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'upload */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Uploader un document</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du document</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Rapport maintenance Q1 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de document</label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site (optionnel)</label>
                <select
                  value={newDocument.siteId}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Document global</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Glissez-déposez votre fichier ici ou cliquez pour sélectionner</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX jusqu'à 10MB</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUploadDocument}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Uploader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualiseur de document avec Assistant IA */}
      {showDocumentViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowDocumentViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Modale de validation / rejet nominatif d'un document */}
      {validationTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {validationTarget.action === 'Validé' ? 'Valider' : 'Rejeter'} le document
            </h3>
            <p className="text-sm text-gray-600 mb-4">{validationTarget.document.name}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire {validationTarget.action === 'Rejeté' ? '(recommandé)' : '(optionnel)'}
            </label>
            <textarea
              value={validationComment}
              onChange={(e) => setValidationComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Ex: Document incomplet, à reprendre"
            />
            <p className="text-xs text-gray-400 mb-4">
              Cette action sera horodatée et associée à votre nom ({currentUser?.name || currentRole}).
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setValidationTarget(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={confirmDocValidation}
                className={`px-4 py-2 text-white rounded-lg ${validationTarget.action === 'Validé' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirmer {validationTarget.action === 'Validé' ? 'la validation' : 'le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}