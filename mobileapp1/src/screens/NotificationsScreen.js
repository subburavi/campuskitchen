import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationsScreen() {
  const { notifications: localNotifications } = useNotifications();
  const [serverNotifications, setServerNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.getNotifications();
      setServerNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setServerNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read first
    if (!notification.read && notification.type !== 'local') {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'rating' && notification.mealPlan) {
      navigation.navigate('MealRating', { 
        meal: {
          id: notification.mealPlan.id,
          dishName: notification.mealPlan.dishes.map(d => d.dish.name).join(', '),
          mealType: notification.mealPlan.meal,
          time: getMealTime(notification.mealPlan.meal)
        }
      });
    } else if (notification.type === 'subscription') {
      navigation.navigate('Subscription');
    }
  };

  const getMealTime = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST': return '7:30 AM - 9:30 AM';
      case 'LUNCH': return '12:00 PM - 2:00 PM';
      case 'SNACKS': return '4:00 PM - 5:30 PM';
      case 'DINNER': return '7:00 PM - 9:00 PM';
      default: return '';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meal':
        return 'restaurant-outline';
      case 'announcement':
        return 'megaphone-outline';
      case 'reminder':
        return 'time-outline';
      case 'rating':
        return 'star-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'meal':
        return 'text-green-600';
      case 'announcement':
        return 'text-blue-600';
      case 'reminder':
        return 'text-orange-600';
      case 'rating':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
     const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  const allNotifications = [
    ...localNotifications.map(notif => ({
      id: `local-${notif.date}`,
      title: notif.request.content.title,
      message: notif.request.content.body,
      type: 'local',
      timestamp: notif.createdAt,
      read: false
    })),
    ...serverNotifications
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
 
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">Notifications</Text>
        <Text className="text-white opacity-80 mt-1">
          {allNotifications.filter(n => !n.read).length} unread notifications
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {allNotifications.length > 0 ? (
          allNotifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              className={`bg-white rounded-2xl p-4 mb-3 shadow-sm ${
                !notification.read ? 'border-l-4 border-primary' : ''
              }`}
            >
              <View className="flex-row items-start">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  !notification.read ? 'bg-primary' : 'bg-gray-100'
                }`}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color={!notification.read ? '#fff' : '#666'}
                  />
                </View>
                
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className={`text-lg font-semibold ${
                      !notification.read ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {notification.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatTime(notification.timestamp || notification.createdAt)}
                    </Text>
                  </View>
                  
                  <Text className="text-gray-600 text-sm leading-5">
                    {notification.message}
                  </Text>
                  
                  {!notification.read && (
                    <View className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center mt-6">
            <Ionicons name="notifications-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4">No notifications</Text>
            <Text className="text-gray-400 text-center mt-2">
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}