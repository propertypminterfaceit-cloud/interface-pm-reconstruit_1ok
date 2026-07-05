import { Document } from '../types';

export type DataRoomCategory = 'Réglementaire' | 'Maintenance' | 'Contrats prestataires' | 'Suivi ESG' | 'Non classé';

/**
 * Classe automatiquement un document dans une catégorie de data room, à partir
 * de son type existant — pas besoin que l'utilisateur choisisse une catégorie
 * manuellement à chaque upload, le classement se fait tout seul.
 */
export function getDataRoomCategory(type: Document['type']): DataRoomCategory {
  switch (type) {
    case 'RMA':
    case 'RME':
    case 'Conformité':
    case 'Sinistres':
      return 'Réglementaire';
    case 'Interventions':
    case 'PPA':
      return 'Maintenance';
    case 'Contrats':
      return 'Contrats prestataires';
    case 'ESG':
      return 'Suivi ESG';
    default:
      return 'Non classé';
  }
}

export const DATA_ROOM_CATEGORIES: DataRoomCategory[] = [
  'Réglementaire',
  'Maintenance',
  'Contrats prestataires',
  'Suivi ESG',
  'Non classé'
];
