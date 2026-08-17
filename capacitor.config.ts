import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.macroday.app',
  appName: 'MacroDay',
  // MacroDay uses server-side API routes, so we point the iOS shell to the live Vercel app.
  // The webDir is only used as a fallback if the server is unreachable.
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Production: points to Vercel. All /api/* calls work normally.
    url: 'https://macroday1.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 300
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#121826'
    },
    AdMob: {
      // Ad-supported model: banners + rewarded video fund the free tier.
      // Requires GADApplicationIdentifier in ios/App/App/Info.plist and
      // NSUserTrackingUsageDescription for iOS 14+ ATT.
      initializeForTesting: false,
      tagForChildDirectedTreatment: false
    }
  }
};

export default config;
