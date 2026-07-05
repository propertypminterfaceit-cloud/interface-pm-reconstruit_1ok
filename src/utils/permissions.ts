import { User, Site } from '../types';

/**
 * Retourne la liste des IDs de sites visibles pour l'utilisateur/rôle courant.
 *
 * Règle : DT voit tout le patrimoine (vue consolidée). PM et Propriétaire
 * (Asset Manager) ne voient que les sites qui leur sont explicitement
 * attribués (user.sites) — c'est cette règle qui permet de représenter
 * plusieurs Asset Managers (ex: PIMCO, Allianz) gérant chacun une partie
 * distincte d'un même patrimoine.
 *
 * Le Prestataire garde pour l'instant son comportement existant (géré
 * séparément par module), non modifié dans ce lot.
 */
export function getVisibleSiteIds(currentUser: User | null, currentRole: string, allSites: Site[]): string[] {
  if (currentRole === 'DT') {
    return allSites.map(s => s.id);
  }
  if (currentUser && (currentRole === 'PM' || currentRole === 'Propriétaire')) {
    return currentUser.sites || [];
  }
  // Pas d'utilisateur démo précis sélectionné (ancien comportement / rôle non concerné) :
  // on ne restreint pas, pour ne pas casser un affichage existant non couvert par ce lot.
  return allSites.map(s => s.id);
}

export function filterSitesByUser(currentUser: User | null, currentRole: string, allSites: Site[]): Site[] {
  const visibleIds = new Set(getVisibleSiteIds(currentUser, currentRole, allSites));
  return allSites.filter(s => visibleIds.has(s.id));
}

/**
 * Filtre générique pour toute entité métier possédant un siteId, selon les
 * sites visibles par l'utilisateur/rôle courant.
 */
export function filterBySiteAccess<T extends { siteId?: string }>(
  items: T[],
  currentUser: User | null,
  currentRole: string,
  allSites: Site[]
): T[] {
  const visibleIds = new Set(getVisibleSiteIds(currentUser, currentRole, allSites));
  return items.filter(item => !item.siteId || visibleIds.has(item.siteId));
}
