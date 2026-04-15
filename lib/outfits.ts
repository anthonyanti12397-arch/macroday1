export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type GearSlot = 'head' | 'top' | 'bottom' | 'accessory'

export interface GearPart {
  id: string
  slot: GearSlot
  nameZh: string
  nameEn: string
  rarity: Rarity
  colors?: { primary: string; secondary?: string }
}

// Gear Parts Database
export const GEAR_DB: GearPart[] = [
  // HEAD
  { id: 'head_none', slot: 'head', nameZh: '無配件', nameEn: 'None', rarity: 'common' },
  { id: 'head_cap_white', slot: 'head', nameZh: '白鴨舌帽', nameEn: 'White Cap', rarity: 'common', colors: { primary: '#FFFFFF' } },
  { id: 'head_cap_black', slot: 'head', nameZh: '黑鴨舌帽', nameEn: 'Black Cap', rarity: 'common', colors: { primary: '#1E293B' } },
  { id: 'head_sweatband_blue', slot: 'head', nameZh: '運動頭帶', nameEn: 'Sports Headband', rarity: 'common', colors: { primary: '#3B82F6' } },
  { id: 'head_glasses_sport', slot: 'head', nameZh: '運動墨鏡', nameEn: 'Sport Shades', rarity: 'rare', colors: { primary: '#334155' } },
  { id: 'head_headband_red', slot: 'head', nameZh: '熱血頭帶', nameEn: 'Red Headband', rarity: 'rare', colors: { primary: '#EF4444' } },
  { id: 'head_beanie_gray', slot: 'head', nameZh: '運動毛帽', nameEn: 'Beanie', rarity: 'common', colors: { primary: '#64748B' } },
  { id: 'head_headphones', slot: 'head', nameZh: '無線耳機', nameEn: 'Gym Headphones', rarity: 'epic', colors: { primary: '#333333', secondary: '#0F9E75' } },
  { id: 'head_visor_neon', slot: 'head', nameZh: '霓虹遮陽帽', nameEn: 'Neon Visor', rarity: 'epic', colors: { primary: '#A855F7' } },
  { id: 'head_crown', slot: 'head', nameZh: '冠軍皇冠', nameEn: 'Champion Crown', rarity: 'legendary', colors: { primary: '#FFD700', secondary: '#F59E0B' } },
  { id: 'head_pathfinder_hat', slot: 'head', nameZh: '探險者大帽', nameEn: 'Pathfinder Hat', rarity: 'rare', colors: { primary: '#8B4513' } },

  // TOPS
  { id: 'top_basic_white', slot: 'top', nameZh: '基礎白 T', nameEn: 'Basic White T', rarity: 'common', colors: { primary: '#FFFFFF' } },
  { id: 'top_tank_black', slot: 'top', nameZh: '黑色背心', nameEn: 'Black Tank', rarity: 'common', colors: { primary: '#1E293B', secondary: '#334155' } },
  { id: 'top_tank_red', slot: 'top', nameZh: '烈焰背心', nameEn: 'Red Tank', rarity: 'common', colors: { primary: '#EF4444' } },
  { id: 'top_compression_blue', slot: 'top', nameZh: '緊身訓練衣', nameEn: 'Compression Top', rarity: 'rare', colors: { primary: '#2563EB' } },
  { id: 'top_hoodie_teal', slot: 'top', nameZh: '經典綠連帽', nameEn: 'Teal Hoodie', rarity: 'rare', colors: { primary: '#0F9E75', secondary: '#065F46' } },
  { id: 'top_windbreaker_pro', slot: 'top', nameZh: '專業風衣', nameEn: 'Pro Windbreaker', rarity: 'rare', colors: { primary: '#10B981' } },
  { id: 'top_jacket_galaxy', slot: 'top', nameZh: '星河夾克', nameEn: 'Galaxy Jacket', rarity: 'epic', colors: { primary: '#7C3AED', secondary: '#4C1D95' } },
  { id: 'top_zen_robe', slot: 'top', nameZh: '禪師道袍', nameEn: 'Zen Robe', rarity: 'epic', colors: { primary: '#F1F5F9', secondary: '#CBD5E1' } },
  { id: 'top_armor_gold', slot: 'top', nameZh: '奧林匹亞護甲', nameEn: 'Olympia Armor', rarity: 'legendary', colors: { primary: '#F59E0B', secondary: '#92400E' } },
  { id: 'top_pathfinder_tunic', slot: 'top', nameZh: '探險者束腰披肩', nameEn: 'Pathfinder Tunic', rarity: 'rare', colors: { primary: '#A0522D' } },

  // BOTTOMS
  { id: 'bottom_sweats_gray', slot: 'bottom', nameZh: '灰色棉褲', nameEn: 'Gray Sweats', rarity: 'common', colors: { primary: '#E2E8F0' } },
  { id: 'bottom_shorts_black', slot: 'bottom', nameZh: '黑色短褲', nameEn: 'Black Shorts', rarity: 'common', colors: { primary: '#0F172A' } },
  { id: 'bottom_tights_black', slot: 'bottom', nameZh: '緊身束褲', nameEn: 'Compression Tights', rarity: 'rare', colors: { primary: '#1E293B' } },
  { id: 'bottom_tights_blue', slot: 'bottom', nameZh: '壓縮束褲', nameEn: 'Blue Tights', rarity: 'rare', colors: { primary: '#1D4ED8', secondary: '#1E3A8A' } },
  { id: 'bottom_leggings_neon', slot: 'bottom', nameZh: '霓虹運動褲', nameEn: 'Neon Leggings', rarity: 'rare', colors: { primary: '#EC4899' } },
  { id: 'bottom_pants_galaxy', slot: 'bottom', nameZh: '星河流汗褲', nameEn: 'Galaxy Pants', rarity: 'epic', colors: { primary: '#4C1D95' } },
  { id: 'bottom_cyber_harem', slot: 'bottom', nameZh: '賽博束口褲', nameEn: 'Cyber Joggers', rarity: 'epic', colors: { primary: '#0F172A', secondary: '#0F9E75' } },
  { id: 'bottom_champion', slot: 'bottom', nameZh: '冠軍戰裙', nameEn: 'Champion Greaves', rarity: 'legendary', colors: { primary: '#92400E', secondary: '#FFD700' } },
  { id: 'bottom_pathfinder_boots', slot: 'bottom', nameZh: '探險者長靴', nameEn: 'Pathfinder Boots', rarity: 'rare', colors: { primary: '#5D4037' } },

  // ACCESSORY
  { id: 'acc_none', slot: 'accessory', nameZh: '無特效', nameEn: 'None', rarity: 'common' },
  { id: 'acc_shaker', slot: 'accessory', nameZh: '乳清搖搖杯', nameEn: 'Protein Shaker', rarity: 'rare' },
  { id: 'acc_belt_pro', slot: 'accessory', nameZh: '專業護腰帶', nameEn: 'Lifting Belt', rarity: 'rare', colors: { primary: '#450a0a' } },
  { id: 'acc_smart_watch', slot: 'accessory', nameZh: '運動智慧錶', nameEn: 'Smart Watch', rarity: 'rare', colors: { primary: '#0F9E75' } },
  { id: 'acc_towel_white', slot: 'accessory', nameZh: '健身毛巾', nameEn: 'Gym Towel', rarity: 'common', colors: { primary: '#F8FAFC' } },
  { id: 'acc_flame', slot: 'accessory', nameZh: '燃脂光環', nameEn: 'Burn Aura', rarity: 'epic', colors: { primary: '#EF4444' } },
  { id: 'acc_ice_aura', slot: 'accessory', nameZh: '寒冰光環', nameEn: 'Ice Aura', rarity: 'epic', colors: { primary: '#3B82F6' } },
  { id: 'acc_lightning', slot: 'accessory', nameZh: '肌肉閃電', nameEn: 'Lightning Aura', rarity: 'legendary', colors: { primary: '#FFD700' } },
  { id: 'acc_pathfinder_staff', slot: 'accessory', nameZh: '旅行者法杖', nameEn: 'Pathfinder Staff', rarity: 'rare', colors: { primary: '#8B4513' } },
]

export const RARITY_COLORS = {
  common: '#94A3B8',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
}

export const GACHA_RATES = {
  common: 70,    // 70%
  rare: 24.9,    // 24.9%
  epic: 5,       // 5%
  legendary: 0.1 // 0.1%
}
