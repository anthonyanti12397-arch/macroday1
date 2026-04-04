export type Lang = 'en' | 'zh'

export interface Translations {
  greeting: (h: number) => string
  nav: { home: string; inbody: string; meals: string; shop: string }
  btn: { todayMeals: string; weekPlan: string; regenerate: string; generating: string; getStarted: string; save: string; generate: string; saveChanges: string }
  dashboard: { targets: string; todayMeals: string; dayTotal: string; emptyTitle: string; emptyDesc: string; noDataTitle: string; noDataDesc: string; styleLabel: string }
  inbody: { title: string; subtitle: string; updateData: string; addData: string; basicInfo: string; required: string; weight: string; height: string; age: string; gender: string; male: string; female: string; inbodySection: string; inbodyOptional: string; inbodyHint: string; bodyFat: string; muscle: string; bmr: string; visceralFat: string; bodyWater: string; cookingStyle: string; proteinPrefs: string; carbPrefs: string; cuisinePrefs: string; cuisineOptional: string; goal: string; restrictions: string; proteinOptional: string; carbOptional: string; saved: string; history: string; viewCharts: string; chartsDesc: string }
  mealPlan: { title: string; tabToday: string; tabWeek: string; noData: string; noDataDesc: string; proRequired: string; noBodyData: string; noBodyDataDesc: string; addData: string; todayEmpty: string; todayEmptyDesc: string }
  shopping: { title: string; noList: string; noListDesc: string; goMealPlan: string; noItems: string; fromPlan: string; items: string; checkedOff: string; copy: string; copied: string; clear: string }
  meal: { breakfast: string; lunch: string; dinner: string; snack: string; showRecipe: string; hideRecipe: string; moreInfo: string; ingredients: string; steps: string; generatingImage: string; takeout: string; homeCook: string; protein: string; carbs: string; fat: string }
  upgrade: { title: string; desc: string; feature1: string; feature2: string; feature3: string; feature4: string; btn: string; later: string }
  settings: { title: string; accountSection: string; guestBadge: string; guestIdLabel: string; langSection: string; fitnessSection: string; currentGoal: string; editBodyData: string; appSection: string; appearance: string; notifications: string; comingSoon: string; proSection: string; proActive: string; upgradeBtn: string; upgradeDesc: string; logoutBtn: string; logoutDesc: string; confirmLogout: string; cancel: string; goalLabels: Record<string, string> }
  cookingStyle: { home: string; takeout: string; both: string }
  categories: { protein: string; vegetables: string; carbs: string; dairy: string; condiments: string; other: string }
}

