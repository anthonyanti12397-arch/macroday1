# MacroDay — App Store 上架指南

最後更新：2026-08-22

商業模式：**全功能免費，由廣告支持**（無訂閱、無 IAP）。

---

## 一、程式碼層面已完成 ✅

| 項目 | 狀態 | 說明 |
|---|---|---|
| Sign in with Apple | ✅ | Guideline 4.8 要求。env-gated，需設憑證才會出現 |
| App 內刪除帳號 | ✅ | Guideline 5.1.1(v) 強制。設定頁底部，兩段確認 |
| 隱私權政策頁 | ✅ | `/legal/privacy`（上架表單要填這個網址） |
| 使用條款 | ✅ | `/legal/terms` |
| PrivacyInfo.xcprivacy | ✅ | 已註冊進 Xcode 專案的 Resources |
| AdMob（rewarded + banner） | ✅ | 已整合，**但 ad unit ID 仍是測試值** |
| ATT 授權（iOS 14+） | ✅ | `NSUserTrackingUsageDescription` 已設 |
| App 圖示 1024×1024 無 alpha | ✅ | 已驗證 |
| Launch screen | ✅ | 已存在 |
| 移除 app 內 Stripe 付款 | ✅ | 捐款框在原生 app 隱藏（3.1.1 合規） |

---

## 二、你必須自己做的（我無法遠端代做）

### 1. 🔴 安裝 Xcode（目前只有 Command Line Tools）

沒有 Xcode 就無法編譯、無法上傳。從 Mac App Store 安裝（約 40GB+）。

> ⚠️ 你的磁碟目前剩約 55GB，安裝過程會很緊。建議先清出空間。

安裝後執行：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### 2. 🔴 換掉 AdMob 測試 ID（不換會出事）

目前 `ios/App/App/Info.plist` 的 `GADApplicationIdentifier` 是 **Google 的公開範例 ID**。
如果沒換成你自己的，**app 一啟動就會 crash**。

步驟：
1. 到 [AdMob 後台](https://admob.google.com) 建立 app（選 iOS）
2. 複製 App ID（格式 `ca-app-pub-XXXXXXXX~YYYYYYYY`，注意是 `~` 不是 `/`）
3. 替換 `Info.plist` 裡的 `GADApplicationIdentifier`
4. 再建立兩個 ad unit：一個 **Banner**、一個 **Rewarded**
5. 把 ad unit ID 設成 Vercel 環境變數：

```bash
vercel env add NEXT_PUBLIC_ADMOB_BANNER_ID production
vercel env add NEXT_PUBLIC_ADMOB_REWARDED_ID production
```

### 3. Apple Developer 帳號（US$99/年）

上架必須。註冊：https://developer.apple.com/programs/

### 4. 設定 Sign in with Apple 憑證

參考 repo 內的 `APPLE_OAUTH_SETUP.md`，取得後設環境變數：

```bash
vercel env add APPLE_CLIENT_ID production
vercel env add APPLE_CLIENT_SECRET production
```

> 未設定時 Apple 登入按鈕不會出現 —— 但**上架審核時一定要能出現**，否則違反 4.8。

### 5. 打包與上傳

```bash
npm run build:ios
```

```bash
npx cap open ios
```

在 Xcode 中：
1. 選 **Any iOS Device (arm64)**
2. Signing & Capabilities → 選你的 Team，勾選 **Sign in with Apple** capability
3. Product → Archive
4. Distribute App → App Store Connect

---

## 三、App Store Connect 隱私問卷（照這樣填）

**Does this app collect data?** → Yes

| 資料類型 | 用途 | 連結身分 | 用於追蹤 |
|---|---|---|---|
| Email Address | App 功能 | 是 | 否 |
| Health & Fitness | App 功能 | 是 | 否 |
| Photos or Videos | App 功能 | 是 | 否 |
| Device ID | 第三方廣告 | 否 | **是** |
| Product Interaction | 廣告 / 分析 | 否 | **是** |

**Does this app use tracking?** → **Yes**（AdMob 個人化廣告）

其他欄位：
- Privacy Policy URL：`https://macroday1.vercel.app/legal/privacy`
- Support URL：你的網站或聯絡頁
- Age Rating：建議 **4+**（無不當內容）；健康建議類 app 通常不需要提高分級

---

## 四、⚠️ 主要拒絕風險：Guideline 4.2（最低功能性）

**這是你最需要注意的一點。**

`capacitor.config.ts` 目前設定 `server.url` 指向 `https://macroday1.vercel.app`，
也就是原生 app 實際上是**載入遠端網站的殼**。Apple 對這種「網站包殼」審查很嚴，
常見拒絕理由是「與網站無異，缺乏原生體驗」。

**有利因素**（你已具備）：
- 相機（拍照識別食物）
- 觸覺回饋（Haptics）
- 本地通知
- AdMob 原生廣告
- ATT 權限流程

**降低風險的建議**：
1. 在審核備註（App Review Notes）中**明確列出原生功能**，說明不只是網頁
2. 提供審核員測試帳號（或說明可用「訪客模式」直接體驗）
3. 若被拒，考慮改為打包靜態資源到本地（移除 `server.url`），
   讓 app 真正在裝置上執行，只有 API 呼叫走網路

---

## 五、送審前最後檢查

- [ ] Xcode 已安裝且 `xcode-select` 指向它
- [ ] `GADApplicationIdentifier` 已換成真實 AdMob App ID
- [ ] AdMob banner / rewarded ad unit ID 已設為環境變數
- [ ] Apple 登入憑證已設，且登入頁真的看得到 Apple 按鈕
- [ ] 實機測試：廣告會出現、看完廣告真的加配額
- [ ] 實機測試：設定頁可以刪除帳號，刪完資料真的消失
- [ ] App Review Notes 已寫明原生功能（見上方 4.2 風險）
- [ ] 截圖：至少 6.7 吋 iPhone 尺寸（1290×2796）

