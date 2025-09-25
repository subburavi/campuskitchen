import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import OrderScreen from '../screens/OrderScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MealRatingScreen from '../screens/MealRatingScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { apiService } from '../services/apiService';
import { Platform, Alert, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom hook to refresh tab data
const useTabRefresh = (refreshFunction) => {
  const isFocused = useIsFocused();
  
  React.useEffect(() => {
    if (isFocused) {
      refreshFunction();
    }
  }, [isFocused]);
};

function DashboardStack() {
  const {user} = useAuth();
  const {expoPushToken}=useNotifications();
useEffect(() => {
  const registerToken = async () => {
    if (expoPushToken) {
      try {
        await apiService.registerPushToken(expoPushToken, Platform.OS);
      } catch (err) {
        console.error('Push token registration failed:', err);
      }
    }
  };

  registerToken();
}, [user, expoPushToken]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      
       <Stack.Screen name="DashboardMain" component={DashboardScreen} />
              <Stack.Screen name="MealPlan" component={MealPlanScreen} />

      <Stack.Screen name="MealRating" component={MealRatingScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
           <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />

      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function OrderStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="OrderMain" component={OrderScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Order') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'Subscription') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={(e) => {
              
              if (props.accessibilityState?.selected) {
              
                switch (props.route?.name) {
                  case 'Dashboard':
                   
                    break;
                  case 'Order':
                   
                    break;
                  case 'Subscription':
                   
                    break;
                  case 'Profile':
                    
                    break;
                }
              }
              props.onPress?.(e);
            }}
          />
        ),
        tabBarActiveTintColor: '#1c3c80',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingTop: 10,
          height: 80,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb'
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5
        }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Order" 
        component={OrderStack}
        options={{ tabBarLabel: 'Order' }}
      />
      <Tab.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{ tabBarLabel: 'Subscription' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}