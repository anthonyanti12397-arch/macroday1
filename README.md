# 🥗 MacroDay — AI-Powered Nutrition & Meal Coach

**MacroDay** is a premium, mobile-first AI meal planner designed for gym enthusiasts. It transforms your **InBody** body composition data into personalized, high-performance meal plans. Powered by the latest Grok-3 Mini AI, it calculates precise calorie/protein targets and generates full recipes, shopping lists, and progress charts.

![MacroDay Banner](https://macroday.vercel.app/api/og) *(Placeholder for OG image)*

---

## ✨ Key Features

- **🚀 Instant Generation**: Cached AI logic for near-zero latency on returning users.
- **💳 $1 Lifetime Pro**: Integrated Stripe checkout for premium features.
- **📄 High-Quality PDF**: Brand-aware meal plan exports for sharing with coaches.
- **📲 Social Sharing**: One-tap "viral card" generation (3x High-DPI) for IG/WhatsApp Stories.
- **🇭🇰 Localized Intelligence**: AI understands local cuisine context (e.g., Hong Kong Cha Chaan Teng, Healthy takeout options).
- **📱 PWA Ready**: Install MacroDay on your home screen for a native app experience.
- **📊 Deep Progress Tracking**: "Initial vs Current" InBody comparisons with directional insights.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Vanilla CSS + Tailwind + Glassmorphism UX |
| **Animations** | Framer Motion |
| **AI Engine** | Grok-3 Mini via xAI API |
| **Payment** | Stripe API |
| **Visuals** | html2canvas + jsPDF (Exports) |
| **Feedback** | Sonner (Toasts) + Confetti.js (Celebrations) |

---

## 🚀 Quick Start

```bash
# 1. Clone & Install
npm install

# 2. Configure Environment
cp .env.local.example .env.local
# Set XAI_API_KEY, STRIPE_SECRET_KEY, etc.

# 3. Launch
npm run dev
```

---

## 🌍 Internationalization

MacroDay supports full **Traditional Chinese (繁體中文)** and **English** switching, including AI-generated content (recipes, ingredients, and local restaurant names).

---

## 📦 Project Structure

- `app/api/checkout`: Stripe payment handling.
- `app/api/generate-meals`: High-intelligence Grok prompts for 7-day plans.
- `components/ShareButton`: High-DPI canvas capture for social media.
- `components/ExportPDFButton`: Document generation logic.
- `hooks/useGuestSession`: No-auth-required local-first state management.

---

## 📄 License

MIT. Built with ❤️ for the gym community.
