import { GEAR_DB, GACHA_RATES, type GearPart, type Rarity } from './outfits'

export interface GachaResult {
  part: GearPart
  isNew: boolean
  refundPoints?: number
}

/**
 * Rolls for a random gear part based on rarity probabilities
 */
export function rollGacha(unlockedIds: string[]): GachaResult {
  const rand = Math.random() * 100
  let selectedRarity: Rarity = 'common'

  if (rand < GACHA_RATES.legendary) {
    selectedRarity = 'legendary'
  } else if (rand < GACHA_RATES.legendary + GACHA_RATES.epic) {
    selectedRarity = 'epic'
  } else if (rand < GACHA_RATES.legendary + GACHA_RATES.epic + GACHA_RATES.rare) {
    selectedRarity = 'rare'
  } else {
    selectedRarity = 'common'
  }

  // Filter pool by rarity
  const pool = GEAR_DB.filter(p => p.rarity === selectedRarity && p.id !== 'head_none' && p.id !== 'acc_none')
  
  // Fallback if rarity pool is empty (shouldn't happen with our DB)
  const finalPool = pool.length > 0 ? pool : GEAR_DB.filter(p => p.rarity === 'common')
  
  const selectedPart = finalPool[Math.floor(Math.random() * finalPool.length)]
  const isNew = !unlockedIds.includes(selectedPart.id)

  let refundPoints = 0
  if (!isNew) {
    // Duplicate refund policy
    const refunds: Record<Rarity, number> = {
      common: 50,
      rare: 100,
      epic: 300,
      legendary: 1000
    }
    refundPoints = refunds[selectedPart.rarity]
  }

  return {
    part: selectedPart,
    isNew,
    refundPoints
  }
}
