export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'PM' | 'DT' | 'Prestataire' | 'Propriétaire' | 'Gestionnaire technique' | 'Gestionnaire locatif' | 'Assistant(e) administratif' | 'Responsable' | 'Directeur de site' | 'Building manager' | string;
  sites: string[];
  averageRating?: number;
  mandat?: string; // ex: "PIMCO", "Allianz" — distingue plusieurs Asset Managers rattachés au même rôle
  prestataireId?: string; // pour un compte de rôle Prestataire : l'entreprise (Prestataire métier) qu'il représente
}

export interface Site {
  id: string;
  name: string;
  address: string;
  typologie: ('IGH' | 'ERP' | 'TERTIAIRE' | 'LOGISTIQUE' | 'HOTEL')[];
  surface: number;
  year: number;
  mandat?: string; // ex: "PIMCO", "Allianz" — portefeuille/mandat auquel le site appartient
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
  // Statut de traitement donné par le prestataire lui-même — remonte
  // directement sur le tableau du PM, distinct du workflow de validation.
  prestataireStatus?: 'Non traité' | 'Vu / pris en compte' | 'Devis en cours' | 'En attente sous-traitant' | 'Planifié' | 'Traité';
  prestataireStatusNote?: string;
  prestataireStatusUpdatedAt?: string;
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
  contractEndDate?: string; // échéance du contrat, pour le suivi de renouvellement
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
  createdByName?: string;
  createdByRole?: string;
  validatedByName?: string;
  validatedAt?: string;
  validationComment?: string;
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
  validatedByName?: string;
  validatedAt?: string;
  validationComment?: string;
}

export interface AuditEntry {
  id: string;
  entityType: 'BudgetPPA' | 'Document' | 'Sinistre' | 'Connexion' | 'Obligation' | 'Intervention';
  entityId: string;
  entityLabel: string; // description lisible (ex: "Rénovation CTA - Tour Montparnasse")
  action: string; // ex: "Validé", "Refusé", "Désactivé"
  performedByName: string;
  performedByRole: string;
  timestamp: string;
  comment?: string;
}

/**
 * Moteur d'obligations générique — une obligation peut provenir du mandat,
 * d'une certification, de l'ESG, du Smart Building, ou d'une exigence interne.
 * C'est la même structure quelle que soit la source : on évite ainsi d'avoir
 * un système parallèle par type d'exigence.
 */
export interface Obligation {
  id: string;
  source: 'Mandat' | 'Certification' | 'ESG' | 'SmartBuilding' | 'Interne';
  sourceLabel: string; // ex: "Mandat PIMCO", "Certification BREEAM"
  siteId?: string;
  mandat?: string;
  clauseReference?: string; // traçabilité vers la clause source (ex: "Article 12.3")
  title: string; // ex: "3 devis obligatoires au-delà de 10 000€"
  targetModule: 'Travaux' | 'Conformite' | 'Documents' | 'ESG' | 'BudgetPPA' | 'Prestataires' | 'Energie';
  ruleType: 'SeuilValidation' | 'Frequence' | 'ObligationDocumentaire' | 'KPI' | 'ConsigneTemperature' | 'Autre';
  params: {
    threshold?: number;
    devisRequired?: number;
    validatorsRequired?: string[];
    frequencyDays?: number;
    documentType?: string;
    temperatureMin?: number;
    temperatureMax?: number;
  };
  status: 'Extraite (IA)' | 'En attente de validation' | 'Active' | 'Rejetée';
  createdByName?: string;
  createdAt?: string;
  validatedByName?: string;
  validatedAt?: string;
  validationComment?: string;
  // Avancement opérationnel — distinct du statut de gouvernance ci-dessus :
  // "Active" veut dire que la règle s'applique, "avancement" veut dire que le
  // travail demandé pour l'occurrence en cours a été fait ou non.
  avancement?: 'À faire' | 'En cours' | 'Fait';
  avancementUpdatedByName?: string;
  avancementUpdatedAt?: string;
  documentIdPreuve?: string; // référence vers un Document existant, servant de preuve jointe
  esgSubjectId?: string; // rattache l'obligation à un sujet précis du catalogue ESG
}

/** Niveau d'un bâtiment (RDC, R+1...) — nécessaire pour des données comme les
 * consignes de température, qui varient d'un niveau à l'autre sur un même site. */
export interface Niveau {
  id: string;
  siteId: string;
  label: string;
  order: number;
}

/** Consigne de température remontée par un connecteur (ex: Dnergy), par niveau. */
export interface ConsigneTemperature {
  id: string;
  niveauId: string;
  siteId: string;
  consigne: number;
  source: string;
  lastSync: string;
}

export interface Certification {
  id: string;
  siteId: string;
  siteName: string;
  type: 'HQE' | 'BREEAM' | 'OSMOZ' | 'SmartScore' | 'R2S' | 'Autre';
  niveau?: string;
  dateObtention: string;
  dateExpiration?: string;
  status: 'Active' | 'En renouvellement' | 'Expirée';
}

/** Avenant/renouvellement d'un mandat — trace qu'un mandat a évolué à une
 * date donnée, sans reconstruire tout l'historique des obligations. */
/** Sujet ESG configurable — remplace une liste figée par un vrai catalogue :
 * chaque sujet appartient à un pilier (Environnement/Social/Gouvernance),
 * peut être activé/désactivé par mandat, et de nouveaux sujets peuvent être
 * ajoutés librement (ce ne sont pas que les décrets Tertiaire/BACS). */
export interface EsgSubject {
  id: string;
  pillar: 'Environnement' | 'Social' | 'Gouvernance';
  label: string;
  mandat: string;
  active: boolean;
  isCustom?: boolean;
}

export interface MandateAmendment {
  id: string;
  mandat: string;
  description: string;
  date: string;
  createdByName: string;
}

/** KPI configurable, rattaché à un mandat/site, plutôt que codé en dur par
 * module — répond au besoin de KPI variables selon le mandat/portefeuille. */
export interface KpiDefinition {
  id: string;
  label: string;
  mandat?: string;
  siteId?: string;
  source: string; // description de la source de donnée (ex: "Consommation électrique Smart Building")
  frequencyDays: number;
  responsible: string;
  objective: number;
  threshold: number; // seuil d'alerte
  active: boolean;
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
}

/** Objectif ESG fixé une fois par an et par site — remplace l'ancien objectif
 * répété (et donc incohérent) à chaque entrée mensuelle. La performance se
 * lisse ensuite sur l'année complète, comparée à ce seul objectif annuel. */
export interface EsgObjective {
  id: string;
  siteId: string;
  year: number;
  energy: number;
  water: number;
  waste: number;
  co2: number;
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
  provider: 'Schneider EcoStruxure Building Operation' | 'Ubigreen Energy' | 'Advizeo' | 'Deltaconso Expert' | 'Dnergy' | 'API générique';
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
  heatNetworkKwh?: number; // réseau de chaleur urbain (ex: CPCU à Paris)
  coldNetworkKwh?: number; // réseau de froid urbain (ex: Fraîcheur de Paris)
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