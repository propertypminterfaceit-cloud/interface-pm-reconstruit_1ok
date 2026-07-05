export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'PM' | 'DT' | 'Prestataire' | 'Propriétaire' | 'Gestionnaire technique' | 'Gestionnaire locatif' | 'Assistant(e) administratif' | 'Responsable' | 'Directeur de site' | 'Building manager' | string;
  sites: string[];
  averageRating?: number;
  mandat?: string; // ex: "PIMCO", "Allianz" — distingue plusieurs Asset Managers rattachés au même rôle
}

export interface Site {
  id: string;
  name: string;
  address: string;
  typologie: ('IGH' | 'ERP' | 'TERTIAIRE' | 'LOGISTIQUE' | 'HOTEL')[];
  surface: number;
  year: number;
  energyClass?: string;
  heatingType?: string;
  coolingType?: string;
  customHeatingType?: string;
  customCoolingType?: string;
  floors?: number;
  basements?: number;
  heatingPower?: number;
  coolingPower?: number;
  pmResponsible: string;
  dtResponsible: string;
  prestataire: string;
  equipments: string[];
  conformityScore: number;
  status: 'Actif' | 'Inactif' | 'En maintenance';
}

export interface Intervention {
  id: string;
  siteId: string;
  siteName: string;
  category: 'urgence' | 'curatif' | 'préventif';
  description: string;
  dateRequested: string;
  amount?: number;
  prestataire?: string;
  status: 'En attente' | 'En cours' | 'Réalisée' | 'Clôturée' | 'Rejetée';
  validationLevel: number;
  requiredValidators: string[];
  documents: string[];
  photos: string[];
  comments?: string[];
}

export interface Conformity {
  id: string;
  siteId: string;
  siteName: string;
  obligation: string;
  equipment: string;
  dueDate: string;
  prestataire: string;
  document?: string;
  status: 'OK' | 'À échéance' | 'Retard';
  alertSent: boolean;
}

export interface Prestataire {
  id: string;
  name: string;
  siret: string;
  metier: string;
  status: 'Actif' | 'Suspendu' | 'En validation';
  sites: string[];
  contacts: { [siteId: string]: { name: string; email: string; phone: string } };
  rating: number;
  interventionsCount: number;
  conformityRate: number;
  averageDelay: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'RMA' | 'RME' | 'Contrats' | 'Interventions' | 'Sinistres' | 'Conformité' | 'PPA' | 'ESG' | 'Autres';
  siteId?: string;
  uploadDate: string;
  status: 'Validé' | 'En attente' | 'Rejeté';
  size: string;
  url: string;
  archivedYear?: number; // renseigné lors d'un archivage annuel (snapshot figé)
}

export interface BudgetPPA {
  id: string;
  siteId: string;
  siteName: string;
  year: number;
  duration: number;
  amount: number;
  object: string;
  status: 'Non démarré' | 'En cours' | 'Terminé' | 'Réceptionné' | 'Annulé';
  devis?: string;
  pvSigned: boolean;
  signatureDate?: string;
  // Workflow de validation par le Propriétaire (Asset Manager) — distinct du
  // statut d'avancement opérationnel ci-dessus.
  createdByName?: string;
  createdByRole?: string;
  createdAt?: string;
  validationStatus?: 'En attente' | 'Validé' | 'Refusé';
  validatedByName?: string;
  validatedAt?: string;
  validationComment?: string;
}

export interface Sinistre {
  id: string;
  siteId: string;
  siteName: string;
  type: string;
  date: string;
  time?: string;
  location?: string;
  description: string;
  status: 'Déclaré' | 'Expertise' | 'Accepté' | 'Refusé' | 'Clôturé';
  photos: string[];
  interventionGenerated: boolean;
}

export interface ESGData {
  id: string;
  siteId: string;
  siteName: string;
  month: string;
  energy: number;
  water: number;
  waste: number;
  co2: number;
  objectives: {
    energy: number;
    water: number;
    waste: number;
    co2: number;
  };
}

export interface Alert {
  id: string;
  type: 'conformité' | 'budget' | 'document' | 'sinistre' | 'intervention';
  severity: 'low' | 'medium' | 'high';
  message: string;
  siteId?: string;
  siteName?: string;
  date: string;
  read: boolean;
}

export interface Connection {
  id: string;
  name: string;
  url: string;
  type: 'unidirectionnelle' | 'bidirectionnelle';
  status: 'Actif' | 'Inactif' | 'Erreur';
  lastSync: string;
  modules: string[];
  sites: string[];
  description: string;
  errors: string[];
}

export interface Message {
  id: string;
  siteId: string;
  from: string;
  to: string;
  fromId?: string;
  toId?: string;
  message: string;
  date: string;
  read: boolean;
}

export interface EnergyConnector {
  id: string;
  provider: 'Schneider EcoStruxure Building Operation' | 'Ubigreen Energy' | 'Advizeo' | 'Deltaconso Expert' | 'API générique';
  siteId: string;
  siteName: string;
  status: 'Connecté' | 'Déconnecté' | 'Connexion en cours' | 'Erreur';
  connectionId?: string;
  apiEndpoint?: string;
  lastSync: string;
}

export interface EnergyReading {
  id: string;
  siteId: string;
  siteName: string;
  month: string;
  electricityKwh: number;
  gasKwh: number;
  waterM3: number;
  cost: number;
  co2Kg: number;
  peakPowerKw: number;
  source: string;
}

export interface BPUItem {
  id: string;
  siteId: string;
  metier: string;
  lot: string;
  poste: string;
  unite: string;
  prixUnitaireHT: number;
}

export interface DemandePrestation {
  id: string;
  siteId: string;
  siteName: string;
  localisation: string;
  typePrestation: 'Propreté' | 'Sécurité' | 'Maintenance' | 'Travaux' | 'Espaces verts' | 'Autres';
  modalite: 'BPU' | 'DEVIS' | 'CONTRAT';
  description: string;
  dateCreation: string;
  createdBy: string;
  status: 'Brouillon' | 'Transmise' | 'En attente de devis' | 'Chiffrage reçu' | 'Refusée' | 'Acceptée' | 'Programmée' | 'Clôturée';
  
  // Données BPU/DEVIS
  lignes?: {
    id: string;
    poste: string;
    quantite: number;
    unite: string;
    prixUnitaireHT?: number;
    montantHT?: number;
  }[];
  
  // Prestataires concernés
  prestataires?: string[];
  prestataireAssigne?: string;
  
  // Documents et devis
  documents?: string[];
  devis?: {
    prestataireId: string;
    fichier: string;
    montant: number;
    dateIntervention?: string;
  }[];
  
  // Validation
  montantTotal?: number;
  validationLevel?: number;
  requiredValidators?: string[];
  
  // Dates
  dateIntervention?: string;
  dateValidation?: string;
  
  // Historique
  historique?: {
    date: string;
    action: string;
    utilisateur: string;
    commentaire?: string;
  }[];
}