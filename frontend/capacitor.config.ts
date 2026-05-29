import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Shorts100.app',
  appName: 'Shorts100',
  webDir: 'out',
  server: {
    url: 'https://shorts100.firemarkets.net',
    cleartext: false,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '828066610288-b1jqjjm5tpiresrilivgtcilumiqpq9j.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
