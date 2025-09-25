import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';

export default function MealPlanScreen() {
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    loadWeeklyPlan();
  }, []);

  useEffect(() => {
    // Set today as default selected day when data loads
    if (weeklyPlan.length > 0) {
      const today = new Date();
      const todayIndex = weeklyPlan.findIndex(day => {
        const dayDate = new Date(day.date);
        return dayDate.toDateString() === today.toDateString();
      });
      if (todayIndex !== -1) {
        setSelectedDayIndex(todayIndex);
      }
    }
  }, [weeklyPlan]);

  const loadWeeklyPlan = async () => {
    try {
      const data = await apiService.getWeeklyMealPlan();
      console.log('Weekly meal plan data:', data);
      setWeeklyPlan(data);
    } catch (error) {
      console.error('Error loading weekly plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeeklyPlan();
    setRefreshing(false);
  };

  const handleAttendanceToggle = async (mealId, willAttend) => {
    try {
      await apiService.setMealAttendance(mealId, willAttend);
      setWeeklyPlan(prev => 
        prev.map(day => ({
          ...day,
          meals: day.meals.map(meal => 
            meal.id === mealId ? { ...meal, willAttend } : meal
          )
        }))
      );
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Attendance ${willAttend ? 'confirmed' : 'cancelled'}`,
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST':
        return 'sunny-outline';
      case 'LUNCH':
        return 'restaurant-outline';
      case 'SNACKS':
        return 'cafe-outline';
      case 'DINNER':
        return 'moon-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getMealColor = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST':
        return 'bg-orange-100 border-orange-200';
      case 'LUNCH':
        return 'bg-green-100 border-green-200';
      case 'SNACKS':
        return 'bg-purple-100 border-purple-200';
      case 'DINNER':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getDayShortName = (dayName) => {
    const dayMap = {
      'Monday': 'Mon',
      'Tuesday': 'Tue', 
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    return dayMap[dayName] || dayName.slice(0, 3);
  };

  const isToday = (dayDate) => {
    const today = new Date();
    const day = new Date(dayDate);
    return day.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading meal plan...</Text>
      </View>
    );
  }

  const selectedDay = weeklyPlan[selectedDayIndex];

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">Weekly Meal Plan</Text>
        <Text className="text-white opacity-80 mt-1">Plan your mess attendance</Text>
        
        {/* Day Tabs */}
        {weeklyPlan.length > 0 && (
          <View className="mt-6">
            <View className="flex-row justify-between">
              {weeklyPlan.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDayIndex(index)}
                  className="flex-1 mx-1"
                >
                  <View className={`py-3 px-2 rounded-xl items-center ${
                    selectedDayIndex === index 
                      ? 'bg-white shadow-lg' 
                      : 'bg-white bg-opacity-20'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      selectedDayIndex === index ? 'text-primary' : 'text-primary'
                    }`}>
                      {getDayShortName(day.dayName)}
                    </Text>
                    <Text className={`text-xs mt-1 ${
                      selectedDayIndex === index ? 'text-primary opacity-70' : 'text-gray opacity-70'
                    }`}>
                      {new Date(day.date).getDate()}
                    </Text>
                    {isToday(day.date) && (
                      <View className={`w-2 h-2 rounded-full mt-1 ${
                        selectedDayIndex === index ? 'bg-primary' : 'bg-white'
                      }`} />
                    )}
                  </View>
                  {selectedDayIndex === index && (
                    <View className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedDay && (
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {selectedDay.dayName} - {selectedDay.date}
            </Text>
            
            {selectedDay.meals.map((meal, mealIndex) => (
              <View 
                key={mealIndex} 
                className={`border rounded-xl p-4 mb-3 ${getMealColor(meal.mealType)}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={getMealIcon(meal.mealType)} 
                      size={24} 
                      color="#2b377d" 
                    />
                    <View className="ml-3">
                      <Text className="text-lg font-semibold text-gray-800">
                        {meal.mealType}
                      </Text>
                      <Text className="text-gray-600">{meal.time}</Text>
                    </View>
                  </View>
                </View>

                <Text className="text-gray-800 font-medium mb-3">{meal.dishName?.map(d => d.dishId).join(", ")}</Text>
                
                {meal.ingredients && (
                  <View className="mb-3">
                    <Text className="text-sm text-gray-600 mb-1">Ingredients:</Text>
                    <Text className="text-sm text-gray-500">{meal.ingredients}</Text>
                  </View>
                )}

                {/* Attendance Toggle */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 font-medium">Will you attend?</Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleAttendanceToggle(meal.id, true)}
                      className={`px-4 py-2 rounded-full ${
                        meal.willAttend ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        meal.willAttend ? 'text-white' : 'text-gray-600'
                      }`}>
                        Yes
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAttendanceToggle(meal.id, false)}
                      className={`px-4 py-2 rounded-full ${
                        meal.willAttend === false ? 'bg-red-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        meal.willAttend === false ? 'text-white' : 'text-gray-600'
                      }`}>
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {weeklyPlan.length === 0 && (
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4">No meal plan available</Text>
            <Text className="text-gray-400 text-center mt-2">
              The weekly meal plan will be updated soon
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}