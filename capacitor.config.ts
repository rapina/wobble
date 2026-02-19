import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sputnik.wobble',
  appName: 'Wobble',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
