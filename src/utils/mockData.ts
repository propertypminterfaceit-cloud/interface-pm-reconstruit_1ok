import { 
  User, Site, Intervention, Conformity, Prestataire, Document, 
  BudgetPPA, Sinistre, ESGData, Alert, Connection, Message,
  DemandePrestation, BPUItem, EnergyConnector, EnergyReading
} from '../types';

// Génère 12 mois de données de consommation par site, à partir de la surface
// et de la typologie du site (plus réaliste qu'un tirage purement aléatoire).
export function generateEnergyReadingsForSite(site: Site, source: string): EnergyReading[] {
  const months = ['2023-08', '2023-09', '2023-10', '2023-11', '2023-12', '2024-01'];
  const isChauffé = site.typologie.includes('HOTEL') || site.typologie.includes('TERTIAIRE');
  const baseKwhPerM2 = site.typologie.includes('LOGISTIQUE') ? 0.9 : 1.6;

  return months.map((month, index) => {
    const monthIndex = index; // 0 = août (été) ... 5 = janvier (hiver)
    const seasonalFactor = isChauffé ? 1 + (monthIndex / 5) * 0.6 : 1 + (monthIndex / 5) * 0.15;
    const electricityKwh = Math.round(site.surface * baseKwhPerM2 * seasonalFactor);
    const gasKwh = isChauffé ? Math.round(site.surface * 0.8 * seasonalFactor) : 0;
    const waterM3 = Math.round(site.surface * 0.015);
    const cost = Math.round(electricityKwh * 0.19 + gasKwh * 0.09);
    const co2Kg = Math.round(electricityKwh * 0.052 + gasKwh * 0.201);
    const peakPowerKw = Math.round((electricityKwh / 30 / 24) * 3.2);

    return {
      id: `${site.id}-${month}`,
      siteId: site.id,
      siteName: site.name,
      month,
      electricityKwh,
      gasKwh,
      waterM3,
      cost,
      co2Kg,
      peakPowerKw,
      source
    };
  });
}

function generateEnergyData(sites: Site[]) {
  // On simule un parc partiellement équipé : certains sites sont déjà
  // "connectés" à un connecteur (démo), d'autres non — pour refléter une
  // vraie situation de déploiement progressif.
  const providers: EnergyConnector['provider'][] = [
    'Schneider EcoStruxure Building Operation',
    'Ubigreen Energy',
    'Advizeo'
  ];

  const energyConnectors: EnergyConnector[] = sites.map((site, index) => {
    const connected = index < 3; // les 3 premiers sites du parc sont déjà connectés
    return {
      id: `conn-energy-${site.id}`,
      provider: providers[index % providers.length],
      siteId: site.id,
      siteName: site.name,
      status: connected ? 'Connecté' : 'Déconnecté',
      lastSync: connected ? '2024-01-15 06:00:00' : 'Jamais',
      apiEndpoint: connected ? `https://api.${providers[index % providers.length].toLowerCase().replace(/[^a-z]+/g, '-')}.com/v1/sites/${site.id}` : undefined
    };
  });

  const energyReadings: EnergyReading[] = sites.flatMap((site, index) => {
    const connector = energyConnectors[index];
    // On ne génère un historique détaillé que pour les sites connectés,
    // pour ne pas simuler des données qui n'existeraient pas encore en réalité.
    if (connector.status !== 'Connecté') return [];
    return generateEnergyReadingsForSite(site, connector.provider);
  });

  return { energyConnectors, energyReadings };
}

