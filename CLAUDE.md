# CLAUDE.md — MacroDay

給未來 session 的專案指引。**開工前先讀這份。**

---

## 專案是什麼

**MacroDay（每日燃）** — AI 營養教練 web app + iOS 原生殼。
根據使用者的 InBody 身體數據生成個人化每日三餐、7 日餐單、訓練計劃。

- 線上站：https://macroday1.vercel.app
- GitHub：`anthonyanti12397-arch/macroday1`
- 網域：`marco-day.com`（已買，**尚未接上 Vercel**）
- 內部 package 名仍叫 `fuelweek`（歷史遺留，非錯誤）

**目標市場：台灣 + 香港，繁體中文為主、英文次之。** 不做簡體、不做中國大陸
（牆內需要另一套 stack：微信登入、支付寶、國內 LLM、國內廣告聯盟、ICP 備案）。

**商業模式：全功能免費 + 廣告支持。沒有訂閱、沒有 IAP。**

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Next.js 14 (App Router) + React 18 + TS + Tailwind + Framer Motion |
| 認證 | NextAuth v4 — Google OAuth、Sign in with Apple、Email OTP (Resend)、訪客模式 |
| 資料庫 | Prisma + Neon PostgreSQL |
| AI 文字 | Grok (xAI) `grok-4.20-0309-non-reasoning` |
| AI 圖片 | SiliconFlow FLUX.1-schnell |
| 廣告 | Web: Google AdSense banner／Native: AdMob banner + rewarded video |
| 原生 | Capacitor 8（iOS，用 SPM 不用 CocoaPods） |
| 部署 | Vercel |

---

## ⚠️ 動手前必讀的地雷

1. **AI 路由一定要設 `export const maxDuration = 60`**
   Vercel 預設 10 秒 timeout，Grok 生成常常超過（7 日計劃要 15–25 秒）。
   漏設會造成「有時 run 有時唔 run」的間歇性失敗。**新增任何 AI 路由都要記得加。**

2. **訪客模式是一等公民**
   使用者不用登入就能生成餐單。任何新 API **不要預設要求 next-auth session**——
   曾經 `/api/generate-image` 硬性擋登入，導致訪客全部看到空白餐卡。

3. **語言統一走 `useLang()`（`contexts/LangContext`）**
   不要自己用 `navigator.language` 判斷。LoginScreen 以前這樣做，
   造成登入頁英文、其他頁中文的混亂。**預設繁中。**

4. **菜系是台港導向**
   `PreferredCuisine` = HongKong / Taiwanese / ChineseHome / JapaneseKorean /
   HealthyLight / HighProtein，預設 `ChineseHome`。
   （本專案源自阿根廷/拉美模板，若看到 Argentine 之類殘留就是漏改的。）

5. **沒有付費層了 — 不要用 `isPro` 鎖功能**
   `canUseFeature()` 一律回 true。用 `isPro` 鎖新功能等於永遠沒人能解鎖。
   要限制就限制**生成量**（那是唯一真實成本），透過 `canGenerateDaily()`。

6. **App Store 3.1.1：原生 app 內不能有外部付款連結**
   台港不適用美國區的放寬。`DonationBox` 因此在 native 隱藏。
   新增任何付款相關 UI 都要用 `isAdMobAvailable()` 擋掉 native。

---

## 廣告經濟模型（為什麼能收支平衡）

| 項目 | 金額 |
|---|---|
| 一次 AI 生成（餐單 + 3 張圖） | ~$0.005 |
| 一次 AdMob rewarded video（台港 eCPM $8–15） | ~$0.01 |

**設計原則：額外生成一律綁在 rewarded 廣告後面**，
每次額外生成由它自己那支廣告付錢 → 成本結構上不可能超過收入。

- 免費每日 `FREE_DAILY_LIMIT = 2` 次（由 banner 曝光支撐）
- 看廣告最多再 `MAX_AD_REWARDS_PER_DAY = 10` 次
- 常數都在 `lib/constants.ts`

> 真 rewarded video 只有原生 AdMob 才有；web AdSense 只有 banner。
> 所以「廣告養活自己」本質上要靠上架 App Store。

