import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [qrCode, setQrCode] = useState("notvalid");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
const [hasActivePackage, setHasActivePackage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mealTimes, setMealTimes] = useState(null);
 const isFocused = useIsFocused();
  useEffect(() => {
    if(isFocused){
      loadDashboardData();
    }
   
  }, [isFocused]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [mealsData, qrData, subscriptionData, notificationCount] = await Promise.all([
        apiService.getTodaysMeals(),
        apiService.generateQRCode(),
        apiService.getCurrentSubscription(),
        apiService.getUnreadNotificationCount()
      ]);
console.log('Today meals data:', qrData);
      setTodaysMeals(mealsData);
      setQrCode('SUB-'+user.registerNumber || "notvalid");
      setHasActivePackage(qrData.status=='active' ? true : false);
      setCurrentSubscription(subscriptionData);
      setUnreadCount(notificationCount.count);
      // fetch meal times for dynamic current meal calculation
      try {
        const mt = await apiService.getMealTimes();
        setMealTimes(mt);
      } catch (e) {
        console.warn('Failed to fetch meal times, using defaults');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleMealRating = (meal) => {
    navigation.navigate('MealRating', { meal });
  };

  const getCurrentMealType = () => {
    // Use fetched mealTimes if available for dynamic ranges
    if (mealTimes) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

      const within = (start, end, t) => {
        // start/end in 'HH:MM'
        if (!start || !end) return false;
        return t >= start && t <= end;
      };

      if (within(mealTimes.breakfast_start, mealTimes.breakfast_end, timeStr)) return 'BREAKFAST';
      if (within(mealTimes.lunch_start, mealTimes.lunch_end, timeStr)) return 'LUNCH';
      if (within(mealTimes.snacks_start, mealTimes.snacks_end, timeStr)) return 'SNACKS';
      if (within(mealTimes.dinner_start, mealTimes.dinner_end, timeStr)) return 'DINNER';
      return 'CLOSED';
    }

    // fallback to static ranges
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 10) return 'BREAKFAST';
    if (hour >= 12 && hour < 13) return 'LUNCH';
    if (hour >= 16 && hour < 18) return 'SNACKS';
    if (hour >= 19 && hour < 22) return 'DINNER';
    return 'CLOSED';
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST': return 'sunny-outline';
      case 'LUNCH': return 'restaurant-outline';
      case 'SNACKS': return 'cafe-outline';
      case 'DINNER': return 'moon-outline';
      default: return 'restaurant-outline';
    }
  };

  const getMealColor = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST': return '#f59e0b';
      case 'LUNCH': return '#10b981';
      case 'SNACKS': return '#8b5cf6';
      case 'DINNER': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View className="bg-primary px-6 pt-16 pb-8">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-white text-lg opacity-90">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">{user?.name}</Text>
              <Text className="text-white opacity-80">{user?.registerNumber}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center"
            >
              <View>
                <Ionicons name="notifications" size={24} color="#1c3c80" />
              
              </View>
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 -mt-4">
         
    <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
      <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
        Your Mess Card
      </Text>

      <View className="items-center">
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <QRCode
            value={qrCode || "NA"}
            size={width * 0.4}
            color="#1c3c80"
            backgroundColor="white"
          />
        </View>
        <Text className="text-gray-600 text-sm mt-3 text-center">
          Show this QR code at mess entry
        </Text>
      </View>

      {/* Overlay if no active package */}
      {!hasActivePackage && (
        <View className="absolute inset-0 left-0 right-0 bottom-0 top-0 bg-white/80 items-center justify-center px-6">
          <Text className="text-primary
           font-semibold text-lg text-center bg-white/80 p-3 shadow-md rounded-lg">
            You don’t have an active pack.{"\n"}Please buy a package or order a meal.
          </Text>
        </View>
      )}
    </View>
 


          {/* Quick Actions */}
          <View className="flex-row   gap-4 mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate('Order')}
              className="bg-white rounded-2xl p-6 shadow-sm items-center w-[45%]"
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="basket-outline" size={24} color="#f59e0b" />
              </View>
              <Text className="text-gray-800 font-semibold text-center">Order Food</Text>
              <Text className="text-gray-500 text-xs text-center mt-1">Individual meals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('MealPlan')}
              className="bg-white rounded-2xl p-6 shadow-sm items-center  w-[45%]"
            >
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={24} color="#10b981" />
              </View>
              <Text className="text-gray-800 font-semibold text-center">Meal Plan</Text>
              <Text className="text-gray-500 text-xs text-center mt-1">Weekly menu</Text>
            </TouchableOpacity>
          </View>

          {/* Current Meal Status */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Current Meal</Text>
              <View className="flex-row items-center">
                <Ionicons 
                  name={getMealIcon(getCurrentMealType())} 
                  size={20} 
                  color={getMealColor(getCurrentMealType())} 
                />
                <Text className="text-gray-600 ml-2">{getCurrentMealType()}</Text>
              </View>
            </View>
            
            {getCurrentMealType() !== 'CLOSED' ? (
              <View className="bg-green-50 p-4 rounded-xl">
                <Text className="text-green-800 font-semibold">Mess is Open</Text>
                <Text className="text-green-700 text-sm">
                  {getCurrentMealType()} is being served now
                </Text>
              </View>
            ) : (
              <View className="bg-red-50 p-4 rounded-xl">
                <Text className="text-red-800 font-semibold">Mess is Closed</Text>
                <Text className="text-red-700 text-sm">
                  No meals are being served at this time
                </Text>
              </View>
            )}
          </View>

          {/* Today's Meals */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">Today's Meals</Text>
            {todaysMeals.length > 0 ? (
              todaysMeals.map((meal, index) => (
                <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons 
                        name={getMealIcon(meal.mealType)} 
                        size={20} 
                        color={getMealColor(meal.mealType)} 
                      />
                      <Text className="text-lg font-semibold text-gray-800 ml-2">{meal.mealType}</Text>
                    </View>
                    <Text className="text-gray-600">{meal.dishName}</Text>
                    <Text className="text-sm text-gray-500">{meal.time}</Text>
                  </View>
                  <View className="items-end">
                    {meal.attended ? (
                      meal.rated ? (
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={16} color="#fbbf24" />
                          <Text className="text-yellow-500 ml-1">{meal.rating}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleMealRating(meal)}
                          className="bg-yellow-500 px-3 py-1 rounded-full"
                        >
                          <Text className="text-white text-sm font-semibold">Rate</Text>
                        </TouchableOpacity>
                      )
                    ) : (
                      <Text className="text-gray-400 text-sm">Not attended</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-8">
                <Ionicons name="restaurant-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 text-lg mt-4">No meals for today</Text>
                <Text className="text-gray-400 text-center mt-2">
                  {currentSubscription ? 'Check your subscription meals' : 'No active subscription found'}
                </Text>
              </View>
            )}
          </View>

        
        </View>
      </ScrollView>
    </View>
  );
}