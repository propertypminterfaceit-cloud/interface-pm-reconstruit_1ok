export const roleConfig = {
  PM: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    // UNIVERS 1 — PATRIMOINE & STRUCTURE
    { id: 'sites', label: 'Sites', icon: 'Building', group: 'PATRIMOINE & STRUCTURE' },
    { id: 'equipe', label: 'Équipes', icon: 'UserCheck', group: 'PATRIMOINE & STRUCTURE' },
    { id: 'messagerie', label: 'Messagerie', icon: 'MessageCircle', group: 'PATRIMOINE & STRUCTURE' },
    // UNIVERS 2 — CONFORMITÉ & ESG
    { id: 'conformite', label: 'Conformité réglementaire', icon: 'Shield', group: 'CONFORMITÉ & ESG' },
    { id: 'esg', label: 'ESG', icon: 'Leaf', group: 'CONFORMITÉ & ESG' },
    { id: 'energie', label: 'Énergie & Smart Building', icon: 'Gauge', group: 'CONFORMITÉ & ESG' },
    { id: 'certifications', label: 'Certifications (option à activer)', icon: 'Award', group: 'CONFORMITÉ & ESG' },
    { id: 'alertes', label: 'Alertes', icon: 'Bell', group: 'CONFORMITÉ & ESG' },
    // UNIVERS 3 — EXPLOITATION & OPÉRATIONS
    { id: 'interventions', label: 'Urgence & ticket', icon: 'Zap', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'demande-prestation', label: 'Demande de prestation', icon: 'ClipboardList', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'travaux', label: 'Travaux', icon: 'Hammer', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'sinistres', label: 'Sinistres', icon: 'Tornado', group: 'EXPLOITATION & OPÉRATIONS' },
    // UNIVERS 4 — FINANCES & PARTENAIRES
    { id: 'prestataires', label: 'Prestataires', icon: 'Package', group: 'FINANCES & PARTENAIRES' },
    { id: 'documents', label: 'Documents', icon: 'Folder', group: 'FINANCES & PARTENAIRES' },
    { id: 'data-room', label: 'Data Room', icon: 'FolderArchive', group: 'FINANCES & PARTENAIRES' },
    { id: 'budget-ppa', label: 'Budget PPA', icon: 'DollarSign', group: 'FINANCES & PARTENAIRES' },
  ],
  DT: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    // UNIVERS 1 — PATRIMOINE & STRUCTURE
    { id: 'sites', label: 'Sites', icon: 'Building', group: 'PATRIMOINE & STRUCTURE' },
    { id: 'equipe', label: 'Équipes', icon: 'UserCheck', group: 'PATRIMOINE & STRUCTURE' },
    { id: 'messagerie', label: 'Messagerie', icon: 'MessageCircle', group: 'PATRIMOINE & STRUCTURE' },
    // UNIVERS 2 — CONFORMITÉ & ESG
    { id: 'conformite', label: 'Conformité réglementaire', icon: 'Shield', group: 'CONFORMITÉ & ESG' },
    { id: 'esg', label: 'ESG', icon: 'Leaf', group: 'CONFORMITÉ & ESG' },
    { id: 'energie', label: 'Énergie & Smart Building', icon: 'Gauge', group: 'CONFORMITÉ & ESG' },
    { id: 'certifications', label: 'Certifications (option à activer)', icon: 'Award', group: 'CONFORMITÉ & ESG' },
    { id: 'alertes', label: 'Alertes', icon: 'Bell', group: 'CONFORMITÉ & ESG' },
    // UNIVERS 3 — EXPLOITATION & OPÉRATIONS
    { id: 'interventions', label: 'Urgence & ticket', icon: 'Zap', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'demande-prestation', label: 'Demande de prestation', icon: 'ClipboardList', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'travaux', label: 'Travaux', icon: 'Hammer', group: 'EXPLOITATION & OPÉRATIONS' },
    { id: 'sinistres', label: 'Sinistres', icon: 'Tornado', group: 'EXPLOITATION & OPÉRATIONS' },
    // UNIVERS 4 — FINANCES & PARTENAIRES
    { id: 'prestataires', label: 'Prestataires', icon: 'Package', group: 'FINANCES & PARTENAIRES' },
    { id: 'documents', label: 'Documents', icon: 'Folder', group: 'FINANCES & PARTENAIRES' },
    { id: 'data-room', label: 'Data Room', icon: 'FolderArchive', group: 'FINANCES & PARTENAIRES' },
    { id: 'budget-ppa', label: 'Budget PPA', icon: 'DollarSign', group: 'FINANCES & PARTENAIRES' },
    // UNIVERS 5 — ADMINISTRATION (réservé DT : décisions structurantes, pas de la gestion quotidienne)
    { id: 'connexion', label: 'Connexion', icon: 'Link', group: 'ADMINISTRATION' },
    { id: 'honoraires', label: 'Honoraires (barèmes)', icon: 'Wallet', group: 'ADMINISTRATION' },
    { id: 'specificites-mandat', label: 'Spécificités du mandat', icon: 'FileSignature', group: 'ADMINISTRATION' },
    { id: 'audit', label: "Journal d'audit", icon: 'History', group: 'ADMINISTRATION' },
  ],
  Prestataire: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    { id: 'sites', label: 'Sites', icon: 'MapPin' },
    { id: 'conformite', label: 'Conformité', icon: 'Shield' },
    { id: 'interventions', label: 'Urgence & Ticket', icon: 'Wrench' },
    { id: 'travaux', label: 'Travaux', icon: 'HardHat' },
    { id: 'demande-prestation', label: 'Demande de prestation', icon: 'ClipboardList' },
    { id: 'messagerie', label: 'Messagerie', icon: 'MessageCircle' },
  ],
  Propriétaire: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    { id: 'sites', label: 'Sites', icon: 'MapPin' },
    { id: 'conformite', label: 'Conformité', icon: 'Shield' },
    { id: 'budget-ppa', label: 'Budget PPA', icon: 'DollarSign' },
    { id: 'documents', label: 'Documents', icon: 'FileText' },
    { id: 'sinistres', label: 'Sinistres', icon: 'AlertTriangle' },
    { id: 'esg', label: 'ESG', icon: 'Leaf' },
    { id: 'energie', label: 'Énergie & Smart Building', icon: 'Gauge' },
    { id: 'certifications', label: 'Certifications (option à activer)', icon: 'Award' },
    { id: 'messagerie', label: 'Messagerie', icon: 'MessageCircle' },
  ],
};