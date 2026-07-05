import React from 'react';
import { useStore } from '../store/useStore';
import { roleConfig } from '../utils/roleConfig';
import * as Icons from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { 
    currentRole, currentUser, activeTab, setActiveTab, switchDemoUser, isDemoMode,
    interventions, budgetPPA, demandesPrestation, documents, users, messages
  } = useStore();
  
  const tabs = roleConfig[currentRole];

  // Calculer les validations en attente pour chaque module
  const getPendingValidations = (moduleId: string) => {
    // Les messages non lus concernent tous les rôles, pas seulement PM/DT —
    // évalué avant le filtre ci-dessous qui ne s'applique qu'aux validations métier.
    if (moduleId === 'messagerie') {
      if (!currentUser) return 0;
      return (messages || []).filter(m =>
        !m.read && (m.toId === currentUser.id || (!m.toId && m.to === currentUser.name))
      ).length;
    }

    if (currentRole !== 'PM' && currentRole !== 'DT') return 0;
    
    let count = 0;
    
    switch (moduleId) {
      case 'travaux':
      case 'interventions':
        // Interventions en attente de validation
        count = (interventions || []).filter(intervention => 
          intervention.status === 'En attente' && 
          intervention.validationLevel < intervention.requiredValidators.length
        ).length;
        break;
        
      case 'budget-ppa':
        // Budgets PPA en attente de validation
        count = (budgetPPA || []).filter(budget => 
          budget.status === 'Non démarré'
        ).length;
        break;
        
      case 'demande-prestation':
        // Demandes de prestation en attente
        count = (demandesPrestation || []).filter(demande => 
          demande.status === 'Transmise' || demande.status === 'En attente de devis'
        ).length;
        break;
        
      case 'documents':
        // Documents en attente de validation (PM uniquement)
        if (currentRole !== 'PM') return 0;
        count = (documents || []).filter(document => 
          document.status === 'En attente'
        ).length;
        break;
        
      default:
        count = 0;
    }
    
    return count;
  };

  const handleUserChange = (userId: string) => {
    switchDemoUser(userId);
  };

  // Composant pour la pastille de validation
  const ValidationBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    
    return (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixe - Design unifié */}
      <div className="w-60 bg-white shadow-lg fixed left-0 top-0 h-full z-10 border-r border-gray-200">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-lg font-bold text-white">Interface.pm</h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">Property Management</p>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          {/* Dashboard fixe en haut */}
          {tabs.filter(tab => tab.id === 'dashboard').map((tab) => {
            const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 mb-2 rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}

          {/* Navigation groupée par univers pour DT et PM */}
          {(currentRole === 'DT' || currentRole === 'PM') && (
            <div className="space-y-4">
              {/* UNIVERS 1 — PATRIMOINE & STRUCTURE */}
              <div>
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    🏢 PATRIMOINE
                  </h3>
                </div>
                {tabs.filter(tab => tab.group === 'PATRIMOINE & STRUCTURE').map((tab) => {
                  const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
                  const pendingCount = getPendingValidations(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                      <ValidationBadge count={pendingCount} />
                    </button>
                  );
                })}
              </div>

              {/* UNIVERS 2 — CONFORMITÉ & ESG */}
              <div>
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    📋 CONFORMITÉ
                  </h3>
                </div>
                {tabs.filter(tab => tab.group === 'CONFORMITÉ & ESG').map((tab) => {
                  const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
                  const pendingCount = getPendingValidations(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                      <ValidationBadge count={pendingCount} />
                    </button>
                  );
                })}
              </div>

              {/* UNIVERS 3 — EXPLOITATION & OPÉRATIONS */}
              <div>
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    🛠 EXPLOITATION
                  </h3>
                </div>
                {tabs.filter(tab => tab.group === 'EXPLOITATION & OPÉRATIONS').map((tab) => {
                  const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
                  const pendingCount = getPendingValidations(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                      <ValidationBadge count={pendingCount} />
                    </button>
                  );
                })}
              </div>

              {/* UNIVERS 4 — FINANCES & PARTENAIRES */}
              <div>
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    💰 FINANCES
                  </h3>
                </div>
                {tabs.filter(tab => tab.group === 'FINANCES & PARTENAIRES').map((tab) => {
                  const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
                  const pendingCount = getPendingValidations(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">{tab.label}</span>
                      <ValidationBadge count={pendingCount} />
                    </button>
                  );
                })}
              </div>
              {/* UNIVERS 5 — ADMINISTRATION (DT uniquement : décisions structurantes) */}
              {currentRole === 'DT' && (
                <div>
                  <div className="px-3 py-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      🔒 ADMINISTRATION
                    </h3>
                  </div>
                  {tabs.filter(tab => tab.group === 'ADMINISTRATION').map((tab) => {
                    const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border-l-3 border-red-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-red-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Navigation simple pour les autres rôles */}
          {(currentRole !== 'DT' && currentRole !== 'PM') && (
            tabs.filter(tab => tab.id !== 'dashboard').map((tab) => {
              const IconComponent = Icons[tab.icon as keyof typeof Icons] as React.ComponentType<any>;
              const pendingCount = getPendingValidations(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-left transition-all duration-200 rounded-lg relative ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-3 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{tab.label}</span>
                  <ValidationBadge count={pendingCount} />
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 ml-60">
        {/* Header fixe */}
        <header className="bg-white/95 shadow-sm border-b border-gray-200 fixed top-0 right-0 left-60 z-10 h-14 backdrop-blur-sm">
          <div className="flex items-center justify-between h-full px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            
            {/* Sélecteur de personne en mode démo — choisir une vraie personne active
                le filtrage par actifs attribués (ex: plusieurs Asset Managers PIMCO/Allianz) */}
            {isDemoMode && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <span className="text-xs text-amber-700 font-semibold">Démo:</span>
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="px-2 py-1 border border-amber-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  <option value="" disabled>Choisir une personne...</option>
                  <optgroup label="Property Manager">
                    {users.filter(u => u.role === 'PM').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.sites?.length || 0} sites)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Directeur Technique">
                    {users.filter(u => u.role === 'DT').map(u => (
                      <option key={u.id} value={u.id}>{u.name} (vue globale)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Propriétaire / Asset Manager">
                    {users.filter(u => u.role === 'Propriétaire').map(u => (
                      <option key={u.id} value={u.id}>{u.name} — {u.mandat} ({u.sites?.length || 0} actifs)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Prestataire">
                    {users.filter(u => u.role === 'Prestataire').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Zone de contenu scrollable */}
        <main className="pt-14 p-6 min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}