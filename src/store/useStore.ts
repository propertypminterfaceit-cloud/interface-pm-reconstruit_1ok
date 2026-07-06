import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, Site, Intervention, Conformity, Prestataire, Document, 
  BudgetPPA, Sinistre, ESGData, EsgObjective, Alert, Connection, Message,
  DemandePrestation, BPUItem, EnergyConnector, EnergyReading, AuditEntry,
  Obligation, Niveau, ConsigneTemperature, Certification, MandateAmendment, KpiDefinition,
  EsgSubject
} from '../types';
import { FeeSchedule, FeeTier } from '../utils/feeSchedule';
import { generateMockData, generateEnergyReadingsForSite } from '../utils/mockData';

interface AppState {
  // Auth & Navigation
  currentUser: User | null;
  currentRole: 'PM' | 'DT' | 'Prestataire' | 'Propriétaire';
  activeTab: string;
  isDemoMode: boolean;
  
  // Data
  users: User[];
  sites: Site[];
  interventions: Intervention[];
  conformities: Conformity[];
  prestataires: Prestataire[];
  documents: Document[];
  budgetPPA: BudgetPPA[];
  sinistres: Sinistre[];
  esgData: ESGData[];
  alerts: Alert[];
  connections: Connection[];
  messages: Message[];
  demandesPrestation: DemandePrestation[];
  bpuItems: BPUItem[];
  energyConnectors: EnergyConnector[];
  energyReadings: EnergyReading[];
  feeSchedules: FeeSchedule[];
  auditLog: AuditEntry[];
  obligations: Obligation[];
  niveaux: Niveau[];
  consignesTemperature: ConsigneTemperature[];
  certifications: Certification[];
  esgObjectives: EsgObjective[];
  mandateAmendments: MandateAmendment[];
  kpiDefinitions: KpiDefinition[];
  esgSubjects: EsgSubject[];
  
  // Actions
  setCurrentRole: (role: 'PM' | 'DT' | 'Prestataire' | 'Propriétaire') => void;
  switchDemoUser: (userId: string) => void;
  setActiveTab: (tab: string) => void;
  setDemoMode: (demo: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  
  // CRUD Operations
  addSite: (site: Site) => void;
  updateSite: (id: string, site: Partial<Site>) => void;
  addIntervention: (intervention: Intervention) => void;
  updateIntervention: (id: string, intervention: Partial<Intervention>) => void;
  addPrestataire: (prestataire: Prestataire) => void;
  updatePrestataire: (id: string, prestataire: Partial<Prestataire>) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  archiveDocumentsForYear: (year: number) => void;
  addBudgetPPA: (budget: BudgetPPA) => void;
  updateBudgetPPA: (id: string, budget: Partial<BudgetPPA>) => void;
  addSinistre: (sinistre: Sinistre) => void;
  updateSinistre: (id: string, sinistre: Partial<Sinistre>) => void;
  addESGData: (esg: ESGData) => void;
  updateESGData: (id: string, esg: Partial<ESGData>) => void;
  markAlertAsRead: (id: string) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, connection: Partial<Connection>) => void;
  addMessage: (message: Message) => void;
  updateConformity: (id: string, conformity: Partial<Conformity>) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  addDemandePrestation: (demande: DemandePrestation) => void;
  updateDemandePrestation: (id: string, demande: Partial<DemandePrestation>) => void;

  connectEnergyProvider: (siteId: string, provider: EnergyConnector['provider'], apiEndpoint?: string) => void;
  disconnectEnergyProvider: (connectorId: string) => void;
  updateEnergyConnector: (id: string, connector: Partial<EnergyConnector>) => void;

