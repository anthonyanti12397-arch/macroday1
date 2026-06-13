'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

const LAST_UPDATED = '2026-06-13'
const CONTACT_EMAIL = 'privacy@marco-day.com'

export default function PrivacyPage() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <Link href="/" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
          <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          {zh ? '隱私權政策' : 'Privacy Policy'}
        </h1>
      </div>

      <div className="card-lg p-6 space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
          <ShieldCheck size={24} className="shrink-0" />
          <p className="text-sm font-bold">
            {zh
              ? '未登入時，您的數據只存於本機。登入後，我們會將您的健康與餐單數據安全同步至雲端，讓您跨裝置使用。'
              : 'In guest mode your data stays on your device. When you sign in, we securely sync your health and meal data to the cloud so you can use MacroDay across devices.'}
          </p>
        </div>

        <p className="text-xs text-slate-400">
          {zh ? `最後更新：${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`}
        </p>

        {/* 1. Who we are */}
        <Section title={zh ? '1. 關於本政策' : '1. About This Policy'}>
          {zh
            ? 'MacroDay（「我們」）是一款 AI 驅動的營養與健身輔助應用程式。本政策說明我們收集哪些資料、如何使用與儲存、與哪些第三方分享，以及您對自己資料擁有的權利。使用 MacroDay 即表示您同意本政策所述的做法。'
            : 'MacroDay ("we", "us") is an AI-powered nutrition and fitness companion app. This policy explains what data we collect, how we use and store it, which third parties we share it with, and the rights you have over your own data. By using MacroDay you agree to the practices described here.'}
        </Section>

        {/* 2. Data we collect */}
        <Section title={zh ? '2. 我們收集的資料' : '2. Data We Collect'}>
          <p className="mb-3">
            {zh ? '依您使用的功能，我們可能收集：' : 'Depending on the features you use, we may collect:'}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>{zh ? '帳號資料' : 'Account data'}：</strong>
              {zh
                ? '電子郵件地址、顯示名稱、個人頭像（若以 Google 登入）。'
                : 'email address, display name, and profile picture (if you sign in with Google).'}
            </li>
            <li>
              <strong>{zh ? '健康與身體數據' : 'Health & body data'}：</strong>
              {zh
                ? '體重、身高、年齡、性別、體脂率、骨骼肌量、基礎代謝率（BMR）、內臟脂肪等級、體水分，以及您輸入的飲食目標與偏好。這些屬於敏感個人資料，我們僅用於為您生成個人化的餐單與訓練建議。'
                : 'weight, height, age, gender, body-fat percentage, skeletal muscle mass, basal metabolic rate (BMR), visceral fat level, body water, plus the dietary goals and preferences you enter. This is sensitive personal data and is used solely to generate your personalized meal and training plans.'}
            </li>
            <li>
              <strong>{zh ? '使用內容' : 'Usage content'}：</strong>
              {zh
                ? '生成的餐單、訓練計畫、收藏、每日打卡記錄、連續達標天數，以及您在社群論壇發佈的貼文、留言與按讚。'
                : 'generated meal plans, training plans, favorites, daily check-ins, streaks, and any posts, replies and likes you make in the community forum.'}
            </li>
            <li>
              <strong>{zh ? '付款資料' : 'Payment data'}：</strong>
              {zh
                ? '訂閱狀態與帳單記錄。實際的信用卡資料由 Stripe 直接處理與儲存，我們從不接觸或儲存您的完整卡號。'
                : 'subscription status and billing history. Actual card details are processed and stored directly by Stripe — we never see or store your full card number.'}
            </li>
            <li>
              <strong>{zh ? '上傳的圖片' : 'Uploaded images'}：</strong>
              {zh
                ? '若您上傳餐點照片或 InBody 截圖，圖片會傳送給 AI 服務做辨識，並可能存於我們的圖片儲存空間。'
                : 'if you upload meal photos or InBody screenshots, the image is sent to an AI service for recognition and may be stored in our image storage.'}
            </li>
          </ul>
        </Section>

        {/* 3. How data is stored */}
        <Section title={zh ? '3. 資料如何儲存' : '3. How Your Data Is Stored'}>
          <p className="mb-2">
            <strong>{zh ? '未登入（訪客模式）' : 'Guest mode (not signed in)'}：</strong>
            {zh
              ? '資料只存在您瀏覽器的本機儲存空間（LocalStorage），不會上傳到我們的伺服器。清除瀏覽器資料或重設應用程式會永久刪除這些資料。'
              : 'data is kept only in your browser’s LocalStorage and is not uploaded to our servers. Clearing your browser data or resetting the app permanently deletes it.'}
          </p>
          <p>
            <strong>{zh ? '已登入' : 'Signed in'}：</strong>
            {zh
              ? '我們會將上述資料安全儲存於託管在美國的 Neon PostgreSQL 資料庫，並透過加密連線（TLS）傳輸，讓您能跨裝置同步。資料庫存取受到嚴格控管。'
              : 'we securely store the data above in a Neon PostgreSQL database hosted in the United States, transmitted over encrypted (TLS) connections, so it can sync across your devices. Database access is tightly controlled.'}
          </p>
        </Section>

        {/* 4. AI processing */}
        <Section title={zh ? '4. AI 數據處理' : '4. AI Data Processing'}>
          {zh
            ? '當您生成餐單、訓練計畫或辨識食物照片時，相關的營養參數（如身高、體重、目標、偏好）與圖片會傳送給第三方 AI 服務進行處理。我們不會將您的姓名或電子郵件等身分識別資訊與這些數據一同傳送。我們使用的 AI 供應商包括：xAI（Grok）、Anthropic（Claude）、Together AI 與 SiliconFlow。'
            : 'When you generate a plan or identify a food photo, the relevant nutrition parameters (height, weight, goals, preferences) and images are sent to third-party AI services for processing. We do NOT send identifying information such as your name or email alongside this data. Our AI providers include: xAI (Grok), Anthropic (Claude), Together AI, and SiliconFlow.'}
        </Section>

        {/* 5. Third parties */}
        <Section title={zh ? '5. 第三方服務' : '5. Third-Party Services'}>
          <p className="mb-3">
            {zh
              ? '我們依賴下列受信任的服務供應商來營運 MacroDay。每家供應商只接收提供其服務所需的最少資料：'
              : 'We rely on the following trusted providers to operate MacroDay. Each receives only the minimum data needed to provide its service:'}
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Vercel</strong> — {zh ? '應用程式託管與圖片儲存' : 'app hosting and image storage'}</li>
            <li><strong>Neon</strong> — {zh ? 'PostgreSQL 資料庫託管' : 'PostgreSQL database hosting'}</li>
            <li><strong>Google</strong> — {zh ? 'OAuth 登入' : 'OAuth sign-in'}</li>
            <li><strong>Resend</strong> — {zh ? '寄送電子郵件驗證碼' : 'sending email verification codes'}</li>
            <li><strong>Stripe</strong> — {zh ? '訂閱付款處理' : 'subscription payment processing'}</li>
            <li><strong>xAI / Anthropic / Together AI / SiliconFlow</strong> — {zh ? 'AI 內容與圖片生成' : 'AI content and image generation'}</li>
          </ul>
          <p className="mt-3">
            {zh
              ? '我們不會將您的個人資料出售給任何人，也不會用於第三方廣告定向。'
              : 'We do not sell your personal data to anyone, nor do we use it for third-party ad targeting.'}
          </p>
        </Section>

        {/* 6. Community */}
        <Section title={zh ? '6. 社群功能' : '6. Community Features'}>
          {zh
            ? '若您使用社群論壇、好友或排行榜功能，您的顯示名稱、頭像、貼文內容、達標記錄與步數可能對其他用戶可見。請勿在公開貼文中分享您不願公開的敏感資料。'
            : 'If you use the community forum, friends, or leaderboard features, your display name, avatar, post content, check-in records, and step counts may be visible to other users. Do not share sensitive data you wish to keep private in public posts.'}
        </Section>

        {/* 7. Retention */}
        <Section title={zh ? '7. 資料保留' : '7. Data Retention'}>
          {zh
            ? '只要您的帳號存在，我們就會保留您的資料。當您要求刪除帳號時，我們會在 30 天內刪除您儲存在資料庫中的個人資料（依法律要求須保留的帳單記錄除外，例如稅務紀錄）。'
            : 'We retain your data for as long as your account exists. When you request account deletion, we delete your personal data from our database within 30 days, except billing records we are legally required to keep (e.g. for tax purposes).'}
        </Section>

        {/* 8. Your rights */}
        <Section title={zh ? '8. 您的權利' : '8. Your Rights'}>
          <p className="mb-2">
            {zh
              ? '依適用法律（包括香港《個人資料（私隱）條例》及歐盟 GDPR），您有權：'
              : 'Under applicable law (including the Hong Kong PDPO and the EU GDPR), you have the right to:'}
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>{zh ? '查閱我們持有關於您的個人資料' : 'access the personal data we hold about you'}</li>
            <li>{zh ? '更正不準確的資料' : 'correct inaccurate data'}</li>
            <li>{zh ? '要求刪除您的帳號與資料' : 'request deletion of your account and data'}</li>
            <li>{zh ? '匯出您的資料' : 'export your data'}</li>
          </ul>
          <p className="mt-2">
            {zh
              ? `如需行使任何權利，請來信 ${CONTACT_EMAIL}。`
              : `To exercise any of these rights, email ${CONTACT_EMAIL}.`}
          </p>
        </Section>

        {/* 9. Security */}
        <Section title={zh ? '9. 資料安全' : '9. Data Security'}>
          {zh
            ? '我們採取適當的技術與組織措施保護您的資料，包括傳輸加密（TLS）、密碼學簽署的登入驗證碼，以及受控的資料庫存取。但沒有任何系統能保證 100% 安全。若您清除瀏覽器快取或重設應用程式，本機儲存的資料將無法復原（除非已登入並同步至雲端）。'
            : 'We use appropriate technical and organizational measures to protect your data, including encryption in transit (TLS), cryptographically signed login codes, and controlled database access. No system can guarantee 100% security. If you clear your browser cache or reset the app, locally stored data cannot be recovered (unless you are signed in and synced to the cloud).'}
        </Section>

        {/* 10. Children */}
        <Section title={zh ? '10. 兒童隱私' : '10. Children’s Privacy'}>
          {zh
            ? 'MacroDay 不適合 16 歲以下的兒童使用，我們不會在知情的情況下收集兒童的個人資料。若您認為兒童向我們提供了資料，請來信通知我們刪除。'
            : 'MacroDay is not intended for children under 16, and we do not knowingly collect data from children. If you believe a child has provided us data, contact us and we will delete it.'}
        </Section>

        {/* 11. International */}
        <Section title={zh ? '11. 國際資料傳輸' : '11. International Data Transfers'}>
          {zh
            ? '我們的伺服器與服務供應商主要位於美國。使用 MacroDay 即表示您理解您的資料可能會被傳輸至您所在國家／地區以外的地方處理。'
            : 'Our servers and service providers are primarily located in the United States. By using MacroDay you understand your data may be transferred and processed outside your country or region.'}
        </Section>

        {/* 12. Changes & contact */}
        <Section title={zh ? '12. 政策變更與聯絡方式' : '12. Changes & Contact'}>
          {zh
            ? `我們可能不時更新本政策，並會在此頁面更新「最後更新」日期。重大變更我們會儘可能通知您。如有任何隱私相關問題，請來信 ${CONTACT_EMAIL}。`
            : `We may update this policy from time to time and will revise the "Last updated" date above. We will notify you of material changes where possible. For any privacy questions, email ${CONTACT_EMAIL}.`}
        </Section>

        <footer className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          {zh ? `最後更新：${LAST_UPDATED}` : `Updated: ${LAST_UPDATED}`}
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-800 dark:text-white">{title}</h2>
      <div>{children}</div>
    </section>
  )
}
