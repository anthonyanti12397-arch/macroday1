# MacroDay — 開發日誌 (Development Log)

> **Project**: MacroDay (`macroday1.vercel.app`)  
> **Stack**: Next.js 14 App Router · TypeScript · Tailwind CSS · next-auth v4 · Resend · Grok (xAI) · FLUX (Together AI) · Stripe · Vercel  
> **Local path**: `/Users/anthony/claude/fuelweek`  
> **Vercel project**: `macroday1` (`prj_UniCJBbF7PvZgqUV0Kyb0ZgrNecP`)

---

## 目錄 (Table of Contents)

1. [項目概覽](#1-項目概覽)
2. [架構總覽](#2-架構總覽)
3. [Phase 1 — MVP 核心功能](#3-phase-1--mvp-核心功能)
4. [Phase 2 — 變現--分享](#4-phase-2--變現--分享)
5. [Phase 3 — 打磨--社區基礎](#5-phase-3--打磨--社區基礎)
6. [Auth 系統重構](#6-auth-系統重構)
7. [重要 Bug 修復記錄](#7-重要-bug-修復記錄)
8. [Vercel 部署指南](#8-vercel-部署指南)
9. [環境變數](#9-環境變數)
10. [下一步 Phase 4 計劃](#10-下一步-phase-4-計劃)

---

## 1. 項目概覽

MacroDay 是一個 AI 驅動的每日飲食教練 PWA。用戶輸入 InBody 數據（體重、肌肉量、體脂等），系統根據目標（增肌/減脂/維持）自動生成每日三餐計劃，並附上食材清單和烹飪步驟。

**核心用戶流程：**
1. 登入（Google OAuth / Email OTP / 訪客模式）
2. 輸入 InBody 數據 + 設定目標
3. AI 生成每日三餐
4. 查看食譜、烹飪模式
5. 追蹤合規率、連續達標天數

---

## 2. 架構總覽

### 目錄結構

```
fuelweek/
├── app/
│   ├── page.tsx                    # 主頁面（Dashboard）
│   ├── layout.tsx                  # Root layout，含 SessionProvider
│   ├── meal-plan/page.tsx          # 每週計劃頁面
│   ├── inbody/page.tsx             # InBody 數據輸入頁
│   ├── shopping/page.tsx           # 購物清單頁
│   ├── community/page.tsx          # 社區頁（受保護路由）
│   └── api/
│       ├── auth/[...nextauth]/     # next-auth handler
│       ├── auth/send-otp/          # 發送 OTP 驗證碼（Resend）
│       ├── generate-daily/         # AI 生成每日三餐
│       ├── generate-meals/         # AI 生成週計劃
│       ├── generate-image/         # FLUX 圖片生成
│       ├── generate-recipe/        # 食譜詳情
│       ├── swap-meal/              # AI 替換單餐
│       └── checkout/               # Stripe 付款
│
├── components/                     # UI 組件（全部 client-side）
├── lib/
│   ├── types.ts                    # 所有 TypeScript interfaces
│   ├── storage.ts                  # localStorage 封裝
│   ├── auth.ts                     # next-auth authOptions
│   ├── otp.ts                      # 無狀態 OTP 生成/驗證
│   ├── db.ts                       # Phase 1 no-op / Phase 2 Prisma scaffold
│   ├── constants.ts                # 全域常數（GROK_MODEL、BETA_MODE 等）
│   ├── cache.ts                    # 記憶體快取 + hash 生成
│   ├── streak.ts                   # 連續天數計算邏輯
│   ├── utils.ts                    # 工具函數（含 localDateStr）
│   └── recipe-pool.ts              # 靜態食譜池（快速返回）
│
├── contexts/
│   ├── LangContext.tsx             # 全域語言切換 (zh/en)
│   └── ThemeContext.tsx            # 深色/淺色模式
│
├── middleware.ts                   # Edge Runtime 保護路由
├── prisma/schema.prisma            # Phase 2 DB schema（目前禁用）
└── types/next-auth.d.ts           # Session 類型擴充
```

### 數據流

```
用戶 → localStorage（InBody + Profile）
         ↓
      API Route（/api/generate-daily）
         ↓
   1. 靜態池匹配（recipe-pool.ts）→ 即時返回
   2. 否則 → Grok xAI API → 生成餐單 JSON
         ↓
      FLUX API（Together AI）→ 生成食物圖片
         ↓
      前端 React 組件渲染
```

---

## 3. Phase 1 — MVP 核心功能

**Git commits:** `444f636` → `4854c9b`

### InBody 數據輸入 (`app/inbody/page.tsx`)

用戶輸入體重、身高、性別、年齡，以及可選的 InBody 機器數據（體脂%、骨骼肌量、BMR）。資料儲存在 `localStorage`，key: `fuelweek_inbody_history`。

### 熱量/蛋白質目標計算 (`app/page.tsx`, `app/api/generate-daily/route.ts`)

```typescript
function calcTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = estimateBMR(inbody)  // Mifflin-St Jeor 公式
  switch (goal) {
    case 'fat_loss':    calories = bmr * 0.85;  protein = muscle * 2.2; break
    case 'muscle_gain': calories = bmr * 1.15;  protein = muscle * 2.5; break
    default:            calories = bmr * 1.0;   protein = muscle * 2.0
  }
}
```

BMR 使用 Mifflin-St Jeor 公式：
- 男性：`10W + 6.25H - 5A + 5`
- 女性：`10W + 6.25H - 5A - 161`

如果沒有 InBody 機器數據，以體重估算蛋白質（×1.6 維持 / ×1.8 減脂 / ×2.0 增肌）。

#### 4.5 基礎架構 (Infrastructure)
*   **數據庫 (Database)**: 已配置 Neon PostgreSQL。
    *   **URL**: `postgresql://neondb_owner:npg_YD21tKXLWdrG@ep-purple-cherry-ant89kmq.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require`
    *   **狀態**: 已備好，待 Phase 8 啟動同步。

### AI 餐單生成 (`app/api/generate-daily/route.ts`)

**雙軌系統（重要！降低 API 費用）：**

1. **靜態池（`lib/recipe-pool.ts`）**：預設常見熱量目標的餐單，命中時 <100ms 返回，不消耗 AI API
2. **Grok AI**：靜態池未命中才調用，使用 OpenAI-compatible API：

```typescript
const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})
// model 定義在 lib/constants.ts → GROK_MODEL = 'grok-3-mini'
```

### 圖片生成 (`app/api/generate-image/route.ts`)

使用 Together AI 的 FLUX 模型，**只接受英文 prompt**。

**Image Prompt 修復（`ensureImagePrompt`）：**
Grok 有時返回空的 `imagePrompt` 或中文描述，造成圖文不符。解決方案：
```typescript
function ensureImagePrompt(meal: Meal): Meal {
  if (meal.imagePrompt?.trim()) return meal
  const ingEn = meal.ingredients.slice(0, 3)
    .map(i => i.replace(/[^\w\s(),]/g, ' ').trim())
    .filter(Boolean).join(', ')
  meal.imagePrompt = `${meal.name} made with ${ingEn}, Asian food photography`
  return meal
}
```

### 訪客模式

無需帳號，資料全部存在 `localStorage`。訪客 ID 格式：`🦁 Lion #A3X9K`（動物 emoji + 5位隨機碼）。

---

## 4. Phase 2 — 變現 & 分享

**Git commits:** `bbed89f` → `dedce05`

### Stripe 付款 (`app/api/checkout/route.ts`)

建立 Checkout Session，付款後跳轉 `/upgrade/success`。

**重要：** API client 必須在 handler 內初始化，不能放 module level：
```typescript
// ✅ 正確
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)  // handler 內
}
// ❌ 錯誤 — 會在 build 時崩潰（因為 env var 在 build 時不存在）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)  // module level
```
這個規則同樣適用於 Resend、OpenAI 等所有需要 API key 的 client。

### Beta 模式

`lib/constants.ts` 的 `BETA_MODE = true` 讓所有用戶享受 Pro 功能（測試期間）。上線時改為 `false`。

### PDF 匯出

使用 `window.print()` + CSS `@media print`，不需額外 library。

### 分享功能

使用 Web Share API (`navigator.share`)，不支援時 fallback 到複製連結。

---

## 5. Phase 3 — 打磨 & 社區基礎

**Git commits:** `336a9ed` → `4a283a2`

### 新增組件說明

#### `ProgressRing.tsx` — SVG 圓環進度條
```typescript
const circumference = 2 * Math.PI * radius
const offset = circumference - (progress / 100) * circumference
// 用 strokeDashoffset 控制顯示比例
```

#### `ComplianceCalendar.tsx` — 合規率日曆
顯示過去 30 天，每天是否達到蛋白質目標（綠色=達標）。
**必須用本地時區，不能用 `toISOString()`。**

#### `StreakBadge.tsx` — 連續達標天數
計算邏輯在 `lib/streak.ts`：從今天往回數到第一個未達標的天。

#### `NutritionTrend.tsx` — 7 天營養趨勢
SVG 長條圖，顏色編碼：
- 綠（≥90%）：`#0F9E75`
- 黃（60-89%）：`#F59E0B`
- 灰（<60%）：`#E2E8F0`

#### `WeightSparkline.tsx` — 體重趨勢折線
InBody 歷史的 SVG `polyline`。

#### `CookMode.tsx` — 全螢幕烹飪模式
逐步顯示食譜步驟，支援滑動切換。

#### `ConfettiCelebration.tsx` — 生成成功慶祝效果
CSS animation + random positioning。

### AI 替換單餐 (`app/api/swap-meal/route.ts`)
允許替換某一餐，傳入不喜歡的食材，AI 返回替代選項。

---

## 6. Auth 系統重構

**Git commit:** `4a283a2`  
**移除：** 電話號碼登入  
**保留：** Google OAuth  
**新增：** Email + OTP（via Resend）+ 受保護路由

### 無狀態 OTP 設計 (`lib/otp.ts`)

不需要 Redis 或 DB，HMAC 簽名的 token 直接返回給 client：

```typescript
// 生成
const otp = randomInt(100000, 999999).toString()  // 6 位數
const exp = Date.now() + 10 * 60 * 1000          // 10 分鐘過期
const payload = JSON.stringify({ email, otp, exp })
const sig = createHmac('sha256', NEXTAUTH_SECRET).update(payload).digest('hex')
const token = Buffer.from(JSON.stringify({ payload, sig })).toString('base64url')
// token 返回 client → client 登入時帶回來

// 驗證
const { payload, sig } = JSON.parse(Buffer.from(token, 'base64url').toString())
const expected = createHmac('sha256', NEXTAUTH_SECRET).update(payload).digest('hex')
// timing-safe 比較（防 timing attack）
let diff = 0
for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
if (diff !== 0) return false
```

**為什麼要 timing-safe 比較？**  
直接 `===` 在第一個不同字符就返回，攻擊者可通過測量響應時間猜測 HMAC。Bit-OR 累積讓所有比較耗時一致。

### App Router 重要限制

Route 文件只能 export HTTP method handlers，**不能 export 其他 named exports**：

```typescript
// ❌ App Router 不允許
// app/api/auth/[...nextauth]/route.ts
export const authOptions = { ... }  // 不允許！

// ✅ 正確做法：分離到 lib/
// lib/auth.ts
export const authOptions: NextAuthOptions = { ... }

// app/api/auth/[...nextauth]/route.ts
import { authOptions } from '@/lib/auth'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Session 類型擴充 (`types/next-auth.d.ts`)

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider: 'google' | 'email-otp' | 'guest'
      createdAt: string
      lastLogin: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
```

### 受保護路由 (`middleware.ts`)

Edge Runtime（比 Node.js 更快），在到達 page 前就攔截：
```typescript
export default withAuth(
  function middleware(req) { return NextResponse.next() },
  { callbacks: { authorized: ({ token }) => !!token } }
)
export const config = {
  matcher: ['/community/:path*', '/profile/:path*']
}
```

### Resend 測試模式限制

**當前狀態：** 未驗證 domain 只能發郵件給 `anthonyanti12397@gmail.com`。

**上線前必做：**
1. 去 [resend.com/domains](https://resend.com/domains) 驗證你的 domain
2. 加 Resend 要求的 DNS 記錄
3. 更新 Vercel env var：`EMAIL_FROM=MacroDay <noreply@yourdomain.com>`

---

## 7. 重要 Bug 修復記錄

### Bug 1：時區問題（commit `245606e`）

**症狀：** 合規日曆日期錯誤，UTC+8 用戶在 00:00-07:59 期間看到錯誤日期。

**根因：** `toISOString()` 返回 UTC，`split('T')[0]` 在 UTC+8 時區會得到昨天的日期。

**修復：**
```typescript
// ❌ 有問題
const today = new Date().toISOString().split('T')[0]

// ✅ 正確 — lib/utils.ts → localDateStr()
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
```

### Bug 2：SettingsSheet 重複 style prop（commit `a676e9f`）

**症狀：** Vercel build 失敗，ESLint `Duplicate prop 'style'`。

**修復：** 合併兩個 `style={{...}}` 成一個 object。

### Bug 3：Vercel 部署 12 秒失敗

**症狀：** 本地 build 正常，Vercel 12 秒內 Error。

**根因：** `.vercel/project.json` 的 `projectId` 指向 `fuelweek` project（無 env vars），不是 `macroday1`。缺少 `NEXTAUTH_SECRET` 讓 OTP 模組在 build 時崩潰。

**修復：** 更新 `.vercel/project.json`：
```json
{
  "projectId": "prj_UniCJBbF7PvZgqUV0Kyb0ZgrNecP",
  "orgId": "team_Vzatu3Mr5qHgyA9jqsV6AKM9",
  "projectName": "macroday1"
}
```

**教訓：** Vercel CLI `link` 可能綁定到錯誤 project。遇到 Vercel 問題先執行：
```bash
npx vercel project ls                    # 列出所有 projects
npx vercel project inspect macroday1    # 找到正確的 projectId
```

### Bug 4：圖文不符

**三個根因：**
1. Grok 返回空 `imagePrompt` → `ensureImagePrompt()` fallback
2. Grok 寫中文 `imagePrompt`，但 FLUX 只懂英文
3. 舊快取圖片未更新

**修復：** `ensureImagePrompt()` 確保永遠有英文 prompt（見第 3 節）。

---

## 8. Vercel 部署指南

### ⚠️ 部署前必做：本地 Build 檢查

**每次部署前必須先跑 build，確認通過才能 deploy。** 這是唯一可靠的保證。

```bash
cd /Users/anthony/claude/fuelweek
npm run build
```

`npm run build` 會依序做三件事：
1. **TypeScript 型別檢查** — 捕捉所有型別錯誤（例如用了不存在的 property）
2. **ESLint** — 捕捉重複 prop、語法問題等
3. **靜態頁面生成** — 確保所有頁面可以正常渲染

只要本地 build 通過，Vercel deploy 幾乎必然成功，因為 **Vercel 跑的是完全相同的 `npm run build`**。

**為什麼 Antigravity / 其他工具改完直接 push 會失敗：**
它們通常跳過本地 build 直接上傳代碼，TypeScript 型別錯誤或 ESLint 錯誤只有在 Vercel 伺服器 build 時才被發現，導致 deploy 失敗。

### 正常部署流程

```bash
cd /Users/anthony/claude/fuelweek

# Step 1：先 build（必做，不能跳過）
npm run build

# Step 2：build 通過才 deploy
npx vercel --prod
```

build 輸出最後應該看到：
```
✓ Compiled successfully
✓ Generating static pages (N/N)
```
如果看到 `Failed to compile` 或 `Type error`，**不要 deploy**，先修好再試。

### 常用指令

```bash
# 確認連結到正確 project
cat .vercel/project.json

# 查看 env vars
npx vercel env ls

# 新增 env var
npx vercel env add VARIABLE_NAME

# 查看所有 projects（找 projectId 用）
npx vercel project ls

# 查看 project 詳情
npx vercel project inspect macroday1

# 查看近期部署
npx vercel ls
```

---

## 9. 環境變數

| 變數 | 用途 |
|------|------|
| `NEXTAUTH_SECRET` | JWT 簽名密鑰，也用於 OTP HMAC 簽名 |
| `NEXTAUTH_URL` | `https://macroday1.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | 發送 OTP 郵件 |
| `EMAIL_FROM` | 發件人（需驗證 domain 才能改） |
| `XAI_API_KEY` | Grok AI 餐單生成 |
| `TOGETHER_API_KEY` | FLUX 圖片生成 |
| `STRIPE_SECRET_KEY` | Stripe 付款 |

本地開發：複製以上到 `.env.local`（已在 `.gitignore`）。

---

## 10. Phase 4 — 深色模式 & 部署配置

**完成日期：** 2026-04-11

### 深色模式全面實作

ThemeContext 和 CSS 變數在 Phase 3 就已建好，Phase 4 完成了所有組件層面的接入。

**修改文件清單：**

| 文件 | 修改內容 |
|------|---------|
| `app/layout.tsx` | 移除硬編碼 `bg-slate-50`，讓 CSS 變數生效 |
| `app/globals.css` | `.page-header`、`.section-label` 改用 `var(--text-primary/secondary)`；`.btn-secondary` 加 `dark:` 變體 |
| `app/page.tsx` | 設定按鈕、訪客警告、每日目標卡、今日進度區 |
| `app/inbody/page.tsx` | 表單標題、歷史記錄數值 |
| `app/community/page.tsx` | 未登入提示、頁面標題、功能卡片 |
| `components/MacroBar.tsx` | label 文字顏色 |
| `components/StreakBadge.tsx` | hot/cold 狀態背景與邊框 |
| `components/ComplianceCalendar.tsx` | 日曆格子、日期標籤、空白格顏色 |
| `components/WeeklyInsights.tsx` | 統計數字格子背景 |
| `components/NutritionTrend.tsx` | 「未記錄」格的灰色隨 `isDark` 切換（`#475569` vs `#E2E8F0`） |
| `components/SettingsSheet.tsx` | 關閉按鈕、語言/主題切換器、登出按鈕 |
| `components/LoginScreen.tsx` | 全屏背景、所有按鈕、輸入框、分隔線 |

**深色模式觸發方式：**
- 設定頁（Settings Sheet）→ 外觀 → 自動 / 淺色 / 深色
- 「自動」追蹤系統設定（`prefers-color-scheme`）
- 偏好儲存在 `localStorage` (`macroday_theme`)

### 外部配置（需 Cowork / 手動完成）

以下三個任務需要瀏覽器操作，已交由 Cowork 執行：

#### 1. Resend Domain 驗證

**為什麼要做：** 未驗證 domain 只能發郵件給 `anthonyanti12397@gmail.com`，所有用戶都無法用 email OTP 登入。

**步驟：**
1. [resend.com/domains](https://resend.com/domains) → Add Domain
2. 加入 Resend 要求的 DNS 記錄（TXT + MX）
3. 驗證成功後更新 Vercel env var：
   ```
   EMAIL_FROM=MacroDay <noreply@yourdomain.com>
   ```
4. 重新部署

#### 2. Google OAuth Callback URL

**為什麼要做：** Production 環境的 Google 登入可能因 callback URL 不符而失敗。

**步驟：**
- [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client
- Authorized redirect URIs 加入：
  ```
  https://macroday1.vercel.app/api/auth/callback/google
  ```
- 保留 `http://localhost:3000/api/auth/callback/google`（本地開發）

#### 3. Prisma DB 啟動（社區功能前置條件）

**為什麼要做：** 社區 forum、排行榜、用戶資料持久化都需要 DB。`lib/db.ts` 和 `prisma/schema.prisma` 已完整，只差 DB 實例。

**步驟：**
1. Vercel Dashboard → macroday1 → Storage → Create → Postgres（選 Singapore region）
2. Vercel 自動注入 `DATABASE_URL` 和 `DIRECT_URL` 到 env vars
3. 執行 schema push：
   ```bash
   cd /Users/anthony/claude/fuelweek
   npx prisma db push
   ```
4. 重新部署：`npx vercel --prod`

---

## 11. 下一步 Phase 5 計劃

### DB 啟動後可立即實現

- **飲食打卡**：用戶在 `/community/forum` 發布今日三餐打卡
- **排行榜**：連續達標天數排名
- **用戶資料雲端同步**：InBody 歷史、用戶設定跨裝置同步

### 其他優化方向

- `meal-plan/page.tsx` 深色模式（目前大部分用 `card-lg` 已自動適配，部分 inline 顏色仍需調整）
- Resend domain 驗證完成後測試完整 Email OTP 流程
- Stripe webhook 處理（付款成功後自動升級 Pro）

---

## 12. Phase 7 計劃 — 虛擬角色 & 時裝商城

### 設計理念
用戶達標賺取 **MacroScore 分數**，可在時裝商城購買服裝打扮自己的虛擬角色，並截圖分享到社群，形成 **達標 → 賺分 → 買時裝 → 分享 → 吸引新用戶** 的 viral loop。

---

### 分數系統（MacroScore）

**新增 storage functions（`lib/storage.ts`）：**

| Function | 說明 |
|----------|------|
| `getMacroScore()` | 讀取總分 |
| `addMacroScore(points)` | 增加分數 |
| `spendMacroScore(points)` | 扣分，餘額不足返回 false |
| `getUnlockedOutfits()` | 已解鎖服裝 ID 列表 |
| `unlockOutfit(id)` | 記錄已解鎖服裝 |
| `getEquippedOutfit()` | 當前裝備的服裝 ID |
| `setEquippedOutfit(id)` | 設定裝備服裝 |

localStorage key 統一用 `macroday_` 前綴。

**分數獲得規則：**

| 行為 | 分數 | 觸發位置 |
|------|------|----------|
| 每日三餐全部完成 | +10 | `meal-plan/page.tsx` 標記完成時 |
| 訓練完成 | +15 | `training/page.tsx` 標記完成時 |
| 連續 7 天達標 | +50 bonus | streak 計算時判斷 |
| 新增 InBody 記錄 | +20 | `inbody/page.tsx` 儲存時 |

每次獲得分數用 `sonner` toast 提示：`🏆 +15 分！繼續保持`

---

### 時裝定義（`lib/outfits.ts`）

新建檔案，定義 `Outfit` interface 和 `OUTFITS` 陣列：

```typescript
export interface Outfit {
  id: string
  nameZh: string
  nameEn: string
  price: number          // MacroScore 分數
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  colors: { top: string; bottom: string; accent: string }
  unlockCondition?: string  // 特殊條件（純展示）
}
```

**服裝清單：**

| ID | 中文名 | 稀有度 | 價格 |
|----|--------|--------|------|
| `basic_white` | 基礎白色套裝 | common | 100 |
| `gym_black` | 健身黑色套裝 | common | 150 |
| `sport_blue` | 運動藍套裝 | common | 200 |
| `teal_pro` | MacroDay 專業裝 | rare | 500 |
| `fire_red` | 烈焰紅套裝 | rare | 500 |
| `galaxy` | 星河套裝 | epic | 1000 |
| `gold_champion` | 黃金冠軍裝 | epic | 1000 |
| `streak_legend` | 30天傳說套裝 | legendary | 0（連續30天自動解鎖）|

稀有度顏色對應（`RARITY_COLORS`）：common=灰、rare=藍、epic=紫、legendary=金。

---

### 虛擬角色組件（`components/Avatar.tsx`）

用 **SVG 圖層疊加**渲染，不需外部圖片資產：

1. **Body layer** — 簡化人形輪廓，固定膚色
2. **Outfit layer** — 根據裝備的服裝 ID 渲染對應顏色衣服
3. **Accessory layer** — 特殊成就裝飾（連續30天光環等）

```typescript
interface AvatarProps {
  outfitId: string
  size?: 'sm' | 'md' | 'lg'   // 60px / 120px / 200px
  inbody?: InBodyRecord | null
  animated?: boolean            // Framer Motion idle 動畫
}
```

可選：體型根據 InBody 數據微調（骨骼肌高 → 肩寬、體脂低 → 腰細）。

---

### 角色主頁（`app/avatar/page.tsx`）

**「我的角色」tab：**
- 大尺寸 Avatar（帶 idle 動畫）
- 當前 MacroScore 分數 + 到下一稀有度門檻的進度條
- 已解鎖服裝列表（點擊切換裝備）
- 「分享我的角色」按鈕（截圖角色 + 分數）

**「時裝商城」tab：**
- 所有服裝 Grid（2列）
- 每張卡：Avatar 小預覽 + 名稱 + 稀有度標籤 + 價格
- 購買確認 Modal（顯示當前餘額）
- 餘額不足時按鈕 disabled

`/avatar` **不需要登入保護**，訪客也可使用（不用加進 `middleware.ts`）。

---

### Bottom Nav 更新（`components/BottomNav.tsx`）

新增第 6 個 tab：
- Icon：`Shirt`（lucide-react）
- href：`/avatar`
- 中文：`角色` / 英文：`Avatar`
- 在 `lib/i18n.ts` nav 區塊加入翻譯
- ⚠️ 6 個 tab 較擠，考慮縮小字體或縮短 label

---

## 附錄：關鍵設計原則

| 原則 | 說明 |
|------|------|
| **localStorage first** | Phase 1 不需 DB，資料存用戶設備 |
| **靜態池快速路徑** | `recipe-pool.ts` 讓常見情況 <100ms 返回，省 AI 費用 |
| **無狀態 OTP** | HMAC token，不需 Redis/DB |
| **API client 在 handler 內** | Resend/Stripe 等必須在函數內 `new`，避免 build 崩潰 |
| **authOptions 分離到 lib/** | App Router 路由文件只能 export HTTP methods |
| **本地時區日期** | 用 `getFullYear()/getMonth()/getDate()`，不用 `toISOString()` |
| **CSS 變數深色模式** | `var(--bg-card)`、`var(--text-primary)` 等，`.dark` class 由 ThemeContext 加到 `<html>` |
| **`isDark` 用於動態顏色** | SVG、inline style 等無法用 Tailwind `dark:` 的地方，用 `useTheme().isDark` 切換 |

---

*Last updated: 2026-04-16*

---

## 13. [新動能] 00x 系列擴展計劃 (已確立)

為了進一步提升產品的實用性、商業價值與社交屬性，我們確立了以下三個重點升級方案：

### Plan 001 — 訓練多樣化優化 (Variety Boost)
*   **目標**：解決訓練內容重複、無法重新生成的痛點。
*   **技術策略**：
    *   在 `buildTrainingPrompt` 中加入動態隨機種子 (Salt) 與「排除最近 3 次動作」的指令。
    *   API 增加隨機因子參數，確保 Grok 生成內容的多樣性。
    *   前端 UI 增加「重新生成」按鈕。

### Plan 002 — AI 拍照識食 (Food Vision AI)
*   **目標**：讓用戶隨時拍照記錄非計劃內的飲食，實現「彈性飲食」。
*   **核心邏輯**：
    *   **替代 (Substitute)**：識別照片食物營養，替換原定餐點，繼承合規狀態。
    *   **額外 (Extra)**：作為「加餐」計入當日總量，並自動調整當日其餘宏觀營養剩餘量。
*   **技術路徑**：整合 Vision LLM 識別圖像屬性、估算重量並產出營養數據。

### Plan 003 — 商業轉型與社交氛圍 (Social & Revenue V2)
*   **目標**：建立健康的盈利閉環並強化用戶的「虛榮心」留存。
*   **關鍵變更**：
    *   **定價策略**：設定為 **每月 $8 HKD** 訂閱制（貨幣切換至 HKD）。
    *   **角色光環 (Glory Aura)**：在 Avatar 周圍增加動態 SVG 特效（氣場、粒子），強度隨 `macroScore` 與連續達標天數增加。
    *   **全螢幕展示 (Showcase)**：點擊頭像進入「高清曬娃」界面，展示裝備與硬核數據，支持生成分享圖。
### Plan 004 — 陪伴式 AI 教練 (AI Companion Coach)
*   **目標**：讓 AI 從「靜態工具」轉化為「有溫度的健身夥伴」。
*   **核心功能**：
    *   **語音烹飪助手**：支持語音指令（「下一個」、「上一個」）與語音朗讀步驟，解放雙手。
    *   **疲勞度自適應**：同步 Apple Health 數據（睡眠、心率），AI 根據用戶疲勞狀態主動調整當日營養比例與訓練強度。
*   **技術路徑**：Web Speech API (TTS/ASR) + Capacitor HealthKit Bridge。

### Plan 005 — 專業日曆與個人成長藍圖 (Calendar & Roadmap)
*   **目標**：提升數據視覺化的專業感與用戶的成就歸屬感。
*   **核心功能**：
    *   **專業日曆**：重構 `ComplianceCalendar`，採標準月視圖（對齊 1 號與星期），支持月份切換。
    *   **成長藍圖 (Roadmap)**：新增 `/roadmap` 頁面，以時間軸形式記錄用戶從「加入」、「首條記錄」、「體重突破」、「衣服解鎖」到「積分里程碑」的全過程。

---

## 14. [審計與同步] 20260416_ANTHONY — 待辦清單與技術債

在今日的深度評審中，我們識別出以下尚未完成或需要修復的關鍵任務。這些任務將作為接下來開發的導航。

### A. 基礎設施殘項 (Critical Infrastructure)
- [ ] **數據庫同步 (Prisma Push)**: 雖然 Neon URL 已備，但需執行 `npx prisma db push` 以初始化雲端表結構。
- [ ] **域驗證 (Resend)**: 需要手動在 DNS 加入記錄，解除 1 個 Email 的發送限制。
- [ ] **OAuth 完善**: 需要在 Google Console 加入 Production 環境的 Callback URL。

### B. 功能實現缺口 (Feature Gaps)
- [ ] **支付閉環 (Stripe Webhook)**: 缺少 `/api/webhook/stripe` 邏輯，付款成功後用戶無法自動升級 Pro。
- [ ] **打印優化 (PDF CSS)**: 缺少 `@media print` 的精準樣式控制。
- [ ] **社區功能 (Community Logic)**: 論壇發帖、點讚、三餐打卡的 CRUD 邏輯待開發。

### C. 00x 系列進度與缺陷 (00x Roadmap Status)
- [x] **Plan 001 (AI Variety)**: 已完成 (2026-04-17) - 加入隨機種子、動態 diversity、「重新生成」按鈕、排除最近3天動作。
- [x] **Plan 002 (AI Photo)**: 已完成 (2026-04-17) - Claude Vision API 食物識別、拍照/上傳UI、替換/添加模式。
- [x] **Plan 003 (Social/Pricing)**: 已完成 (2026-04-17)
    - [ ] 將定價調整為 **$8 HKD/月** (待實施)。
    - [x] 開發 **角色光環 (Glory Aura)** 特效 (已完成，基於 macroScore 的動態粒子效果)。
    - [x] 建立 **全螢幕展示 (Showcase)** 頁面 (已完成，含榮譽等級系統與成就徽章)。
    - [x] 建立 **社群脈搏 (SocialPulse)** 組件 (已完成，即時活動顯示)。
- [ ] **Plan 005 (Calendar/Roadmap)**:
    - [x] InBody 歷史編輯功能 (已完成 2026-04-16)。
    - [x] InBody 補錄日期功能 (已完成 2026-04-16)。
    - [ ] **專業月份日曆重構** (急需：目前 28 天滑動窗口視圖不夠專業)。
    - [ ] **個人成長藍圖 (/roadmap)** 頁面。

### D. 下一步行動建議
1. **實施 Plan 004 (登入功能)**: Google/Apple/Email 登入（NextAuth.js）。
2. **調整定價策略**: 確保商業邏輯正確，將訂閱調整為 **$8 HKD/月**。
3. **重寫 ComplianceCalendar**: 解決「不像樣」的日曆問題。
4. **開發 Plan 005**: 專業月份日曆 + 個人成長藍圖 (/roadmap) 頁面。
5. **初始化數據庫表**: 為雲端同步做準備 (Prisma Push)。
