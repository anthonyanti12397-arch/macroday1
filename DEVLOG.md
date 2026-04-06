# MacroDay Dev Log

## 2026-04-05 ~ 2026-04-06

### Repo
- GitHub: `anthonyanti12397-arch/macroday1`
- Vercel: `https://macroday1.vercel.app`

---

## 功能更新總覽

### 🔐 Login System (next-auth v4)
- Google OAuth 登入
- Email OTP 登入（HMAC 簽名，無需資料庫）
- 訪客模式保留（localStorage）
- `lib/otp.ts` — stateless OTP token signing
- `lib/auth.ts` — NextAuth config
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `app/api/auth/send-otp/route.ts` — OTP email via Resend API
- `components/Providers.tsx` — SessionProvider + LangProvider wrapper
- `components/LoginScreen.tsx` — Google / Email OTP / Guest 三種登入
- `components/AuthGate.tsx` — 檢查 next-auth session + guest session

### 🍽️ Meal Plan UX
- Today / Week 兩個 tab
- 圖片逐一顯示（sequential，非 Promise.all）
- Today 空狀態：顯示日期、今日目標卡路里、大生成按鈕
- MealCard 新增「已吃」toggle 按鈕（按日期存 localStorage）
- MealCard 新增「收藏」toggle 按鈕（存 localStorage）

### 🛒 購物清單
- 免費用戶無週計劃時，顯示今日三餐食材
- 附帶升級橫幅（紫色）

### 📊 Dashboard
- 今日三餐狀態卡：已生成顯示三餐名稱，未生成顯示 CTA
- 訪客警告橫幅（琥珀色，可關閉）
- Buy Me a Coffee 卡（黃色，Hero card 下方）

### ⚙️ Settings
- 顯示真實 Google 用戶名稱/Email（next-auth useSession）
- 登出：Google 用戶用 signOut()，訪客用 clearSession()
- Buy Me a Coffee 按鈕（buymeacoffee.com/anthonyantm）
- Beta 模式：顯示「Beta — All features unlocked」

### 🧪 Beta 模式
- `lib/constants.ts` 加入 `BETA_MODE = true`
- 所有 isPro 檢查都跳過
- Dashboard 頂部顯示紫色 Beta 橫幅
- 之後正式版改 `BETA_MODE = false` 即可

### 🎨 UI/UX 改善
- InBody 導航：ZH 改為「體測」
- UsageCounter：雙語，三種狀態（正常/最後一次/已達上限）
- InBodyForm：新增菜式偏好（港式茶餐廳/日式/韓式等）+ 清真選項

### 🤖 AI 準確性
- `fixMacros()` server-side：強制 calories = protein×4 + carbs×4 + fat×9
- `imagePrompt` 欄位：英文描述給 FLUX 模型，解決圖文不符問題
- Prompt 加入參考食物熱量數值

---

## 環境變數

| 變數 | 用途 |
|------|------|
| `XAI_API_KEY` | Grok AI 生成餐單 |
| `TOGETHER_API_KEY` | FLUX 圖片生成 |
| `NEXTAUTH_SECRET` | JWT 簽名（openssl rand -base64 32）|
| `NEXTAUTH_URL` | App URL（Vercel 自動偵測，本地需設）|
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | 發送 OTP 郵件 |
| `EMAIL_FROM` | 發件地址（需在 Resend 驗證）|

---

## Git Remote

```bash
# 正確 remote（macroday1，Vercel 連接的）
git remote set-url origin https://TOKEN@github.com/anthonyanti12397-arch/macroday1.git
```

> ⚠️ 注意：之前曾誤指向 `macroday`（舊 repo），co-work session 的 commits 在 `macroday1`

---

## 已知問題

- `Coffee` icon 在目前安裝的 lucide-react 版本不存在 → 已改用 ☕ emoji
- Vercel build 偶爾失敗，查 build log：`vercel.com/anthonyanti12397-8643s-projects/macroday1/deployments`