---

## 🎯 接下來要做的事

### 第一優先：上架 App Store

完整步驟見 **`APP_STORE_SUBMISSION.md`**（含 App Store Connect 隱私問卷逐項答案）。

- [ ] **裝 Xcode**（目前只有 Command Line Tools，無法編譯/上傳）
      裝完執行 `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
      ⚠️ 需要 40GB+ 空間
- [ ] **換掉 AdMob 測試 ID** —— `ios/App/App/Info.plist` 的 `GADApplicationIdentifier`
      現在是 Google 公開範例 ID，**不換的話 app 一啟動就 crash**
- [ ] 建 AdMob banner / rewarded ad unit → 設 Vercel env
      `NEXT_PUBLIC_ADMOB_BANNER_ID`、`NEXT_PUBLIC_ADMOB_REWARDED_ID`
- [ ] 設 Apple 登入憑證（`APPLE_OAUTH_SETUP.md`）→ env
      `APPLE_CLIENT_ID`、`APPLE_CLIENT_SECRET`
      ※ Apple Developer 帳號**已登入**
- [ ] `npm run build:ios` → `npx cap open ios` → Xcode Archive → 上傳
- [ ] 實機測試：廣告會出現、看完真的加配額、刪除帳號真的清資料
- [ ] App Store Connect：截圖（6.7 吋 1290×2796）、隱私標籤、審核備註

### ⚠️ 最大拒絕風險：Guideline 4.2（最低功能性）

`capacitor.config.ts` 的 `server.url` 指向線上站，等於原生 app 是**遠端網站的殼**，
Apple 對包殼審查很嚴。

**有利因素**（已具備）：相機、Haptics、本地通知、AdMob、ATT 權限流程。
**對策**：在 App Review Notes 明列原生功能 + 說明可用訪客模式直接體驗。
若真被拒，再考慮改成打包本地資源（大工程，別提前做）。

### 第二優先：其他待辦

- [ ] **接網域** marco-day.com → Vercel（Domains 設定 + 註冊商改 DNS）
- [ ] **Rotate 憑證**：Stripe `sk_live_`（曾以明文存在筆記中）
- [ ] **Web 版 AdSense**：建 banner ad unit → 設 `NEXT_PUBLIC_ADSENSE_SLOT_BANNER`
      （設定前顯示佔位框，設定後自動變真廣告）
- [ ] 上架後：觀察廣告 eCPM 與 API 成本是否真的平衡，再調 `MAX_AD_REWARDS_PER_DAY`

---

## 開發指令

```bash
npm run dev
```

```bash
npm run build
```

```bash
npx cap sync ios
```

```bash
vercel --prod --yes
```

> git push 用 `gh` 的認證（remote 已清掉嵌入的舊 token）。

---

## 專案慣例

- **驗證要靠實證**：改完跑 `npx tsc --noEmit`，UI 改動要開瀏覽器截圖確認，
  API 改動用 curl 打實際端點。不要只靠「看起來對」。
- **一個修復一個 commit**，訊息說明**為什麼**改，不只是改了什麼。
- 原生功能一律走 `lib/ios-bridge.ts` / `lib/admob.ts` 的慣例：
  `isNative` 判斷 + web 優雅降級。
- 使用者輸入進 LLM prompt 前一定要過 `sanitizePromptInput()`（防 prompt injection）。
- **回覆使用者用繁體中文。**

---

## 重要檔案

| 檔案 | 用途 |
|---|---|
| `APP_STORE_SUBMISSION.md` | 上架完整指南 + 隱私問卷答案 |
| `APPLE_OAUTH_SETUP.md` | Apple 登入憑證設定教學 |
| `lib/constants.ts` | 配額、模型、廣告 ID 等所有常數 |
| `lib/featureGate.ts` | 配額邏輯（功能已全免費） |
| `lib/prompts.ts` | Grok prompt 組裝（含菜系、體組成、體重趨勢） |
| `lib/admob.ts` | AdMob 封裝（native only） |
| `lib/storage.ts` | localStorage 全部讀寫 |
