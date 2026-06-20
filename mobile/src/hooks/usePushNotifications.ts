import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Only register if authenticated
        if (!isAuthenticated) {
            return;
        }

        registerForPushNotificationsAsync().then(async (token) => {
            if (token) {
                setExpoPushToken(token);
                // Save token to backend
                try {
                    await api.patch('/users/me/push-token', { token });
                    console.log('Push token saved to backend');
                } catch (error) {
                    console.warn('Failed to save push token:', error);
                }
            }
        });

        // Notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                setNotification(notification);
                console.log('Notification received');
            }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('Notification response received');
                handleNotificationPress(response.notification);
            }
        );

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [isAuthenticated, user?.id]);

    const handleNotificationPress = (notification: Notifications.Notification) => {
        const data = notification.request.content.data;

        // Handle navigation based on notification type
        // You can use router.push here based on data.type
        // Example:
        // if (data.type === 'campaign_assigned') {
        //   router.push('/(tabs)/campaigns');
        // }
    };

    const removePushToken = async () => {
        try {
            await api.delete('/users/me/push-token');
            setExpoPushToken(null);
            console.log('Push token removed from backend');
        } catch (error) {
            console.warn('Failed to remove push token:', error);
        }
    };

    return {
        expoPushToken,
        notification,
        removePushToken,
    };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    // Check if physical device
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Android-specific channel setup
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6B4423',
        });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
    }

    // Get Expo push token
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) {
            console.warn('No projectId found for push notifications');
            // For development, still try to get token
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        token = tokenData.data;
        console.log('Expo Push Token acquired');
    } catch (error) {
        console.error('Failed to get push token:', error);
    }

    return token;
}

export default usePushNotifications;
