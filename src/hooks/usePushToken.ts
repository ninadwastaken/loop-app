// src/hooks/usePushToken.ts
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export default function usePushToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function registerForPush() {
      if (!Constants.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return;
      }

      // 1) Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 2) Request if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return;
      }

      // 3) Get the Expo push token
      const { data: expoToken } = await Notifications.getExpoPushTokenAsync();
      if (mounted) setToken(expoToken);
    }

    registerForPush();

    return () => {
      mounted = false;
    };
  }, []);

  return token;
}