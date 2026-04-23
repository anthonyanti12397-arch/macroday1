import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.macroday.app',
  appName: 'MacroDay',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For iOS dev: start 'npm run dev' in another terminal before running 'npx cap run ios'
    url: 'http://localhost:3000',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 300
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#121826'
    }
  }
};

export default config;