const en: Translations = {
  greeting: (h: number) =>
    h >= 5 && h < 12 ? 'Good morning'
    : h < 17 ? 'Good afternoon'
    : h < 21 ? 'Good evening'
    : 'Good night',
  nav: {
    home: 'Dashboard', inbody: 'InBody', meals: 'Meal Plan', shop: 'Shopping',
  },
  btn: {
    todayMeals: "Today's Meals", weekPlan: 'Week Plan',
    regenerate: 'Regenerate', generating: 'Generating…', getStarted: 'Get Started',
    save: 'Save Data', generate: 'Generate', saveChanges: 'Save',
  },
  dashboard: {
    targets: 'Daily Targets', todayMeals: "Today's Meals", dayTotal: 'Day Total',
    emptyTitle: 'Ready to fuel your day?',
    emptyDesc: 'Tap "Today\'s Meals" to get your personalised breakfast, lunch & dinner.',
    noDataTitle: 'Set up your profile',
    noDataDesc: 'Add your body data to unlock personalised AI meal plans.',
    styleLabel: 'Style',
  },
  inbody: {
    title: 'InBody Tracker',
    subtitle: 'Log your body data to personalise your meal plans.',
    updateData: 'Update Data', addData: 'Add Your Data',
    basicInfo: 'Basic Info', required: '*',
    weight: 'Weight (kg)', height: 'Height (cm)', age: 'Age', gender: 'Gender',
    male: 'Male', female: 'Female',
    inbodySection: 'InBody Data',
    inbodyOptional: '(optional — fill in what you have)',
    inbodyHint: "Leave blank if your machine doesn't show these values. We'll estimate what's missing.",
    bodyFat: 'Body Fat (%)', muscle: 'Skeletal Muscle (kg)', bmr: 'BMR (kcal)',
    visceralFat: 'Visceral Fat (1–20)', bodyWater: 'Body Water (%)',
    cookingStyle: 'Cooking Style', proteinPrefs: 'Protein Preferences',
    carbPrefs: 'Carb Preferences',
    cuisinePrefs: 'Cuisine Style', cuisineOptional: 'Select all that apply (optional)',
    goal: 'Goal', restrictions: 'Dietary Restrictions',
    proteinOptional: 'Select all you like (optional)',
    carbOptional: 'Select all you like (optional)',
    saved: 'Saved!', history: 'History',
    viewCharts: 'View Progress Charts', chartsDesc: 'Weight, body fat & muscle trends',
  },
  mealPlan: {
    title: 'Meal Plan', tabToday: 'Today', tabWeek: 'This Week',
    noData: 'No meal plan yet',
    noDataDesc: 'Click Generate to create your personalised 7-day plan.',
    proRequired: 'Pro plan required. Click Generate to upgrade.',
    noBodyData: 'No body data yet',
    noBodyDataDesc: 'Add your InBody data first to generate a personalised meal plan.',
    addData: 'Add InBody Data',
    todayEmpty: 'Ready to fuel your day?',
    todayEmptyDesc: "Tap Generate to get your personalised breakfast, lunch & dinner.",
  },
  shopping: {
    title: 'Shopping List', noList: 'No list yet',
    noListDesc: 'Generate a weekly meal plan first to get your shopping list.',
    goMealPlan: 'Go to Meal Plan', noItems: 'No items in your shopping list.',
    fromPlan: 'From meal plan on',
    items: 'items', checkedOff: 'checked off', copy: 'Copy', copied: 'Copied!', clear: 'Clear',
  },
  meal: {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
    showRecipe: 'Show recipe', hideRecipe: 'Hide', moreInfo: 'More info',
    ingredients: 'Ingredients', steps: 'Steps',
    generatingImage: 'Generating image…',
    takeout: 'Takeout', homeCook: 'Home cook',
    protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
  },
  upgrade: {
    title: 'Upgrade to Pro',
    desc: 'Unlock unlimited AI-powered meal planning.',
    feature1: 'Unlimited recipe & week-plan generations',
    feature2: 'Full 7-day meal plan with one click',
    feature3: 'Auto-generated & copyable shopping list',
    feature4: 'Progress charts & body tracking',
    btn: 'Upgrade to Pro — HK$38/month',
    later: 'Maybe later',
  },
  settings: {
    title: 'Profile & Settings', accountSection: 'Account',
    guestBadge: 'Guest', guestIdLabel: 'Guest ID',
    langSection: 'Language', fitnessSection: 'Fitness',
    currentGoal: 'Current Goal', editBodyData: 'Edit Body Data',
    appSection: 'App', appearance: 'Appearance', notifications: 'Notifications',
    comingSoon: 'Coming soon', proSection: 'Pro Plan', proActive: 'Active',
    upgradeBtn: 'Upgrade to Pro', upgradeDesc: 'Unlock unlimited meals & charts',
    logoutBtn: 'Log Out', logoutDesc: "You'll return to the login screen.",
    confirmLogout: 'Confirm Log Out', cancel: 'Cancel',
    goalLabels: { muscle_gain: 'Muscle Gain', fat_loss: 'Fat Loss', maintain: 'Maintain' } as Record<string, string>,
  },
  cookingStyle: { home: 'Home Cook', takeout: 'Takeout', both: 'Both' },
  categories: {
    protein: 'Protein', vegetables: 'Vegetables', carbs: 'Carbs',
    dairy: 'Dairy', condiments: 'Condiments', other: 'Other',
  },
}

