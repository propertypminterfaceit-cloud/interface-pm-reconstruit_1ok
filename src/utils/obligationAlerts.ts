import { Obligation, Document } from '../types';

export interface ObligationAlert {
  id: string;
  obligationId: string;
  siteId?: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Calcule les alertes réelles issues des obligations actives de type
 * "Fréquence" (échéance récurrente, ex: reporting mensuel) et "Documentaire"
 * (preuve attendue) — jusqu'ici ces obligations n'étaient que du texte
 * affiché, sans effet concret. Cette fonction les rend réellement actives :
 * si l'échéance est dépassée ou la preuve manquante, une alerte apparaît.
 */
export function computeObligationAlerts(obligations: Obligation[], documents: Document[]): ObligationAlert[] {
  const alerts: ObligationAlert[] = [];
  const now = Date.now();

  (obligations || []).forEach(o => {
    if (o.status !== 'Active') return;

    if (o.ruleType === 'Frequence' && o.params.frequencyDays) {
      const lastDate = o.avancementUpdatedAt || o.validatedAt || o.createdAt;
      const lastTimestamp = lastDate ? parseFrDate(lastDate) : null;
      if (lastTimestamp) {
        const nextDue = lastTimestamp + o.params.frequencyDays * 86400000;
        if (now > nextDue) {
          const daysLate = Math.floor((now - nextDue) / 86400000);
          alerts.push({
            id: `obl-freq-${o.id}`,
            obligationId: o.id,
            siteId: o.siteId,
            message: `${o.title} (${o.sourceLabel}) — échéance dépassée de ${daysLate} jour${daysLate > 1 ? 's' : ''}`,
            severity: daysLate > 15 ? 'high' : 'medium'
          });
        }
      }
    }

    if (o.ruleType === 'ObligationDocumentaire' && o.params.documentType) {
      const since = o.createdAt ? parseFrDate(o.createdAt) : 0;
      const hasProof = (documents || []).some(d =>
        d.type === o.params.documentType &&
        (!o.siteId || d.siteId === o.siteId) &&
        new Date(d.uploadDate).getTime() >= (since || 0)
      );
      if (!hasProof) {
        alerts.push({
          id: `obl-doc-${o.id}`,
          obligationId: o.id,
          siteId: o.siteId,
          message: `${o.title} (${o.sourceLabel}) — preuve documentaire attendue non fournie`,
          severity: 'medium'
        });
      }
    }
  });

  return alerts;
}

// Parse une date au format 'JJ/MM/AAAA HH:MM:SS' ou une date ISO, retourne un timestamp
function parseFrDate(value: string): number | null {
  const frMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    return new Date(`${year}-${month}-${day}`).getTime();
  }
  const parsed = new Date(value).getTime();
  return isNaN(parsed) ? null : parsed;
}
