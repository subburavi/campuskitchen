import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [tomorrowsMeal, setTomorrowsMeal] = useState(null);
  const [qrCode, setQrCode] = useState("default-qr");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activation, setActivation] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if(isFocused){
      console.log('DashboardScreen is focused, loading data');
    loadDashboardData();
    }
  }, [isFocused]);

  const loadDashboardData = async () => {
    try {
      const [mealsData, tomorrowData, qrData] = await Promise.all([
        apiService.getTodaysMeals(),
        apiService.getTomorrowsMealPlan(),
        apiService.generateQRCode()
      ]);
console.log('Today meals data:', qrData);
      setTodaysMeals(mealsData);
      setTomorrowsMeal(tomorrowData);
      setActivation(qrData.useStatus=='active' ? true : false);
      setQrCode(qrData.qrCode || 'ttest');
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
console.log('Tomorrow meal data:', tomorrowsMeal);
  const handleAttendanceToggle = async (willAttend) => {
    try {
      await apiService.setMealAttendance(tomorrowsMeal.id, willAttend);
      setTomorrowsMeal(prev => ({ ...prev, willAttend }));
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Attendance ${willAttend ? 'confirmed' : 'cancelled'} for tomorrow`,
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
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
    <ScrollView 
      className="flex-1 bg-secondary"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-primary px-6 py-7  pt-16  rounded-b-3xl">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-lg">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">{user?.name}</Text>
            <Text className="text-white opacity-80">{user?.registerNumber}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center"
          >
            <Ionicons name="notifications-outline" color={'#1c3c80'} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 -mt-6">
        {/* QR Code Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">Your Mess Card</Text>
          <View className="items-center">
            <View className="bg-white p-4 rounded-xl shadow-sm">
              <QRCode
                value={qrCode}
                size={150}
                color="#1c3c80"
                backgroundColor="white"
              />
            </View>
            <Text className="text-gray-600 text-sm mt-3 text-center">
              Show this QR code at mess entry
            </Text>
            {/* <TouchableOpacity
              onPress={() => navigation.navigate('QRScan')}
              className="bg-primary px-6 py-2 rounded-full mt-3"
            >
              <Text className="text-white font-semibold">Scan QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Subscription')}
              className="bg-green-600 px-6 py-2 rounded-full mt-2"
            >
              <Text className="text-white font-semibold">View Subscription</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Today's Meals */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Today's Meals</Text>
          {todaysMeals.length > 0 ? (
            todaysMeals.map((meal, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">{meal.mealType}</Text>
                  <Text className="text-gray-600">  {meal.dishName?.map(d => d.dishId).join(", ")}</Text>
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
            <Text className="text-gray-500 text-center py-4">No meals for today</Text>
          )}
        </View>
 
      </View>
    </ScrollView>
  );
}