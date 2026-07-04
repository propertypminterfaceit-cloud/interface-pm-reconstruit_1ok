import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle, XCircle, Clock, Filter, Search, FileText, Wrench, Users, DollarSign } from 'lucide-react';

export default function Validation() {
  const { 
    interventions, documents, prestataires, budgetPPA, 
    updateIntervention, updateDocument, updatePrestataire, updateBudgetPPA,
    currentRole 
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Vérifier que l'utilisateur est DT
  if (currentRole !== 'DT') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Ce module est réservé aux Directeurs Techniques.</p>
        </div>
      </div>
    );
  }

  // Éléments en attente de validation
  const pendingItems = [
    ...interventions
      .filter(i => i.status === 'En attente')
      .map(i => ({
        id: i.id,
        type: 'intervention',
        title: i.description,
        site: i.siteName,
        date: i.dateRequested,
        amount: i.amount,
        details: `Catégorie: ${i.category}`,
        data: i
      })),
    ...documents
      .filter(d => d.status === 'En attente')
      .map(d => ({
        id: d.id,
        type: 'document',
        title: d.name,
        site: d.siteId ? 'Site spécifique' : 'Global',
        date: d.uploadDate,
        details: `Type: ${d.type}`,
        data: d
      })),
    ...prestataires
      .filter(p => p.status === 'En validation')
      .map(p => ({
        id: p.id,
        type: 'prestataire',
        title: p.name,
        site: `${p.sites.length} sites`,
        date: new Date().toISOString().split('T')[0],
        details: `Métier: ${p.metier}`,
        data: p
      })),
    ...budgetPPA
      .filter(b => b.status === 'Non démarré')
      .map(b => ({
        id: b.id,
        type: 'budget',
        title: b.object,
        site: b.siteName,
        date: b.year.toString(),
        amount: b.amount,
        details: `Durée: ${b.duration} an(s)`,
        data: b
      }))
  ];

  const filteredItems = pendingItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.site.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || item.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'intervention': return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'prestataire': return <Users className="w-5 h-5 text-green-600" />;
      case 'budget': return <DollarSign className="w-5 h-5 text-purple-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'intervention': return 'bg-orange-100 text-orange-800';
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'prestataire': return 'bg-green-100 text-green-800';
      case 'budget': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'intervention': return 'Intervention';
      case 'document': return 'Document';
      case 'prestataire': return 'Prestataire';
      case 'budget': return 'Budget PPA';
      default: return 'Autre';
    }
  };

  const handleValidate = (item: any) => {
    switch (item.type) {
      case 'intervention':
        const newLevel = item.data.validationLevel + 1;
        const isComplete = newLevel >= item.data.requiredValidators.length;
        updateIntervention(item.id, { 
          validationLevel: newLevel,
          status: isComplete ? 'En cours' : 'En attente'
        });
        break;
      case 'document':
        updateDocument(item.id, { status: 'Validé' });
        break;
      case 'prestataire':
        updatePrestataire(item.id, { status: 'Actif' });
        break;
      case 'budget':
        updateBudgetPPA(item.id, { status: 'En cours' });
        break;
    }
  };

  const handleReject = (item: any) => {
    switch (item.type) {
      case 'intervention':
        updateIntervention(item.id, { status: 'Rejetée', validationLevel: 0 });
        break;
      case 'document':
        updateDocument(item.id, { status: 'Rejeté' });
        break;
      case 'prestataire':
        updatePrestataire(item.id, { status: 'Suspendu' });
        break;
      case 'budget':
        updateBudgetPPA(item.id, { status: 'Annulé' });
        break;
    }
  };

  const validationStats = {
    total: pendingItems.length,
    interventions: pendingItems.filter(i => i.type === 'intervention').length,
    documents: pendingItems.filter(i => i.type === 'document').length,
    prestataires: pendingItems.filter(i => i.type === 'prestataire').length,
    budgets: pendingItems.filter(i => i.type === 'budget').length
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Wrench className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interventions</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.interventions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.documents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prestataires</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.prestataires}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budgets</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.budgets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre de Validation DT</h1>
          <p className="text-gray-600">{pendingItems.length} éléments en attente de validation</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un élément..."
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
            <option value="intervention">Interventions</option>
            <option value="document">Documents</option>
            <option value="prestataire">Prestataires</option>
            <option value="budget">Budgets PPA</option>
          </select>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des éléments à valider */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Éléments en attente de validation</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        En attente
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.details}</p>
                    
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>Site: {item.site}</span>
                      <span>Date: {new Date(item.date).toLocaleDateString('fr-FR')}</span>
                      {item.amount && (
                        <span>Montant: {item.amount.toLocaleString()}€</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleValidate(item)}
                    className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Valider
                  </button>
                  
                  {item.type !== 'intervention' && (
                    <button
                      onClick={() => handleReject(item)}
                      className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun élément en attente de validation</p>
            </div>
          )}
        </div>
      </div>

      {/* Informations sur les règles de validation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Règles de validation DT</h3>
        <div className="text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-2">
          <p><strong>Interventions</strong> → Validation selon montant et niveau requis</p>
          <p><strong>Documents</strong> → Validation de conformité et complétude</p>
          <p><strong>Prestataires</strong> → Vérification SIRET et compétences</p>
          <p><strong>Budgets PPA</strong> → Validation technique et financière</p>
        </div>
      </div>
    </div>
  );
}