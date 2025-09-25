import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Notification handler (controls how notifications behave when received)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Create React Context
const NotificationContext = createContext();

// Custom hook to use notifications context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Request permissions and get push token
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);

        
          apiService.registerPushToken(token, Platform.OS)
            .then(() => console.log('Push token registered:', token))
            .catch(error => console.error('Failed to register push token:', error));
        
      }
    });

    // Listener: when a notification is received
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Listener: when user taps a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Cleanup listeners
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Function to register device for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2b377d',
      });
    }

    // Physical device check
    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      alert('Permission not granted for push notifications!');
      return null;
    }

    // Get Expo Push Token
    try {
      const { data } = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      console.log('Expo Push Token:', data);
      token = data;
      return token;
    } catch (err) {
      console.error('Error getting push token:', err);
      return null;
    }

    return token;
  };

  // Send local notification (useful for testing)
  const sendLocalNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null, // send immediately
    });
  };

  // Context value
  const value = {
    expoPushToken,
    notifications,
    sendLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
