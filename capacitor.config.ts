import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xyz.vernam',
  appName: 'vernam',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
