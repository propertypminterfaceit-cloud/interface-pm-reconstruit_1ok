import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { HardHat, Filter, Search, Upload, FileText, CheckCircle, Clock, Eye, Plus, Wallet } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { getMandatForSite } from '../utils/permissions';
import { computeChantierFee } from '../utils/feeSchedule';

export default function Travaux() {
  const { interventions, sites, currentRole, currentUser, addDocument, updateIntervention, prestataires, addIntervention, users, feeSchedules, obligations } = useStore();
  
  // 🔒 VALIDATION DES DÉPENDANCES CRITIQUES
  if (!Array.isArray(interventions) || !Array.isArray(sites) || !currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du module Travaux...</p>
          <p className="text-xs text-gray-500 mt-2">Initialisation des données...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCreateTravauxForm, setShowCreateTravauxForm] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState('');

  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'devis' as 'devis' | 'cr' | 'doe' | 'pv',
    interventionId: '',
    amount: 0
  });

  const [newTravaux, setNewTravaux] = useState({
    siteId: '',
    category: 'curatif' as 'urgence' | 'curatif' | 'préventif',
    description: '',
    dateRequested: new Date().toISOString().split('T')[0],
    prestataire: '',
    amount: 0
  });

  // Filtrer les interventions selon le rôle
  const filteredInterventionsByRole = () => {
    // 🔒 PROTECTION CONTRE LES DONNÉES MANQUANTES
    const safeInterventions = Array.isArray(interventions) ? interventions : [];
    
    if (currentRole === 'Prestataire') {
      // Un prestataire ne voit que les interventions de SON entreprise
      // (liaison via prestataireId), sur les sites qui lui sont attribués.
      const mySites = new Set(currentUser?.sites || []);
      return safeInterventions.filter(intervention =>
        intervention &&
        intervention.prestataire === currentUser?.prestataireId &&
        mySites.has(intervention.siteId)
      );
    } else if (currentRole === 'PM' || currentRole === 'DT') {
      // Pour PM/DT : toutes les interventions
      return safeInterventions;
    }
    return [];
  };

  const roleInterventions = Array.isArray(filteredInterventionsByRole()) ? filteredInterventionsByRole() : [];

  // 🔒 PROTECTION SUPPLÉMENTAIRE POUR LE FILTRAGE
  const filteredInterventions = Array.isArray(roleInterventions) && 
    roleInterventions.filter(intervention => {
    if (!intervention) return false;
    
    const matchesSearch = (intervention.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (intervention.siteName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || intervention.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-orange-100 text-orange-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'Réalisée': return 'bg-green-100 text-green-800';
      case 'Clôturée': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'En cours': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Réalisée': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Clôturée': return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'devis': return 'Devis';
      case 'cr': return 'Compte-rendu';
      case 'doe': return 'DOE';
      case 'pv': return 'PV de réception';
      default: return 'Document';
    }
  };

  const getValidationRequirements = (amount: number, siteId?: string) => {
    // Les obligations actives issues du mandat (moteur d'obligations générique)
    // priment sur les seuils par défaut — c'est ce qui permet à chaque mandat
    // d'avoir ses propres règles de validation, sans code spécifique par client.
    const mandat = siteId ? getMandatForSite(siteId, users, sites) : undefined;
    const applicable = (obligations || []).filter(o =>
      o.status === 'Active' &&
      o.ruleType === 'SeuilValidation' &&
      o.targetModule === 'Travaux' &&
      (o.mandat ? o.mandat === mandat : (!o.siteId || o.siteId === siteId)) &&
      o.params.threshold !== undefined &&
      amount > o.params.threshold
    );

    if (applicable.length > 0) {
      const devis = Math.max(...applicable.map(o => o.params.devisRequired || 1));
      const validatorsSet = new Set<string>();
      applicable.forEach(o => (o.params.validatorsRequired || []).forEach(v => validatorsSet.add(v)));
      return {
        devis,
        validators: Array.from(validatorsSet),
        sourceLabels: applicable.map(o => o.sourceLabel)
      };
    }

    // Repli : seuils par défaut si aucune obligation de mandat ne s'applique à ce site
    if (amount < 10000) return { devis: 1, validators: ['PM', 'DT'], sourceLabels: [] };
    if (amount < 50000) return { devis: 2, validators: ['PM', 'DT', 'Propriétaire'], sourceLabels: [] };
    if (amount < 100000) return { devis: 3, validators: ['PM', 'DT', 'Propriétaire'], sourceLabels: [] };
    return { devis: 3, validators: ['PM', 'DT', 'Propriétaire', 'Directeur de Pôle'], sourceLabels: [] };
  };

  const handleValidateDocument = (documentId: string, amount: number) => {
    // Logique de validation selon le montant
    const requirements = getValidationRequirements(amount);
    // Ici on pourrait ajouter la logique de validation progressive
    console.log(`Validation document ${documentId} pour montant ${amount}€`, requirements);
  };

  const handleUploadDocument = () => {
    if (!newDocument.interventionId || !newDocument.name.trim()) return;
    
    // Générer automatiquement le nom du document
    const intervention = Array.isArray(roleInterventions) ? 
      roleInterventions.find(i => i && i.id === newDocument.interventionId) : null;
    const existingCRs = (Array.isArray(intervention?.documents) ? intervention.documents : [])
      .filter(d => typeof d === 'string')
      .filter(d => d.includes('cr') || d.includes('compte-rendu'));
    
    let documentName = '';
    if (newDocument.type === 'cr') {
      const crNumber = existingCRs.length + 1;
      documentName = `cr-${crNumber}-${Date.now()}.pdf`;
    } else {
      documentName = `${newDocument.type}-${Date.now()}.pdf`;
    }
    
    const document = {
      id: Date.now().toString(),
      name: `${getTypeLabel(newDocument.type)} - ${new Date().toLocaleDateString('fr-FR')}`,
      type: 'Interventions' as const,
      siteId: Array.isArray(roleInterventions) ? 
        roleInterventions.find(i => i && i.id === newDocument.interventionId)?.siteId : undefined,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'En attente' as const,
      size: '1.2 MB',
      url: `/documents/${documentName}`,
      interventionId: newDocument.interventionId,
      documentType: newDocument.type
    };

    addDocument(document);
    
    // Ajouter le document à l'intervention pour l'affichage immédiat
    if (intervention) {
      const updatedDocuments = [
        ...(Array.isArray(intervention.documents) ? intervention.documents : []),
        documentName
      ];
      updateIntervention(intervention.id, { documents: updatedDocuments });
    }
    
    setShowUploadForm(false);
    setSelectedIntervention('');
    setNewDocument({
      name: '',
      type: 'devis',
      interventionId: '',
      amount: 0
    });
  };

  const handleCreateTravaux = () => {
    const site = Array.isArray(sites) ? sites.find(s => s.id === newTravaux.siteId) : null;
    if (!site) return;

    const requirements = getValidationRequirements(newTravaux.amount, newTravaux.siteId);

    const intervention = {
      id: Date.now().toString(),
      siteId: newTravaux.siteId,
      siteName: site.name,
      category: newTravaux.category,
      description: newTravaux.description,
      dateRequested: newTravaux.dateRequested,
      amount: newTravaux.amount,
      prestataire: newTravaux.prestataire,
      status: 'En attente' as const,
      validationLevel: 0,
      requiredValidators: requirements.validators,
      documents: [],
      photos: []
    };

    addIntervention(intervention);
    setShowCreateTravauxForm(false);
    setNewTravaux({
      siteId: '',
      category: 'curatif',
      description: '',
      dateRequested: new Date().toISOString().split('T')[0],
      prestataire: '',
      amount: 0
    });
  };

  const travauxStats = {
    total: Array.isArray(roleInterventions) ? roleInterventions.length : 0,
    enAttente: Array.isArray(roleInterventions) ? roleInterventions.filter(i => i && i.status === 'En attente').length : 0,
    enCours: Array.isArray(roleInterventions) ? roleInterventions.filter(i => i && i.status === 'En cours').length : 0,
    realisees: Array.isArray(roleInterventions) ? roleInterventions.filter(i => i && i.status === 'Réalisée').length : 0,
    cloturees: Array.isArray(roleInterventions) ? roleInterventions.filter(i => i && i.status === 'Clôturée').length : 0
  };

  if (currentRole !== 'Prestataire' && currentRole !== 'PM' && currentRole !== 'DT') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <HardHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Ce module est réservé aux PM, DT et Prestataires.</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (currentRole === 'Prestataire') return 'Mes Travaux';
    return 'Suivi des Travaux';
  };

  const getPageDescription = () => {
    const count = Array.isArray(roleInterventions) ? roleInterventions.length : 0;
    if (currentRole === 'Prestataire') return `${count} demandes assignées`;
    return `${count} interventions au total`;
  };

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <HardHat className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Module Travaux indisponible</h2>
          <p className="text-gray-600 text-sm mb-4">
            Le module Travaux ne peut pas être chargé dans cet onglet.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    }>
    <div className="space-y-8">
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card-unified p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="title-section">{getPageTitle()}</h1>
            <p className="subtitle-section">{getPageDescription()}</p>
          </div>
          
          {currentRole === 'Prestataire' && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn-primary flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter un document
            </button>
          )}
          
          {(currentRole === 'PM' || currentRole === 'DT') && (
            <button
              onClick={() => setShowCreateTravauxForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une ligne de travaux
            </button>
          )}
        </div>
      </div>

      {/* Synthèse des honoraires PM — le chiffre à présenter à la direction */}
      {(currentRole === 'PM' || currentRole === 'DT') && (() => {
        const currentYear = new Date().getFullYear();
        const eligible = (interventions || []).filter(i =>
          i.amount && (i.status === 'Réalisée' || i.status === 'Clôturée') &&
          new Date(i.dateRequested).getFullYear() === currentYear
        );
        let totalFees = 0;
        let totalNegotiated = 0;
        eligible.forEach(i => {
          const mandat = getMandatForSite(i.siteId, users, sites);
          const schedule = (feeSchedules || []).find(s => s.mandat === mandat);
          if (schedule && i.amount) {
            const { feeAmount, negotiatedAboveAmount } = computeChantierFee(i.amount, schedule);
            totalFees += feeAmount;
            totalNegotiated += negotiatedAboveAmount || 0;
          }
        });
        if (eligible.length === 0) return null;
        return (
          <div className="card-unified p-4 border-l-4 border-green-500 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <Wallet className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-green-900">Honoraires PM générés en {currentYear}</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}€ calculés sur {eligible.length} chantier{eligible.length > 1 ? 's' : ''} réalisé{eligible.length > 1 ? 's' : ''}
                    {totalNegotiated > 0 && ` (+ ${totalNegotiated.toLocaleString()}€ à négocier de gré à gré au-delà des barèmes)`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <HardHat className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-gray-900">{travauxStats.total}</p>
            </div>
          </div>
        </div>

        {(currentRole === 'PM' || currentRole === 'DT') && (
          <div className="card-unified card-hover p-4">
            <div className="flex items-center">
              <div className="bg-orange-50 p-2 rounded-lg mr-3">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</p>
                <p className="text-xl font-bold text-gray-900">{travauxStats.enAttente}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">En cours</p>
              <p className="text-xl font-bold text-gray-900">{travauxStats.enCours}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Réalisées</p>
              <p className="text-xl font-bold text-gray-900">{travauxStats.realisees}</p>
            </div>
          </div>
        </div>

        <div className="card-unified card-hover p-4">
          <div className="flex items-center">
            <div className="bg-gray-50 p-2 rounded-lg mr-3">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clôturées</p>
              <p className="text-xl font-bold text-gray-900">{travauxStats.cloturees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card-unified p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une demande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Tous les statuts</option>
            {(currentRole === 'PM' || currentRole === 'DT') && (
              <option value="En attente">En attente</option>
            )}
            <option value="En cours">En cours</option>
            <option value="Réalisée">Réalisée</option>
            <option value="Clôturée">Clôturée</option>
          </select>
          
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="card-unified">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="title-section">
            {currentRole === 'Prestataire' ? 'Demandes d\'intervention' : 'Interventions et Travaux'}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date demandée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                {(currentRole === 'PM' || currentRole === 'DT') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Honoraires PM
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avancement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                {currentRole === 'Prestataire' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(filteredInterventions) && 
                filteredInterventions.map((intervention) => (
                <tr key={intervention.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(intervention.status)}
                      <span className={`ml-2 status-badge ${getStatusColor(intervention.status)}`}>
                        {intervention.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{intervention.siteName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{intervention.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="status-badge status-orange">
                      {intervention.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(intervention.dateRequested).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {(intervention && intervention.amount) ? intervention.amount.toLocaleString() : '—'}€
                    </div>
                  </td>
                  {(currentRole === 'PM' || currentRole === 'DT') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        if (!intervention?.amount) return <span className="text-gray-400 text-sm">—</span>;
                        const mandat = getMandatForSite(intervention.siteId, users, sites);
                        const schedule = (feeSchedules || []).find(s => s.mandat === mandat);
                        if (!schedule) return <span className="text-gray-400 text-xs">Barème non défini ({mandat || 'mandat inconnu'})</span>;
                        const { feeAmount, negotiatedAboveAmount } = computeChantierFee(intervention.amount, schedule);
                        return (
                          <div>
                            <div className="text-sm font-medium text-green-700">{feeAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}€</div>
                            {negotiatedAboveAmount && (
                              <div className="text-xs text-amber-600">+ {negotiatedAboveAmount.toLocaleString()}€ de gré à gré</div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        if (!intervention || !intervention.prestataire) {
                          return <span className="text-gray-400">— Aucun prestataire</span>;
                        }
                        const prestataire = Array.isArray(prestataires) ? 
                          prestataires.find(p => p && p.id === intervention.prestataire) : null;
                        return prestataire ? prestataire.name : 
                          <span className="text-red-400">Prestataire introuvable</span>;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              intervention.status === 'Clôturée' ? 'bg-green-500' :
                              intervention.status === 'Réalisée' ? 'bg-blue-500' :
                              intervention.status === 'En cours' ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}
                            style={{ 
                              width: intervention.status === 'Clôturée' ? '100%' :
                                     intervention.status === 'Réalisée' ? '75%' :
                                     intervention.status === 'En cours' ? '50%' :
                                     '25%'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {intervention && intervention.validationLevel ? intervention.validationLevel : 0}/
                        {intervention && Array.isArray(intervention.requiredValidators) ? intervention.requiredValidators.length : 0} validations
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {/* Devis */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 text-gray-600">Devis:</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          (intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('devis'))) ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {(intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('devis'))) ? '✓' : '○'}
                        </span>
                      </div>
                      
                      {/* Compte-rendu */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 text-gray-600">CR:</span>
                        <div className="flex items-center space-x-1">
                          {(() => {
                            if (!intervention || !Array.isArray(intervention.documents)) {
                              return <span className="px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-500">○</span>;
                            }
                            const crDocs = intervention.documents
                              .filter(d => typeof d === 'string')
                              .filter(d => d.includes('cr') || d.includes('compte-rendu'));
                            if (!Array.isArray(crDocs) || crDocs.length === 0) {
                              return <span className="px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-500">○</span>;
                            }
                            return crDocs.map((_, index) => (
                              <span key={index} className="px-1 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                {index + 1}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      {/* DOE */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 text-gray-600">DOE:</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          (intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('doe'))) ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {(intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('doe'))) ? '✓' : '○'}
                        </span>
                      </div>
                      
                      {/* PV */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 text-gray-600">PV:</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          (intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('pv'))) ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {(intervention && Array.isArray(intervention.documents) && intervention.documents.filter(d => typeof d === 'string').some(d => d.includes('pv'))) ? '✓' : '○'}
                        </span>
                      </div>
                    </div>
                  </td>
                  {currentRole === 'Prestataire' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setNewDocument(prev => ({ ...prev, interventionId: intervention.id }));
                          setSelectedIntervention(intervention ? intervention.id : '');
                          setShowUploadForm(true);
                        }}
                        className="btn-primary text-sm"
                      >
                        Ajouter document
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'upload de document */}
      {showUploadForm && currentRole === 'Prestataire' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un document</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intervention</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {newDocument.interventionId ? (
                    <div className="text-sm text-gray-900">
                      {(() => {
                        const intervention = Array.isArray(roleInterventions) ? 
                          roleInterventions.find(i => i && i.id === newDocument.interventionId) : null;
                        return intervention ? 
                          `${intervention.siteName || 'Site inconnu'} - ${(intervention.description || '').substring(0, 50)}...` : 
                          'Intervention non trouvée';
                      })()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Aucune intervention sélectionnée</div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'intervention est pré-sélectionnée depuis la ligne du tableau
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de document</label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="devis">Devis</option>
                  <option value="cr">Compte-rendu</option>
                  <option value="doe">DOE (Dossier des Ouvrages Exécutés)</option>
                  <option value="pv">PV de réception</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Ce document sera associé à l'intervention sélectionnée et soumis pour validation par le PM/DT.
                </p>
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
                disabled={!newDocument.interventionId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Uploader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de ligne de travaux */}
      {showCreateTravauxForm && (currentRole === 'PM' || currentRole === 'DT') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Créer une nouvelle ligne de travaux</h2>
              <button
                onClick={() => setShowCreateTravauxForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                <select
                  value={newTravaux.siteId}
                  onChange={(e) => setNewTravaux(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un site</option>
                  {Array.isArray(sites) && sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={newTravaux.category}
                  onChange={(e) => setNewTravaux(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="urgence">Urgence</option>
                  <option value="curatif">Curatif</option>
                  <option value="préventif">Préventif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description des travaux</label>
                <textarea
                  value={newTravaux.description}
                  onChange={(e) => setNewTravaux(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez les travaux à réaliser..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date souhaitée</label>
                  <input
                    type="date"
                    value={newTravaux.dateRequested}
                    onChange={(e) => setNewTravaux(prev => ({ ...prev, dateRequested: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant estimé (€)</label>
                  <input
                    type="number"
                    value={newTravaux.amount}
                    onChange={(e) => setNewTravaux(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prestataire suggéré</label>
                <select
                  value={newTravaux.prestataire}
                  onChange={(e) => setNewTravaux(prev => ({ ...prev, prestataire: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un prestataire</option>
                  {Array.isArray(prestataires) && prestataires.map(prestataire => (
                    <option key={prestataire.id} value={prestataire.id}>{prestataire.name}</option>
                  ))}
                </select>
              </div>

              {newTravaux.amount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Validation requise</h4>
                  <div className="text-sm text-blue-800">
                    {(() => {
                      const requirements = getValidationRequirements(newTravaux.amount, newTravaux.siteId);
                      return (
                        <div>
                          <p><strong>Nombre de devis requis:</strong> {requirements.devis}</p>
                          <p><strong>Validateurs:</strong> {requirements.validators.join(', ')}</p>
                          {requirements.sourceLabels && requirements.sourceLabels.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">Règle appliquée : {requirements.sourceLabels.join(', ')}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTravauxForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTravaux}
                disabled={!newTravaux.siteId || !newTravaux.description.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer la ligne de travaux
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </ErrorBoundary>
  );
}