export function generateMockData() {
  const users: User[] = [
    { id: '1', name: 'Jean Dupont', email: 'j.dupont@interface.pm', role: 'PM', sites: ['1', '2'], averageRating: 4.2 },
    { id: '2', name: 'Marie Martin', email: 'm.martin@interface.pm', role: 'PM', sites: ['3', '4'], averageRating: 4.5 },
    { id: '3', name: 'Pierre Durand', email: 'p.durand@interface.pm', role: 'PM', sites: ['5'], averageRating: 3.8 },
    { id: '4', name: 'Sophie Bernard', email: 's.bernard@interface.pm', role: 'PM', sites: ['1', '3'], averageRating: 4.1 },
    { id: '5', name: 'Laurent Moreau', email: 'l.moreau@interface.pm', role: 'DT', sites: ['1', '2', '3', '4', '5'] },
    // Asset Managers (Propriétaires) — chacun rattaché à un mandat et à un sous-ensemble d'actifs distinct,
    // pour refléter un cas réel type PIMCO / Allianz gérant chacun une partie du patrimoine.
    { id: '6', name: 'Amélie Rousseau', email: 'a.rousseau@pimco.com', role: 'Propriétaire', sites: ['1', '4'], mandat: 'PIMCO' },
    { id: '7', name: 'Marc Lefèvre', email: 'm.lefevre@allianz.com', role: 'Propriétaire', sites: ['2', '3', '5'], mandat: 'Allianz' },
    { id: '8', name: 'Karim Haddad', email: 'k.haddad@prestataire.fr', role: 'Prestataire', sites: ['1', '2', '3'] },
  ];

  const sites: Site[] = [
    {
      id: '1',
      name: 'Tour Montparnasse',
      address: '33 Avenue du Maine, 75015 Paris',
      typologie: ['IGH', 'TERTIAIRE'],
      surface: 120000,
      year: 1973,
      energyClass: 'C',
      pmResponsible: '1',
      dtResponsible: '5',
      prestataire: '1',
      equipments: ['ascenseur', 'SSI', 'CTA', 'climatisation', 'désenfumage', 'GTB'],
      conformityScore: 85,
      status: 'Actif'
    },
    {
      id: '2',
      name: 'Entrepôt Logistique Roissy',
      address: 'Zone Industrielle, 95700 Roissy-en-France',
      typologie: ['LOGISTIQUE'],
      surface: 45000,
      year: 2010,
      energyClass: 'B',
      pmResponsible: '1',
      dtResponsible: '5',
      prestataire: '2',
      equipments: ['SSI', 'désenfumage', 'groupe électrogène', 'parkings ventilés'],
      conformityScore: 92,
      status: 'Actif'
    },
    {
      id: '3',
      name: 'Hôtel Mercure Lyon',
      address: '129 Rue Servient, 69003 Lyon',
      typologie: ['HOTEL', 'ERP'],
      surface: 8500,
      year: 1995,
      energyClass: 'D',
      pmResponsible: '2',
      dtResponsible: '5',
      prestataire: '3',
      equipments: ['ascenseur', 'SSI', 'climatisation', 'installations au gaz'],
      conformityScore: 78,
      status: 'Actif'
    },
    {
      id: '4',
      name: 'Centre Commercial Confluence',
      address: '112 Cours Charlemagne, 69002 Lyon',
      typologie: ['ERP', 'TERTIAIRE'],
      surface: 75000,
      year: 2012,
      energyClass: 'A',
      pmResponsible: '2',
      dtResponsible: '5',
      prestataire: '4',
      equipments: ['ascenseur', 'SSI', 'CTA', 'climatisation', 'désenfumage', 'GTB', 'panneaux photovoltaïques'],
      conformityScore: 95,
      status: 'Actif'
    },
    {
      id: '5',
      name: 'Bureaux Défense',
      address: '1 Parvis de la Défense, 92800 Puteaux',
      typologie: ['TERTIAIRE', 'IGH'],
      surface: 32000,
      year: 2005,
      energyClass: 'B',
      pmResponsible: '3',
      dtResponsible: '5',
      prestataire: '5',
      equipments: ['ascenseur', 'SSI', 'CTA', 'climatisation', 'désenfumage', 'GTB', 'chaufferie'],
      conformityScore: 88,
      status: 'Actif'
    }
  ];

  const interventions: Intervention[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      category: 'urgence',
      description: 'Panne ascenseur principal - blocage entre étages',
      dateRequested: '2024-01-15',
      amount: 8500,
      prestataire: '1',
      status: 'En attente',
      validationLevel: 0,
      requiredValidators: ['PM', 'DT'],
      documents: [],
      photos: []
    },
    {
      id: '2',
      siteId: '3',
      siteName: 'Hôtel Mercure Lyon',
      category: 'préventif',
      description: 'Maintenance annuelle système de climatisation',
      dateRequested: '2024-01-10',
      amount: 15000,
      prestataire: '3',
      status: 'En attente',
      validationLevel: 0,
      requiredValidators: ['PM', 'DT', 'Propriétaire'],
      documents: [],
      photos: []
    },
    {
      id: '3',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      category: 'curatif',
      description: 'Réparation système désenfumage suite contrôle',
      dateRequested: '2024-01-12',
      amount: 25000,
      prestataire: '2',
      status: 'En attente',
      validationLevel: 0,
      requiredValidators: ['PM', 'DT', 'Propriétaire'],
      documents: [],
      photos: []
    }
  ];

  const conformities: Conformity[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      obligation: 'Contrôle semestriel ascenseur',
      equipment: 'ascenseur',
      dueDate: '2024-01-20',
      prestataire: '1',
      status: 'Retard',
      alertSent: true,
      document: 'controle-ascenseur-tour-montparnasse-2024.pdf'
    },
    {
      id: '2',
      siteId: '3',
      siteName: 'Hôtel Mercure Lyon',
      obligation: 'Maintenance trimestrielle SSI',
      equipment: 'SSI',
      dueDate: '2024-02-15',
      prestataire: '3',
      status: 'À échéance',
      alertSent: false,
      document: 'maintenance-ssi-mercure-lyon-q1-2024.pdf'
    },
    {
      id: '3',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      obligation: 'Vérification annuelle désenfumage',
      equipment: 'désenfumage',
      dueDate: '2024-01-10',
      prestataire: '2',
      status: 'Retard',
      alertSent: true
    },
    {
      id: '4',
      siteId: '4',
      siteName: 'Centre Commercial Confluence',
      obligation: 'Contrôle d\'étanchéité climatisation',
      equipment: 'climatisation',
      dueDate: '2024-03-01',
      prestataire: '4',
      status: 'OK',
      alertSent: false,
      document: 'controle-etancheite-clim-confluence-2024.pdf'
    },
    {
      id: '5',
      siteId: '5',
      siteName: 'Bureaux Défense',
      obligation: 'Diagnostic GTB quinquennal',
      equipment: 'GTB',
      dueDate: '2024-04-15',
      prestataire: '5',
      status: 'OK',
      alertSent: false,
      document: 'diagnostic-gtb-bureaux-defense-2024.pdf'
    }
  ];

  const prestataires: Prestataire[] = [
    {
      id: '1',
      name: 'Ascenseurs Otis France',
      siret: '12345678901234',
      metier: 'Ascenseurs',
      status: 'Actif',
      sites: ['1'],
      contacts: {
        '1': { name: 'Michel Dubois', email: 'm.dubois@otis.com', phone: '01.23.45.67.89' }
      },
      rating: 4.2,
      interventionsCount: 15,
      conformityRate: 95,
      averageDelay: 2
    },
    {
      id: '2',
      name: 'Sécurité Incendie Pro',
      siret: '23456789012345',
      metier: 'Sécurité Incendie',
      status: 'Actif',
      sites: ['2'],
      contacts: {
        '2': { name: 'Sarah Leroy', email: 's.leroy@sipro.fr', phone: '01.34.56.78.90' }
      },
      rating: 4.5,
      interventionsCount: 22,
      conformityRate: 98,
      averageDelay: 1
    },
    {
      id: '3',
      name: 'Climatisation Expert',
      siret: '34567890123456',
      metier: 'CVC',
      status: 'Actif',
      sites: ['3'],
      contacts: {
        '3': { name: 'Antoine Moreau', email: 'a.moreau@climexpert.fr', phone: '04.56.78.90.12' }
      },
      rating: 3.8,
      interventionsCount: 18,
      conformityRate: 88,
      averageDelay: 3
    },
    {
      id: '4',
      name: 'Multi-Services Bâtiment',
      siret: '45678901234567',
      metier: 'Multi-technique',
      status: 'Actif',
      sites: ['4'],
      contacts: {
        '4': { name: 'Isabelle Petit', email: 'i.petit@msb.fr', phone: '04.67.89.01.23' }
      },
      rating: 4.1,
      interventionsCount: 31,
      conformityRate: 92,
      averageDelay: 2
    },
    {
      id: '5',
      name: 'Énergie & Maintenance',
      siret: '56789012345678',
      metier: 'Énergétique',
      status: 'Actif',
      sites: ['5'],
      contacts: {
        '5': { name: 'François Roux', email: 'f.roux@energie-maint.fr', phone: '01.78.90.12.34' }
      },
      rating: 4.3,
      interventionsCount: 12,
      conformityRate: 94,
      averageDelay: 1
    },
    {
      id: '6',
      name: 'Nettoyage Premium',
      siret: '67890123456789',
      metier: 'Nettoyage',
      status: 'En validation',
      sites: ['1', '3'],
      contacts: {
        '1': { name: 'Marie Blanc', email: 'm.blanc@nettoyage-premium.fr', phone: '01.89.01.23.45' },
        '3': { name: 'Paul Vert', email: 'p.vert@nettoyage-premium.fr', phone: '04.90.12.34.56' }
      },
      rating: 0,
      interventionsCount: 0,
      conformityRate: 0,
      averageDelay: 0
    }
  ];

  const documents: Document[] = [
    {
      id: '1',
      name: 'Rapport maintenance ascenseur Q4 2023',
      type: 'RMA',
      siteId: '1',
      uploadDate: '2024-01-05',
      status: 'En attente',
      size: '2.3 MB',
      url: '/documents/rapport-ascenseur-q4.pdf'
    },
    {
      id: '2',
      name: 'Contrat maintenance SSI 2024',
      type: 'Contrats',
      siteId: '2',
      uploadDate: '2024-01-08',
      status: 'En attente',
      size: '1.8 MB',
      url: '/documents/contrat-ssi-2024.pdf'
    },
    {
      id: '3',
      name: 'PV contrôle climatisation',
      type: 'Conformité',
      siteId: '3',
      uploadDate: '2024-01-12',
      status: 'Validé',
      size: '0.9 MB',
      url: '/documents/pv-climatisation.pdf'
    },
    {
      id: '4',
      name: 'Facture intervention urgence',
      type: 'Interventions',
      siteId: '4',
      uploadDate: '2024-01-15',
      status: 'Validé',
      size: '0.5 MB',
      url: '/documents/facture-urgence.pdf'
    },
    {
      id: '5',
      name: 'Contrat maintenance ascenseurs 2024-2027',
      type: 'Contrats',
      siteId: '1',
      uploadDate: '2024-01-01',
      status: 'Validé',
      size: '3.2 MB',
      url: '/documents/contrat-ascenseurs-2024.pdf'
    },
    {
      id: '6',
      name: 'Contrat nettoyage bureaux Lyon',
      type: 'Contrats',
      siteId: '3',
      uploadDate: '2024-01-05',
      status: 'Validé',
      size: '2.1 MB',
      url: '/documents/contrat-nettoyage-lyon.pdf'
    }
  ];

  const budgetPPA: BudgetPPA[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      year: 2024,
      duration: 2,
      amount: 150000,
      object: 'Rénovation système CTA',
      status: 'Non démarré',
      pvSigned: false,
      createdByName: 'Jean Dupont',
      createdByRole: 'PM',
      createdAt: '02/01/2024 09:15',
      validationStatus: 'En attente'
    },
    {
      id: '2',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      year: 2024,
      duration: 1,
      amount: 85000,
      object: 'Mise aux normes éclairage LED',
      status: 'En cours',
      pvSigned: false,
      createdByName: 'Jean Dupont',
      createdByRole: 'PM',
      createdAt: '05/01/2024 11:30',
      validationStatus: 'Validé',
      validatedByName: 'Marc Lefèvre',
      validatedAt: '06/01/2024 14:20',
      validationComment: 'Budget conforme aux prévisions, à lancer'
    },
    {
      id: '3',
      siteId: '3',
      siteName: 'Hôtel Mercure Lyon',
      year: 2024,
      duration: 3,
      amount: 220000,
      object: 'Réfection façade et isolation',
      status: 'Terminé',
      pvSigned: true,
      signatureDate: '2024-01-10',
      createdByName: 'Marie Martin',
      createdByRole: 'PM',
      createdAt: '08/01/2024 10:00',
      validationStatus: 'Validé',
      validatedByName: 'Marc Lefèvre',
      validatedAt: '09/01/2024 16:45'
    }
  ];

  const sinistres: Sinistre[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      type: 'Dégât des eaux',
      date: '2024-01-08',
      description: 'Fuite canalisation étage 15 - bureaux inondés',
      status: 'Expertise',
      photos: ['/photos/degat-eaux-1.jpg'],
      interventionGenerated: true
    },
    {
      id: '2',
      siteId: '4',
      siteName: 'Centre Commercial Confluence',
      type: 'Vol',
      date: '2024-01-12',
      description: 'Vol matériel informatique boutique niveau 2',
      status: 'Déclaré',
      photos: ['/photos/vol-materiel.jpg'],
      interventionGenerated: false
    }
  ];

  const esgData: ESGData[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      month: '2024-01',
      energy: 45000,
      water: 1200,
      waste: 850,
      co2: 12.5,
      objectives: { energy: 42000, water: 1100, waste: 800, co2: 11.0 }
    },
    {
      id: '2',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      month: '2024-01',
      energy: 28000,
      water: 450,
      waste: 320,
      co2: 8.2,
      objectives: { energy: 30000, water: 500, waste: 350, co2: 9.0 }
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'conformité',
      severity: 'high',
      message: 'Contrôle ascenseur en retard - Tour Montparnasse',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      date: '2024-01-15',
      read: false
    },
    {
      id: '2',
      type: 'conformité',
      severity: 'high',
      message: 'Vérification désenfumage en retard - Entrepôt Roissy',
      siteId: '2',
      siteName: 'Entrepôt Logistique Roissy',
      date: '2024-01-15',
      read: false
    },
    {
      id: '3',
      type: 'document',
      severity: 'medium',
      message: '2 documents en attente de validation',
      date: '2024-01-15',
      read: false
    },
    {
      id: '4',
      type: 'intervention',
      severity: 'high',
      message: '3 interventions en attente de validation',
      date: '2024-01-15',
      read: false
    },
    {
      id: '5',
      type: 'sinistre',
      severity: 'medium',
      message: '2 sinistres en cours de traitement',
      date: '2024-01-15',
      read: false
    }
  ];

  const connections: Connection[] = [
    {
      id: '1',
      name: 'Yardi Voyager',
      url: 'https://api.yardi.com/v1',
      type: 'bidirectionnelle',
      status: 'Actif',
      lastSync: '2024-01-15 09:30:00',
      modules: ['Sites', 'Budget PPA'],
      sites: ['1', '2', '3'],
      description: 'Synchronisation données comptables et budgets',
      errors: []
    },
    {
      id: '2',
      name: 'Intent Technologies',
      url: 'https://api.intent.fr/v2',
      type: 'unidirectionnelle',
      status: 'Erreur',
      lastSync: '2024-01-14 15:45:00',
      modules: ['ESG', 'Conformité'],
      sites: ['1', '4', '5'],
      description: 'Import données énergétiques et conformité',
      errors: ['Timeout API', 'Token expiré']
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      siteId: '1',
      from: 'Jean Dupont',
      to: 'Laurent Moreau',
      message: 'Problème ascenseur résolu, merci pour le suivi',
      date: '2024-01-15 14:30:00',
      read: false
    },
    {
      id: '2',
      siteId: '3',
      from: 'Marie Martin',
      to: 'Sophie Bernard',
      message: 'Pouvez-vous valider le rapport de maintenance ?',
      date: '2024-01-15 11:15:00',
      read: true
    }
  ];

  const bpuItems: BPUItem[] = [
    {
      id: '1',
      siteId: '1',
      metier: 'Propreté',
      lot: 'Nettoyage courant',
      poste: 'Sol dur',
      unite: 'm²',
      prixUnitaireHT: 2.50
    },
    {
      id: '2',
      siteId: '1',
      metier: 'Propreté',
      lot: 'Nettoyage courant',
      poste: 'Sanitaires',
      unite: 'unité',
      prixUnitaireHT: 15.00
    },
    {
      id: '3',
      siteId: '1',
      metier: 'Maintenance',
      lot: 'Électricité',
      poste: 'Intervention électrique',
      unite: 'heure',
      prixUnitaireHT: 65.00
    }
  ];

  const demandesPrestation: DemandePrestation[] = [
    {
      id: '1',
      siteId: '1',
      siteName: 'Tour Montparnasse',
      localisation: 'Niveau 3 - Hall d\'accueil',
      typePrestation: 'Propreté',
      modalite: 'BPU',
      description: 'Nettoyage approfondi suite à dégât des eaux',
      dateCreation: '2024-01-15',
      createdBy: '1',
      status: 'Transmise',
      lignes: [
        {
          id: '1',
          poste: 'Sol dur',
          quantite: 150,
          unite: 'm²',
          prixUnitaireHT: 2.50,
          montantHT: 375
        }
      ],
      prestataireAssigne: '1',
      montantTotal: 375,
      historique: [
        {
          date: '2024-01-15',
          action: 'Création',
          utilisateur: 'Jean Dupont'
        }
      ]
    }
  ];

  const { energyConnectors, energyReadings } = generateEnergyData(sites);

  return {
    users,
    sites,
    interventions,
    conformities,
    prestataires,
    documents,
    budgetPPA,
    sinistres,
    esgData,
    alerts,
    connections,
    messages,
    demandesPrestation,
    bpuItems,
    energyConnectors,
    energyReadings
  };
}