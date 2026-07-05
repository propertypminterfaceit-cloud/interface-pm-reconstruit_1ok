export interface FeeTier {
  min: number;
  max: number | null; // null = dernier palier automatique du barème
  rate: number; // en %
}

export interface FeeSchedule {
  mandat: string;
  tiers: FeeTier[];
}

// Barèmes par défaut, utilisés uniquement pour initialiser les données de démo.
// Une fois l'app lancée, ce sont les barèmes stockés dans le store (modifiables
// par le DT depuis l'écran Honoraires) qui font foi — pas cette constante.
export const FEE_SCHEDULES: FeeSchedule[] = [
  {
    mandat: 'PIMCO',
    tiers: [
      { min: 15000, max: 100000, rate: 4 },
      { min: 100000, max: 300000, rate: 3 },
      { min: 300000, max: null, rate: 2 }
    ]
  },
  {
    mandat: 'Allianz',
    tiers: [
      { min: 15000, max: 100000, rate: 3.5 },
      { min: 100000, max: 250000, rate: 2.5 },
      { min: 250000, max: null, rate: 1.5 }
    ]
  }
];

export interface FeeCalculationResult {
  feeAmount: number;
  breakdown: { min: number; max: number | null; rate: number; taxableAmount: number; fee: number }[];
  negotiatedAboveAmount?: number; // montant au-delà du dernier palier défini, hors calcul auto
}

/**
 * Calcule les honoraires PM d'un chantier selon un barème par paliers
 * progressifs (comme un barème d'impôt) : chaque tranche du montant est
 * rémunérée à son propre taux. Sous le premier seuil, pas d'honoraires.
 * Au-delà du dernier palier défini dans le barème, le surplus n'est pas
 * calculé automatiquement — il relève d'une négociation de gré à gré.
 */
export function computeChantierFee(amount: number, schedule: FeeSchedule): FeeCalculationResult {
  const breakdown: FeeCalculationResult['breakdown'] = [];
  let remaining = amount;
  let feeAmount = 0;
  let negotiatedAboveAmount: number | undefined;

  for (const tier of schedule.tiers) {
    if (amount <= tier.min) break;

    const tierCeiling = tier.max ?? amount; // dernier palier : va jusqu'au montant réel s'il n'y a pas de max
    const taxableAmount = Math.max(0, Math.min(amount, tierCeiling) - tier.min);

    if (taxableAmount > 0) {
      const fee = (taxableAmount * tier.rate) / 100;
      feeAmount += fee;
      breakdown.push({ min: tier.min, max: tier.max, rate: tier.rate, taxableAmount, fee });
    }

    if (tier.max !== null && amount > tier.max) {
      remaining = amount - tier.max;
    } else {
      remaining = 0;
    }
  }

  const lastTier = schedule.tiers[schedule.tiers.length - 1];
  if (lastTier && lastTier.max !== null && amount > lastTier.max) {
    negotiatedAboveAmount = amount - lastTier.max;
  }

  return { feeAmount, breakdown, negotiatedAboveAmount };
}

export function getFeeScheduleForMandat(mandat: string | undefined): FeeSchedule | undefined {
  if (!mandat) return undefined;
  return FEE_SCHEDULES.find(s => s.mandat === mandat);
}
