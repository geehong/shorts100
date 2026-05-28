import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shorts100.app',
  appName: 'Shorts100',
  webDir: 'out',
  server: {
    url: 'https://shorts100.firemarkets.net',
    cleartext: false,
  },
};

export default config;
