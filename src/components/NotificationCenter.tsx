import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Bell, AlertTriangle, CheckSquare, MessageCircle, X } from 'lucide-react';
import { filterSitesByUser } from '../utils/permissions';
import { computeObligationAlerts } from '../utils/obligationAlerts';

interface NotificationItem {
  id: string;
  kind: 'alerte' | 'validation' | 'message';
  label: string;
  moduleId: string;
  severity?: 'low' | 'medium' | 'high';
  onClick: () => void;
}

interface NotificationCenterProps {
  onNavigate: (tabId: string) => void;
}

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const {
    alerts, sites, currentRole, currentUser, messages,
    interventions, budgetPPA, demandesPrestation, documents,
    markAlertAsRead, obligations
  } = useStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le panneau au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleSiteIds = new Set(filterSitesByUser(currentUser, currentRole, sites).map(s => s.id));

  // 1. Alertes non lues, restreintes au périmètre visible
  const alertItems: NotificationItem[] = (alerts || [])
    .filter(a => !a.read && (!a.siteId || visibleSiteIds.has(a.siteId)))
    .map(a => ({
      id: `alerte-${a.id}`,
      kind: 'alerte',
      label: a.message,
      moduleId: 'alertes',
      severity: a.severity,
      onClick: () => { markAlertAsRead(a.id); onNavigate('alertes'); setOpen(false); }
    }));

  // 1bis. Alertes issues des obligations (échéances dépassées, preuves manquantes)
  const obligationAlertItems: NotificationItem[] = computeObligationAlerts(obligations || [], documents || [])
    .filter(a => !a.siteId || visibleSiteIds.has(a.siteId))
    .map(a => ({
      id: `obl-${a.id}`,
      kind: 'alerte',
      label: a.message,
      moduleId: 'alertes',
      severity: a.severity,
      onClick: () => { onNavigate('alertes'); setOpen(false); }
    }));

  // 2. Validations en attente (PM/DT uniquement, cohérent avec le reste de l'app)
  const validationItems: NotificationItem[] = [];
  if (currentRole === 'PM' || currentRole === 'DT') {
    const pendingTravaux = (interventions || []).filter(i =>
      i.status === 'En attente' && i.validationLevel < i.requiredValidators.length
    ).length;
    if (pendingTravaux > 0) {
      validationItems.push({
        id: 'val-travaux', kind: 'validation', moduleId: 'travaux',
        label: `${pendingTravaux} validation${pendingTravaux > 1 ? 's' : ''} en attente — Travaux`,
        onClick: () => { onNavigate('travaux'); setOpen(false); }
      });
    }
    const pendingPPA = (budgetPPA || []).filter(b => b.status === 'Non démarré').length;
    if (pendingPPA > 0) {
      validationItems.push({
        id: 'val-ppa', kind: 'validation', moduleId: 'budget-ppa',
        label: `${pendingPPA} demande${pendingPPA > 1 ? 's' : ''} CAPEX à valider`,
        onClick: () => { onNavigate('budget-ppa'); setOpen(false); }
      });
    }
    const pendingDemandes = (demandesPrestation || []).filter(d =>
      d.status === 'Transmise' || d.status === 'En attente de devis'
    ).length;
    if (pendingDemandes > 0) {
      validationItems.push({
        id: 'val-demande', kind: 'validation', moduleId: 'demande-prestation',
        label: `${pendingDemandes} demande${pendingDemandes > 1 ? 's' : ''} de prestation en attente`,
        onClick: () => { onNavigate('demande-prestation'); setOpen(false); }
      });
    }
    if (currentRole === 'PM') {
      const pendingDocs = (documents || []).filter(d => d.status === 'En attente').length;
      if (pendingDocs > 0) {
        validationItems.push({
          id: 'val-docs', kind: 'validation', moduleId: 'documents',
          label: `${pendingDocs} document${pendingDocs > 1 ? 's' : ''} en attente de validation`,
          onClick: () => { onNavigate('documents'); setOpen(false); }
        });
      }
    }
  }

  // 3. Messages non lus, agrégés (pas détaillés par contact ici, juste le total)
  const unreadMessagesCount = currentUser
    ? (messages || []).filter(m => !m.read && (m.toId === currentUser.id || (!m.toId && m.to === currentUser.name))).length
    : 0;
  const messageItems: NotificationItem[] = unreadMessagesCount > 0 ? [{
    id: 'messages', kind: 'message', moduleId: 'messagerie',
    label: `${unreadMessagesCount} message${unreadMessagesCount > 1 ? 's' : ''} non lu${unreadMessagesCount > 1 ? 's' : ''}`,
    onClick: () => { onNavigate('messagerie'); setOpen(false); }
  }] : [];

  const allItems = [...alertItems, ...obligationAlertItems, ...validationItems, ...messageItems];
  const total = allItems.length;

  const iconFor = (kind: NotificationItem['kind']) => {
    if (kind === 'alerte') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    if (kind === 'validation') return <CheckSquare className="w-4 h-4 text-orange-500 flex-shrink-0" />;
    return <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px]">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {allItems.length === 0 ? (
            <p className="text-sm text-gray-400 p-4 text-center">Rien à signaler pour le moment.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {allItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-2"
                >
                  {iconFor(item.kind)}
                  <span className="text-sm text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
