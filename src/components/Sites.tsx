import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MapPin, Plus, Filter, Search, Building, Calendar, User, Star, Eye } from 'lucide-react';
import { Site } from '../types';
import { filterSitesByUser } from '../utils/permissions';

export default function Sites() {
  const { sites, users, prestataires, addSite, currentRole, currentUser } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSiteDetails, setShowSiteDetails] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypologie, setFilterTypologie] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    typologie: [] as string[],
    surface: 0,
    year: new Date().getFullYear(),
    energyClass: '',
    heatingType: '',
    coolingType: '',
    customHeatingType: '',
    customCoolingType: '',
    floors: 0,
    basements: 0,
    heatingPower: 0,
    coolingPower: 0,
    pmResponsible: '',
    dtResponsible: '',
    prestataire: '',
    equipments: [] as string[]
  });

  const equipmentsList = [
    'ascenseur', 'SSI', 'CTA', 'désenfumage', 'climatisation', 'GTB', 
    'chaufferie', 'groupe électrogène', 'équipements sous pression', 
    'parkings ventilés', 'panneaux photovoltaïques', 'installations au gaz', 
    'tours aéro-réfrigérantes'
  ];

  const typologies = ['IGH', 'ERP', 'TERTIAIRE', 'LOGISTIQUE', 'HOTEL'];

  // Ne partir que des sites réellement attribués à la personne connectée
  // (DT = tout le patrimoine ; PM/Propriétaire = uniquement leurs actifs).
  const visibleSites = filterSitesByUser(currentUser, currentRole, sites);

  const filteredSites = visibleSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTypologie = !filterTypologie || site.typologie.includes(filterTypologie as any);
    const matchesStatus = !filterStatus || site.status === filterStatus;
    
    return matchesSearch && matchesTypologie && matchesStatus;
  });

  const handleCreateSite = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const site: Site = {
      id: Date.now().toString(),
      ...newSite,
      conformityScore: Math.floor(Math.random() * 20) + 80,
      status: 'Actif' as const
    };

    addSite(site);
    setShowCreateForm(false);
    setCurrentStep(1);
    setNewSite({
      name: '',
      address: '',
      typologie: [],
      surface: 0,
      year: new Date().getFullYear(),
      energyClass: '',
      heatingType: '',
      coolingType: '',
      customHeatingType: '',
      customCoolingType: '',
      floors: 0,
      basements: 0,
      heatingPower: 0,
      coolingPower: 0,
      pmResponsible: '',
      dtResponsible: '',
      prestataire: '',
      equipments: []
    });
  };

  const handleEquipmentChange = (equipment: string) => {
    setNewSite(prev => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter(e => e !== equipment)
        : [...prev.equipments, equipment]
    }));
  };

  const handleTypologieChange = (typologie: string) => {
    setNewSite(prev => ({
      ...prev,
      typologie: prev.typologie.includes(typologie)
        ? prev.typologie.filter(t => t !== typologie)
        : [...prev.typologie, typologie]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-800';
      case 'Inactif': return 'bg-red-100 text-red-800';
      case 'En maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConformityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const generateAutomaticControls = (equipments: string[], typologie: string[], surface: number) => {
    const controls = [];
    
    if (equipments.includes('ascenseur')) {
      controls.push('Contrôle semestriel ascenseur');
    }
    if (equipments.includes('SSI')) {
      controls.push('Maintenance trimestrielle SSI', 'Vérification annuelle SSI');
    }
    if (equipments.includes('CTA')) {
      controls.push('Entretien semestriel CTA');
    }
    if (equipments.includes('climatisation')) {
      controls.push('Contrôle d\'étanchéité annuel climatisation');
    }
    if (equipments.includes('chaufferie')) {
      controls.push('Contrôle chaufferie + attestation bureau de contrôle');
    }
    if (equipments.includes('désenfumage')) {
      controls.push('Vérification annuelle désenfumage');
    }
    if (equipments.includes('GTB') && typologie.includes('TERTIAIRE') && surface > 1000) {
      controls.push('Diagnostic GTB quinquennal');
    }
    if (equipments.includes('groupe électrogène')) {
      controls.push('Maintenance annuelle groupe électrogène');
    }
    if (equipments.includes('parkings ventilés')) {
      controls.push('Contrôle ventilation + détecteurs CO');
    }
    if (equipments.includes('panneaux photovoltaïques')) {
      controls.push('Contrôle électrique annuel photovoltaïque');
    }
    if (equipments.includes('installations au gaz')) {
      controls.push('Contrôle Qualigaz annuel');
    }
    if (typologie.includes('ERP')) {
      controls.push('Commission sécurité ERP');
    }
    if (typologie.includes('IGH')) {
      controls.push('Vérifications spécifiques sécurité incendie IGH');
    }
    
    return controls;
  };

  const handleViewSite = (site: Site) => {
    setSelectedSite(site);
    setShowSiteDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card-unified p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="title-section">Sites</h1>
            <p className="subtitle-section">{visibleSites.length} sites dans votre portefeuille</p>
          </div>
          
          {(currentRole === 'PM' || currentRole === 'DT') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un site
            </button>
          )}
        </div>
      </div>

      {/* Header avec filtres */}
      {/* Filtres */}
      <div className="card-unified p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            value={filterTypologie}
            onChange={(e) => setFilterTypologie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Toutes les typologies</option>
            {typologies.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            {currentRole === 'DT' && (
              <option value="En maintenance">En maintenance</option>
            )}
          </select>
          
          <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Filter className="w-4 h-4 mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Liste des sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSites.map((site) => (
          <div key={site.id} className="card-unified card-hover p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-1.5 rounded-lg mr-2">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{site.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{site.address}</p>
                </div>
              </div>
              <span className={`status-badge ${getStatusColor(site.status)}`}>
                {site.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Typologie:</span>
                <div className="flex flex-wrap gap-1">
                  {site.typologie.map(type => (
                    <span key={type} className="status-badge status-blue">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Surface:</span>
                <span className="text-sm font-medium text-gray-900">{site.surface.toLocaleString()} m²</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Année:</span>
                <span className="text-sm font-medium text-gray-900">{site.year}</span>
              </div>

              {site.energyClass && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Classe énergétique:</span>
                  <span className="text-sm font-medium text-gray-900">{site.energyClass}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Score conformité:</span>
                <div className="flex items-center">
                  <Star className={`w-4 h-4 mr-1 ${getConformityColor(site.conformityScore)}`} />
                  <span className={`text-sm font-medium ${getConformityColor(site.conformityScore)}`}>
                    {site.conformityScore || '—'}%
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>PM: {users.find(u => u.id === site.pmResponsible)?.name}</div>
                    <div>DT: {users.find(u => u.id === site.dtResponsible)?.name}</div>
                  </div>
                  <button
                    onClick={() => handleViewSite(site)}
                    className="btn-primary flex items-center text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Voir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Créer un nouveau site - Étape {currentStep}/4
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCurrentStep(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Étape 1: Informations générales */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du site</label>
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Tour Montparnasse"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={newSite.address}
                    onChange={(e) => setNewSite(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Adresse complète"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Typologie</label>
                  <div className="grid grid-cols-2 gap-2">
                    {typologies.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newSite.typologie.includes(type)}
                          onChange={() => handleTypologieChange(type)}
                          className="mr-2"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surface (m²)</label>
                    <input
                      type="number"
                      value={newSite.surface}
                      onChange={(e) => setNewSite(prev => ({ ...prev, surface: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                    <input
                      type="number"
                      value={newSite.year}
                      onChange={(e) => setNewSite(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classement énergétique (facultatif)</label>
                  <select
                    value={newSite.energyClass}
                    onChange={(e) => setNewSite(prev => ({ ...prev, energyClass: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de chauffage</label>
                  <select
                    value={newSite.heatingType}
                    onChange={(e) => setNewSite(prev => ({ ...prev, heatingType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Gaz">Gaz</option>
                    <option value="Électrique">Électrique</option>
                    <option value="Fioul">Fioul</option>
                    <option value="Pompe à chaleur">Pompe à chaleur</option>
                    <option value="Réseau de chaleur">Réseau de chaleur</option>
                    <option value="Biomasse">Biomasse</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {newSite.heatingType === 'Autre' && (
                    <input
                      type="text"
                      value={newSite.customHeatingType || ''}
                      onChange={(e) => setNewSite(prev => ({ ...prev, customHeatingType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="Précisez le type de chauffage"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de rafraîchissement</label>
                  <select
                    value={newSite.coolingType}
                    onChange={(e) => setNewSite(prev => ({ ...prev, coolingType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Climatisation">Climatisation</option>
                    <option value="Pompe à chaleur réversible">Pompe à chaleur réversible</option>
                    <option value="Free cooling">Free cooling</option>
                    <option value="Réseau de froid">Réseau de froid</option>
                    <option value="Aucun">Aucun</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {newSite.coolingType === 'Autre' && (
                    <input
                      type="text"
                      value={newSite.customCoolingType || ''}
                      onChange={(e) => setNewSite(prev => ({ ...prev, customCoolingType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="Précisez le type de rafraîchissement"
                    />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'étages</label>
                    <input
                      type="number"
                      value={newSite.floors}
                      onChange={(e) => setNewSite(prev => ({ ...prev, floors: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sous-sols</label>
                    <input
                      type="number"
                      value={newSite.basements}
                      onChange={(e) => setNewSite(prev => ({ ...prev, basements: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Puissance chauffage (kW)</label>
                    <input
                      type="number"
                      value={newSite.heatingPower}
                      onChange={(e) => setNewSite(prev => ({ ...prev, heatingPower: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Puissance froid (kW)</label>
                    <input
                      type="number"
                      value={newSite.coolingPower}
                      onChange={(e) => setNewSite(prev => ({ ...prev, coolingPower: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape 2: Responsables */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsable PM</label>
                  <select
                    value={newSite.pmResponsible}
                    onChange={(e) => setNewSite(prev => ({ ...prev, pmResponsible: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un PM</option>
                    {(users || []).filter(u => u.role === 'PM').map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsable DT</label>
                  <select
                    value={newSite.dtResponsible}
                    onChange={(e) => setNewSite(prev => ({ ...prev, dtResponsible: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un DT</option>
                    {(users || []).filter(u => u.role === 'DT').map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prestataire référent</label>
                  <select
                    value={newSite.prestataire}
                    onChange={(e) => setNewSite(prev => ({ ...prev, prestataire: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un prestataire</option>
                    {(prestataires || []).map(prestataire => (
                      <option key={prestataire.id} value={prestataire.id}>{prestataire.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Étape 3: Équipements */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Équipements présents</label>
                  <div className="grid grid-cols-2 gap-3">
                    {equipmentsList.map(equipment => (
                      <label key={equipment} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newSite.equipments.includes(equipment)}
                          onChange={() => handleEquipmentChange(equipment)}
                          className="mr-2"
                        />
                        <span className="text-sm">{equipment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Étape 4: Récapitulatif */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Récapitulatif</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Nom:</strong> {newSite.name}</p>
                  <p><strong>Adresse:</strong> {newSite.address}</p>
                  <p><strong>Typologie:</strong> {newSite.typologie.join(', ')}</p>
                  <p><strong>Surface:</strong> {newSite.surface.toLocaleString()} m²</p>
                  <p><strong>Année:</strong> {newSite.year}</p>
                  {newSite.energyClass && <p><strong>Classe énergétique:</strong> {newSite.energyClass}</p>}
                  {newSite.heatingType && <p><strong>Chauffage:</strong> {newSite.heatingType === 'Autre' ? newSite.customHeatingType : newSite.heatingType} ({newSite.heatingPower} kW)</p>}
                  {newSite.coolingType && <p><strong>Rafraîchissement:</strong> {newSite.coolingType === 'Autre' ? newSite.customCoolingType : newSite.coolingType} ({newSite.coolingPower} kW)</p>}
                  <p><strong>Étages:</strong> {newSite.floors} | <strong>Sous-sols:</strong> {newSite.basements}</p>
                  <p><strong>Équipements:</strong> {newSite.equipments.join(', ')}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Contrôles réglementaires générés automatiquement:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {generateAutomaticControls(newSite.equipments, newSite.typologie, newSite.surface).map((control, index) => (
                      <li key={index}>• {control}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <button
                onClick={handleCreateSite}
                className="btn-primary"
              >
                {currentStep === 4 ? 'Créer le site' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du site */}
      {showSiteDetails && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails du site - {selectedSite.name}</h2>
              <button
                onClick={() => setShowSiteDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Nom:</strong> {selectedSite.name}</p>
                  <p><strong>Adresse:</strong> {selectedSite.address}</p>
                  <p><strong>Surface:</strong> {selectedSite.surface.toLocaleString()} m²</p>
                  <p><strong>Année:</strong> {selectedSite.year}</p>
                  {selectedSite.energyClass && <p><strong>Classe énergétique:</strong> {selectedSite.energyClass}</p>}
                  <p><strong>Score conformité:</strong> {selectedSite.conformityScore}%</p>
                  <p><strong>Statut:</strong> {selectedSite.status}</p>
                </div>
              </div>

              {/* Typologie */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Typologie</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {selectedSite.typologie.map(type => (
                      <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Équipements */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Équipements présents</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedSite.equipments.map(equipment => (
                      <div key={equipment} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm">{equipment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Responsables */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">Responsables</h3>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Property Manager</p>
                    <p className="text-sm text-gray-900">{users.find(u => u.id === selectedSite.pmResponsible)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Directeur Technique</p>
                    <p className="text-sm text-gray-900">{users.find(u => u.id === selectedSite.dtResponsible)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Prestataire référent</p>
                    <p className="text-sm text-gray-900">{prestataires.find(p => p.id === selectedSite.prestataire)?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSiteDetails(false)}
                className="btn-primary bg-gray-600 hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}