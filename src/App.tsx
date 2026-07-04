import React from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Sites from './components/Sites';
import Conformite from './components/Conformite';
import Interventions from './components/Interventions';
import Prestataires from './components/Prestataires';
import Documents from './components/Documents';
import BudgetPPA from './components/BudgetPPA';
import Sinistres from './components/Sinistres';
import ESG from './components/ESG';
import Energie from './components/Energie';
import Alertes from './components/Alertes';
import Equipe from './components/Equipe';
import Connexion from './components/Connexion';
import Travaux from './components/Travaux';
import DemandePrestation from './components/DemandePrestation';
import { ErrorBoundary } from './components/ErrorBoundary';

// Zustand + persist hydrate le store de façon synchrone au premier rendu
// (contrairement à un vrai appel réseau) : il n'y a donc rien à "attendre".
// S'il n'y a exceptionnellement aucune donnée (storage vidé/corrompu), on
// régénère les données de démo une seule fois plutôt que de rester bloqué
// sur un écran de chargement.
function ensureStoreIsPopulated() {
  const state = useStore.getState();
  if (!state.sites || state.sites.length === 0) {
    useStore.persist.clearStorage();
    window.location.reload();
    return false;
  }
  return true;
}

function App() {
  const { activeTab } = useStore();

  const isReady = ensureStoreIsPopulated();
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Réinitialisation des données de démonstration...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sites':
        return <Sites />;
      case 'conformite':
        return <Conformite />;
      case 'interventions':
        return <Interventions />;
      case 'prestataires':
        return <Prestataires />;
      case 'documents':
        return <Documents />;
      case 'budget-ppa':
        return <BudgetPPA />;
      case 'sinistres':
        return <Sinistres />;
      case 'esg':
        return <ESG />;
      case 'energie':
        return <Energie />;
      case 'alertes':
        return <Alertes />;
      case 'equipe':
        return <Equipe />;
      case 'connexion':
        return <Connexion />;
      case 'travaux':
        return <Travaux />;
      case 'demande-prestation':
        return <DemandePrestation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {/* Un plantage dans un module ne casse plus toute l'application :
         on retombe sur un message d'erreur circonscrit a cet ecran. */}
      <ErrorBoundary key={activeTab}>
        {renderContent()}
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