  // Réservé au DT côté UI : le barème d'honoraires est une décision de gouvernance,
  // pas une opération quotidienne du PM.
  upsertFeeSchedule: (mandat: string, tiers: FeeTier[]) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  addObligation: (obligation: Obligation) => void;
  updateObligation: (id: string, obligation: Partial<Obligation>) => void;
  addNiveau: (niveau: Niveau) => void;
  updateConsigneTemperature: (niveauId: string, consigne: number, source: string) => void;
  addCertification: (certification: Certification) => void;
  upsertEsgObjective: (siteId: string, year: number, objective: Omit<EsgObjective, 'id' | 'siteId' | 'year'>) => void;
  addMandateAmendment: (amendment: MandateAmendment) => void;
  addKpiDefinition: (kpi: KpiDefinition) => void;
  updateKpiDefinition: (id: string, kpi: Partial<KpiDefinition>) => void;
  addEsgSubject: (subject: EsgSubject) => void;
  updateEsgSubject: (id: string, subject: Partial<EsgSubject>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentRole: 'PM',
      activeTab: 'dashboard',
      isDemoMode: true,
      
      // Initialize with mock data
      ...generateMockData(),
      
      // Actions
      setCurrentRole: (role) => set({ currentRole: role, activeTab: 'dashboard' }),
      // Sélectionne un utilisateur démo précis (pas juste un rôle) : c'est ce qui
      // permet de représenter plusieurs Asset Managers/PM distincts, chacun avec
      // son propre périmètre de sites attribués, plutôt qu'une vue "tout ou rien".
      switchDemoUser: (userId) => {
        const user = (get().users || []).find(u => u.id === userId);
        if (!user) return;
        set({ currentUser: user, currentRole: user.role as AppState['currentRole'], activeTab: 'dashboard' });
      },
      setActiveTab: (tab) => set({ activeTab: tab }),
      setDemoMode: (demo) => set({ isDemoMode: demo }),
      login: (user) => set({ currentUser: user, currentRole: user.role }),
      logout: () => set({ currentUser: null }),
      
      // CRUD Operations
      addSite: (site) => set((state) => ({ sites: [...state.sites, site] })),
      updateSite: (id, siteUpdate) => set((state) => ({
        sites: state.sites.map(site => site.id === id ? { ...site, ...siteUpdate } : site)
      })),
      
      addIntervention: (intervention) => set((state) => ({ 
        interventions: [...(state.interventions || []), { 
          ...intervention, 
          documents: intervention.documents || [],
          photos: intervention.photos || []
        }] 
      })),
      updateIntervention: (id, interventionUpdate) => set((state) => ({
        interventions: (state.interventions || []).map(intervention => 
          intervention.id === id ? { 
            ...intervention, 
            ...interventionUpdate,
            documents: interventionUpdate.documents || intervention.documents || [],
            photos: interventionUpdate.photos || intervention.photos || []
          } : intervention
        )
      })),
      
      addPrestataire: (prestataire) => set((state) => ({ 
        prestataires: [...(state.prestataires || []), prestataire] 
      })),
      updatePrestataire: (id, prestataireUpdate) => set((state) => ({
        prestataires: (state.prestataires || []).map(prestataire => 
          prestataire.id === id ? { ...prestataire, ...prestataireUpdate } : prestataire
        )
      })),
      
      addDocument: (document) => set((state) => ({ 
        documents: [...(state.documents || []), document] 
      })),
      updateDocument: (id, documentUpdate) => set((state) => ({
        documents: (state.documents || []).map(document => 
          document.id === id ? { ...document, ...documentUpdate } : document
        )
      })),
      // Archive (snapshot figé) tous les documents dont la date d'upload tombe
      // dans l'année donnée et qui ne sont pas déjà archivés. Les documents ne
      // sont jamais supprimés : ils passent simplement dans la vue "Archives",
      // distincte des documents encore actifs/en cours.
      archiveDocumentsForYear: (year) => set((state) => ({
        documents: (state.documents || []).map(document => {
          const documentYear = new Date(document.uploadDate).getFullYear();
          if (documentYear === year && !document.archivedYear) {
            return { ...document, archivedYear: year };
          }
          return document;
        })
      })),
      
      addBudgetPPA: (budget) => set((state) => ({ 
        budgetPPA: [...(state.budgetPPA || []), budget] 
      })),
      updateBudgetPPA: (id, budgetUpdate) => set((state) => ({
        budgetPPA: (state.budgetPPA || []).map(budget => 
          budget.id === id ? { ...budget, ...budgetUpdate } : budget
        )
      })),
      
      addSinistre: (sinistre) => set((state) => ({ 
        sinistres: [...(state.sinistres || []), sinistre] 
      })),
      updateSinistre: (id, sinistreUpdate) => set((state) => ({
        sinistres: (state.sinistres || []).map(sinistre => 
          sinistre.id === id ? { ...sinistre, ...sinistreUpdate } : sinistre
        )
      })),
      
      addESGData: (esg) => set((state) => ({ 
        esgData: [...(state.esgData || []), esg] 
      })),
      updateESGData: (id, esgUpdate) => set((state) => ({
        esgData: (state.esgData || []).map(esg => 
          esg.id === id ? { ...esg, ...esgUpdate } : esg
        )
      })),
      
      markAlertAsRead: (id) => set((state) => ({
        alerts: (state.alerts || []).map(alert => 
          alert.id === id ? { ...alert, read: true } : alert
        )
      })),
      
      addConnection: (connection) => set((state) => ({ 
        connections: [...(state.connections || []), connection] 
      })),
      updateConnection: (id, connectionUpdate) => set((state) => ({
        connections: (state.connections || []).map(connection => 
          connection.id === id ? { ...connection, ...connectionUpdate } : connection
        )
      })),
      
      addMessage: (message) => set((state) => ({ 
        messages: [...(state.messages || []), message] 
      })),
      
      updateConformity: (id, conformityUpdate) => set((state) => ({
        conformities: (state.conformities || []).map(conformity => 
          conformity.id === id ? { ...conformity, ...conformityUpdate } : conformity
        )
      })),
      
      addUser: (user) => set((state) => ({ 
        users: [...(state.users || []), user] 
      })),
      updateUser: (id, userUpdate) => set((state) => ({
        users: (state.users || []).map(user => 
          user.id === id ? { ...user, ...userUpdate } : user
        )
      })),
      
      addDemandePrestation: (demande) => set((state) => ({ 
        demandesPrestation: [...(state.demandesPrestation || []), demande] 
      })),
      updateDemandePrestation: (id, demandeUpdate) => set((state) => ({
        demandesPrestation: (state.demandesPrestation || []).map(demande => 
          demande.id === id ? { ...demande, ...demandeUpdate } : demande
        )
      })),

      // Connecte un site à un fournisseur de supervision énergétique.
      // En mode démo (pas de vraie clé API), on simule le délai réseau réel
      // d'un handshake API pour rendre la démonstration crédible, puis on
      // "reçoit" un historique de consommation comme le ferait un vrai import.
      connectEnergyProvider: (siteId, provider, apiEndpoint) => {
        const site = (get().sites || []).find(s => s.id === siteId);
        if (!site) return;

        const existing = (get().energyConnectors || []).find(c => c.siteId === siteId);
        const connectorId = existing ? existing.id : `conn-energy-${siteId}`;

        set((state) => ({
          energyConnectors: existing
            ? state.energyConnectors.map(c =>
                c.id === connectorId
                  ? { ...c, provider, apiEndpoint: apiEndpoint ?? c.apiEndpoint, status: 'Connexion en cours' as const }
                  : c
              )
            : [
                ...(state.energyConnectors || []),
                {
                  id: connectorId,
                  provider,
                  siteId,
                  siteName: site.name,
                  status: 'Connexion en cours' as const,
                  lastSync: 'Jamais',
                  apiEndpoint
                }
              ]
        }));

        setTimeout(() => {
          const now = new Date().toLocaleString('fr-FR');
          set((state) => {
            const hasReadings = (state.energyReadings || []).some(r => r.siteId === siteId);
            const newReadings = hasReadings ? [] : generateEnergyReadingsForSite(site, provider);
            return {
              energyConnectors: state.energyConnectors.map(c =>
                c.id === connectorId ? { ...c, status: 'Connecté' as const, lastSync: now } : c
              ),
              energyReadings: [...(state.energyReadings || []), ...newReadings]
            };
          });
        }, 1200);
      },

      disconnectEnergyProvider: (connectorId) => set((state) => ({
        energyConnectors: (state.energyConnectors || []).map(c =>
          c.id === connectorId ? { ...c, status: 'Déconnecté' as const } : c
        )
      })),

      updateEnergyConnector: (id, connectorUpdate) => set((state) => ({
        energyConnectors: (state.energyConnectors || []).map(c =>
          c.id === id ? { ...c, ...connectorUpdate } : c
        )
      })),

      upsertFeeSchedule: (mandat, tiers) => set((state) => {
        const existing = (state.feeSchedules || []).find(s => s.mandat === mandat);
        return {
          feeSchedules: existing
            ? state.feeSchedules.map(s => s.mandat === mandat ? { mandat, tiers } : s)
            : [...(state.feeSchedules || []), { mandat, tiers }]
        };
      }),

      addAuditEntry: (entry) => set((state) => ({
        auditLog: [entry, ...(state.auditLog || [])]
      })),

      addObligation: (obligation) => set((state) => ({
        obligations: [...(state.obligations || []), obligation]
      })),
      updateObligation: (id, obligationUpdate) => set((state) => ({
        obligations: (state.obligations || []).map(o =>
          o.id === id ? { ...o, ...obligationUpdate } : o
        )
      })),

      addNiveau: (niveau) => set((state) => ({
        niveaux: [...(state.niveaux || []), niveau]
      })),

      updateConsigneTemperature: (niveauId, consigne, source) => set((state) => {
        const existing = (state.consignesTemperature || []).find(c => c.niveauId === niveauId);
        const niveau = (state.niveaux || []).find(n => n.id === niveauId);
        const now = new Date().toLocaleString('fr-FR');
        if (existing) {
          return {
            consignesTemperature: state.consignesTemperature.map(c =>
              c.niveauId === niveauId ? { ...c, consigne, source, lastSync: now } : c
            )
          };
        }
        return {
          consignesTemperature: [
            ...(state.consignesTemperature || []),
            { id: `ct-${niveauId}`, niveauId, siteId: niveau?.siteId || '', consigne, source, lastSync: now }
          ]
        };
      }),

      addCertification: (certification) => set((state) => ({
        certifications: [...(state.certifications || []), certification]
      })),

      upsertEsgObjective: (siteId, year, objective) => set((state) => {
        const existing = (state.esgObjectives || []).find(o => o.siteId === siteId && o.year === year);
        if (existing) {
          return {
            esgObjectives: state.esgObjectives.map(o =>
              o.siteId === siteId && o.year === year ? { ...o, ...objective } : o
            )
          };
        }
        return {
          esgObjectives: [...(state.esgObjectives || []), { id: `esgobj-${siteId}-${year}`, siteId, year, ...objective }]
        };
      }),

      addMandateAmendment: (amendment) => set((state) => ({
        mandateAmendments: [amendment, ...(state.mandateAmendments || [])]
      })),

      addKpiDefinition: (kpi) => set((state) => ({
        kpiDefinitions: [...(state.kpiDefinitions || []), kpi]
      })),
      updateKpiDefinition: (id, kpiUpdate) => set((state) => ({
        kpiDefinitions: (state.kpiDefinitions || []).map(k => k.id === id ? { ...k, ...kpiUpdate } : k)
      })),

      addEsgSubject: (subject) => set((state) => ({
        esgSubjects: [...(state.esgSubjects || []), subject]
      })),
      updateEsgSubject: (id, subjectUpdate) => set((state) => ({
        esgSubjects: (state.esgSubjects || []).map(s => s.id === id ? { ...s, ...subjectUpdate } : s)
      })),
    }),
    {
      name: 'interface-pm-storage',
      version: 3, // incrémenté à nouveau pour le catalogue ESG configurable (esgSubjects)
      partialize: (state) => ({
        currentRole: state.currentRole,
        activeTab: state.activeTab,
        isDemoMode: state.isDemoMode,
        // Only persist essential data, let mock data reinitialize
        users: state.users,
        sites: state.sites,
        interventions: state.interventions,
        prestataires: state.prestataires,
        documents: state.documents,
        budgetPPA: state.budgetPPA,
        sinistres: state.sinistres,
        esgData: state.esgData,
        alerts: state.alerts,
        connections: state.connections,
        messages: state.messages,
        conformities: state.conformities,
        demandesPrestation: state.demandesPrestation,
        bpuItems: state.bpuItems,
        energyConnectors: state.energyConnectors,
        energyReadings: state.energyReadings,
        feeSchedules: state.feeSchedules,
        auditLog: state.auditLog,
        obligations: state.obligations,
        niveaux: state.niveaux,
        consignesTemperature: state.consignesTemperature,
        certifications: state.certifications,
        esgObjectives: state.esgObjectives,
        mandateAmendments: state.mandateAmendments,
        kpiDefinitions: state.kpiDefinitions,
        esgSubjects: state.esgSubjects
      }),
      migrate: (persistedState: any, version: number) => {
        const mockData = generateMockData();
        return { 
          ...mockData,
          ...persistedState,
          // Always ensure arrays exist
          interventions: Array.isArray(persistedState?.interventions) ? persistedState.interventions : mockData.interventions,
          sites: Array.isArray(persistedState?.sites) ? persistedState.sites : mockData.sites,
          users: Array.isArray(persistedState?.users) ? persistedState.users : mockData.users,
          prestataires: Array.isArray(persistedState?.prestataires) ? persistedState.prestataires : mockData.prestataires,
          documents: Array.isArray(persistedState?.documents) ? persistedState.documents : mockData.documents,
          budgetPPA: Array.isArray(persistedState?.budgetPPA) ? persistedState.budgetPPA : mockData.budgetPPA,
          sinistres: Array.isArray(persistedState?.sinistres) ? persistedState.sinistres : mockData.sinistres,
          esgData: Array.isArray(persistedState?.esgData) ? persistedState.esgData : mockData.esgData,
          alerts: Array.isArray(persistedState?.alerts) ? persistedState.alerts : mockData.alerts,
          connections: Array.isArray(persistedState?.connections) ? persistedState.connections : mockData.connections,
          messages: Array.isArray(persistedState?.messages) ? persistedState.messages : mockData.messages,
          conformities: Array.isArray(persistedState?.conformities) && persistedState.conformities.length > 0 ? persistedState.conformities : mockData.conformities,
          demandesPrestation: Array.isArray(persistedState?.demandesPrestation) ? persistedState.demandesPrestation : mockData.demandesPrestation,
          bpuItems: Array.isArray(persistedState?.bpuItems) ? persistedState.bpuItems : mockData.bpuItems,
          energyConnectors: Array.isArray(persistedState?.energyConnectors) ? persistedState.energyConnectors : mockData.energyConnectors,
          energyReadings: Array.isArray(persistedState?.energyReadings) ? persistedState.energyReadings : mockData.energyReadings,
          feeSchedules: Array.isArray(persistedState?.feeSchedules) ? persistedState.feeSchedules : mockData.feeSchedules,
          auditLog: Array.isArray(persistedState?.auditLog) ? persistedState.auditLog : (mockData.auditLog || []),
          obligations: Array.isArray(persistedState?.obligations) ? persistedState.obligations : (mockData.obligations || []),
          niveaux: Array.isArray(persistedState?.niveaux) ? persistedState.niveaux : (mockData.niveaux || []),
          consignesTemperature: Array.isArray(persistedState?.consignesTemperature) ? persistedState.consignesTemperature : (mockData.consignesTemperature || []),
          certifications: Array.isArray(persistedState?.certifications) ? persistedState.certifications : (mockData.certifications || []),
          esgObjectives: Array.isArray(persistedState?.esgObjectives) ? persistedState.esgObjectives : (mockData.esgObjectives || []),
          mandateAmendments: Array.isArray(persistedState?.mandateAmendments) ? persistedState.mandateAmendments : (mockData.mandateAmendments || []),
          kpiDefinitions: Array.isArray(persistedState?.kpiDefinitions) ? persistedState.kpiDefinitions : (mockData.kpiDefinitions || []),
          esgSubjects: Array.isArray(persistedState?.esgSubjects) ? persistedState.esgSubjects : (mockData.esgSubjects || [])
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Force initialization of mock data if arrays are missing
          const mockData = generateMockData();
          Object.keys(mockData).forEach(key => {
            if (Array.isArray(mockData[key]) && (!state[key] || !Array.isArray(state[key]))) {
              state[key] = mockData[key];
            }
          });
        }
      }
    }
  )
);