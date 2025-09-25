import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import QRScanScreen from '../screens/QRScanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MealRatingScreen from '../screens/MealRatingScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import OrderScreen from '../screens/OrderScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2b377d',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen  name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard',headerShown:false }} />
      <Stack.Screen name="MealRating" component={MealRatingScreen} options={{ title: 'Rate Meal' }} />
      <Stack.Screen name="QRScan" component={QRScanScreen} options={{ title: 'Scan QR Code' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
      <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Order Food' }} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: 'Order Confirmed' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Track Order' }} />
        <Stack.Screen name="PaymentScreen" component={require('../screens/PaymentScreen').default} options={{ title: 'Payment' }} />

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
          } else if (route.name === 'MealPlan') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Order') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Subscription') {
            iconName = focused ? 'card' : 'card-outline';
          }

          return <Ionicons name={iconName} style={{paddingTop:10}} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2b377d',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle:{paddingTop:0,height:80,paddingBottom:10}
      })}
    >
      <Tab.Screen name="Dashboard"   component={DashboardStack} />
      <Tab.Screen name="MealPlan" component={MealPlanScreen} />
      <Tab.Screen name="Order" component={OrderScreen} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}