const zh: Translations = {
  greeting: (h: number) =>
    h >= 5 && h < 12 ? '早晨'
    : h < 17 ? '下午好'
    : h < 21 ? '晚上好'
    : '夜深了',
  nav: {
    home: '主頁', inbody: 'InBody', meals: '餐單', shop: '購物',
  },
  btn: {
    todayMeals: '今日三餐', weekPlan: '週計劃',
    regenerate: '重新生成', generating: '生成中…', getStarted: '立即開始',
    save: '儲存資料', generate: '生成', saveChanges: '儲存',
  },
  dashboard: {
    targets: '每日目標', todayMeals: '今日三餐', dayTotal: '全日總計',
    emptyTitle: '準備好燃燒今天了嗎？',
    emptyDesc: '點擊「今日三餐」獲取個人化早午晚餐建議',
    noDataTitle: '設定個人資料',
    noDataDesc: '新增身體數據，解鎖 AI 個人化餐單',
    styleLabel: '風格',
  },
  inbody: {
    title: 'InBody 追蹤',
    subtitle: '輸入身體數據，讓 AI 生成個人化餐單',
    updateData: '更新數據', addData: '新增數據',
    basicInfo: '基本資料', required: '*',
    weight: '體重 (kg)', height: '身高 (cm)', age: '年齡', gender: '性別',
    male: '男', female: '女',
    inbodySection: 'InBody 數據',
    inbodyOptional: '（選填 — 填寫你有的數據）',
    inbodyHint: '沒有的數據可以留空，系統會自動估算',
    bodyFat: '體脂率 (%)', muscle: '骨骼肌肉量 (kg)', bmr: '基礎代謝率 (kcal)',
    visceralFat: '內臟脂肪等級 (1–20)', bodyWater: '體水分率 (%)',
    cookingStyle: '烹飪方式', proteinPrefs: '蛋白質喜好',
    carbPrefs: '碳水喜好',
    cuisinePrefs: '菜式風格', cuisineOptional: '選擇喜歡的菜式（選填）',
    goal: '目標', restrictions: '飲食限制',
    proteinOptional: '選擇你喜歡的（選填）',
    carbOptional: '選擇你喜歡的（選填）',
    saved: '已儲存！', history: '歷史記錄',
    viewCharts: '查看進度圖表', chartsDesc: '體重、體脂、肌肉量趨勢',
  },
  mealPlan: {
    title: '餐單', tabToday: '今日', tabWeek: '本週',
    noData: '尚未生成餐單',
    noDataDesc: '點擊「生成」建立你的個人化 7 日餐單',
    proRequired: '需要 Pro 計劃，點擊「生成」升級',
    noBodyData: '尚未有身體數據',
    noBodyDataDesc: '先輸入 InBody 數據才能生成個人化餐單',
    addData: '輸入 InBody 數據',
    todayEmpty: '準備好燃燒今天了嗎？',
    todayEmptyDesc: '點擊「生成」獲取個人化早午晚餐建議',
  },
  shopping: {
    title: '購物清單', noList: '尚未有清單',
    noListDesc: '先生成週餐計劃，自動產生購物清單',
    goMealPlan: '前往週餐計劃', noItems: '購物清單沒有項目',
    fromPlan: '來自餐單日期',
    items: '項', checkedOff: '已勾選', copy: '複製', copied: '已複製！', clear: '清除',
  },
  meal: {
    breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '小食',
    showRecipe: '顯示食譜', hideRecipe: '收起', moreInfo: '更多資訊',
    ingredients: '食材', steps: '步驟',
    generatingImage: '生成圖片中…',
    takeout: '外賣', homeCook: '自煮',
    protein: '蛋白質', carbs: '碳水', fat: '脂肪',
  },
  upgrade: {
    title: '升級 Pro',
    desc: '解鎖無限 AI 餐單生成',
    feature1: '無限次生成每日三餐及週計劃',
    feature2: '一鍵生成 7 日完整餐單',
    feature3: '自動生成購物清單，可一鍵複製',
    feature4: '進度圖表及身體數據追蹤',
    btn: '升級 Pro · HK$38/月',
    later: '稍後再說',
  },
  settings: {
    title: '個人資料與設定', accountSection: '帳號',
    guestBadge: '訪客', guestIdLabel: '訪客 ID',
    langSection: '語言', fitnessSection: '健身',
    currentGoal: '目前目標', editBodyData: '編輯身體數據',
    appSection: 'App', appearance: '外觀', notifications: '通知',
    comingSoon: '即將推出', proSection: 'Pro 計劃', proActive: '已啟用',
    upgradeBtn: '升級 Pro', upgradeDesc: '解鎖無限餐單生成及進度圖表',
    logoutBtn: '登出', logoutDesc: '將返回登入頁面',
    confirmLogout: '確認登出', cancel: '取消',
    goalLabels: { muscle_gain: '增肌', fat_loss: '減脂', maintain: '維持' } as Record<string, string>,
  },
  cookingStyle: { home: '自己煮', takeout: '外賣', both: '兩者都有' },
  categories: {
    protein: '蛋白質', vegetables: '蔬菜', carbs: '碳水',
    dairy: '乳製品', condiments: '調味料', other: '其他',
  },
}

export const T = { en, zh }
