import type { DailyMeals } from './types'

// A pool of pre-generated high-quality meal plans for typical profiles
export const RECIPE_POOL: DailyMeals[] = [
  {
    date: '2026-01-01', // Date is a placeholder
    targetCalories: 2000,
    targetProtein: 150,
    breakfast: {
      name: '蛋白粉燕麥粥碗',
      cookingTime: 12,
      calories: 450,
      protein: 35,
      carbs: 55,
      fat: 10,
      ingredients: ['大燕麥片 60g', '乳清蛋白粉 1勺', '奇亞籽 10g', '藍莓 50g'],
      steps: ['燕麥加水或牛奶加熱', '攪入蛋白粉', '灑上配料'],
      imagePrompt: 'A beautiful protein oatmeal bowl with blueberries and chia seeds, soft lighting, food photography'
    },
    lunch: {
      name: '蒜香煎雞胸肉配糙米飯',
      cookingTime: 25,
      calories: 650,
      protein: 55,
      carbs: 70,
      fat: 12,
      ingredients: ['雞胸肉 200g', '糙米 150g', '西蘭花 100g', '橄欖油 5ml'],
      isTakeout: false,
      steps: ['雞胸肉煎熟', '糙米飯蒸熟', '西蘭花燙熟'],
      imagePrompt: 'Grilled chicken breast with garlic, served with brown rice and broccoli, macro shot'
    },
    dinner: {
      name: '清蒸魚片配紅薯',
      cookingTime: 15,
      calories: 550,
      protein: 45,
      carbs: 60,
      fat: 8,
      ingredients: ['鯛魚片 200g', '紅薯 200g', '時令青菜 150g'],
      steps: ['魚片加薑絲清蒸', '紅薯蒸熟'],
      imagePrompt: 'Steamed fish fillet with ginger and scallions, served with sweet potato slices'
    }
  },
  {
    date: '2026-01-01',
    targetCalories: 1600,
    targetProtein: 120,
    breakfast: {
      name: '希臘優格配堅果',
      cookingTime: 5,
      calories: 350,
      protein: 28,
      carbs: 30,
      fat: 12,
      ingredients: ['希臘優格 200g', '綜合堅果 15g', '草莓 80g'],
      steps: ['將優格放入碗中', '撒上堅果與水果'],
      imagePrompt: 'Greek yogurt topped with nuts and strawberries in a glass bowl'
    },
    lunch: {
      name: '香港茶餐廳：切雞飯 (去皮+薑蓉少油)',
      cookingTime: 0,
      calories: 550,
      protein: 40,
      carbs: 75,
      fat: 12,
      isTakeout: true,
      whereToGet: '任何燒味店 (請備註去皮、薑蓉分開)',
      ingredients: ['白切雞 (去皮)', '白飯 (少份量)', '菜心'],
      steps: ['選擇無皮切雞', '減少米飯量'],
      imagePrompt: 'HK style white cut chicken rice with green vegetables, restaurant quality'
    },
    dinner: {
      name: '牛肉蔬菜沙拉',
      cookingTime: 20,
      calories: 450,
      protein: 35,
      carbs: 30,
      fat: 18,
      ingredients: ['瘦牛肉片 150g', '綜合生菜 200g', '小番茄 10個', '油醋汁'],
      steps: ['牛肉片快速汆燙或輕煎', '混合食材淋上油醋'],
      imagePrompt: 'Medium rare beef slices over a colorful garden salad'
    }
  }
]

export function findPoolMatch(targetCal: number, targetPro: number): DailyMeals | null {
  // Find a meal plan within 10% calorie variance and 5% protein variance
  return RECIPE_POOL.find(p => 
    Math.abs(p.targetCalories - targetCal) / targetCal < 0.1 &&
    Math.abs(p.targetProtein - targetPro) / targetPro < 0.1
  ) || null
}
