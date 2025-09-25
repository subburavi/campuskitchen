import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useIsFocused } from '@react-navigation/native';

export default function SubscriptionScreen({ navigation }) {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [packages, setPackages] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if(isFocused){
      console.log('SubscriptionScreen is focused, loading data');
       loadSubscriptionData();
    }
   
  }, [isFocused]);

  const loadSubscriptionData = async () => {
    try {
      const [currentSub, availablePackages, history] = await Promise.all([
        apiService.getCurrentSubscription(),
        apiService.getAvailablePackages(),
        apiService.getSubscriptionHistory()
      ]);

      setCurrentSubscription(currentSub);
      setPackages(availablePackages);
      setSubscriptionHistory(history);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
  };

  const handleSubscribeToPackage = (packageItem) => {
    Alert.alert(
      'Subscribe to Package',
      `Do you want to subscribe to ${packageItem.name} for ₹${packageItem.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Subscribe', 
          onPress: () => initiatePayment(packageItem)
        }
      ]
    );
  };

  const initiatePayment = async (packageItem) => {
    try {
      // Create Razorpay order via backend
      const orderResponse = await apiService.createRazorpayOrder(
        packageItem.id,
        packageItem.messFacilityId
      );
      console.log('Order response:', orderResponse);

      // Navigate to PaymentScreen with order details
      navigation.navigate('PaymentScreen', {
        orderId: orderResponse.orderId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        subscriptionId: orderResponse.subscriptionId,
        packageName: orderResponse.packageName,
        messFacilityName: orderResponse.messFacilityName
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: 'Could not initiate payment. Please try again.',
      });
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading subscription...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-14 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">Mess Subscription</Text>
        <Text className="text-white opacity-80 mt-1">Manage your mess card</Text>
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Subscription */}
        {currentSubscription ? (
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Active Subscription</Text>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(currentSubscription.status)}`}>
                <Text className="text-sm font-semibold">{currentSubscription.status}</Text>
              </View>
            </View>

            <View className=" bg-primary rounded-xl p-4 mb-4">
              <Text className="text-white text-lg font-bold">{currentSubscription.package.name}</Text>
              <Text className="text-white opacity-90">{currentSubscription.messFacility.name}</Text>
              <Text className="text-white opacity-90 mt-2">
                {currentSubscription.messFacility.location}
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Start Date:</Text>
                <Text className="font-semibold">
                  {new Date(currentSubscription.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">End Date:</Text>
                <Text className="font-semibold">
                  {new Date(currentSubscription.endDate).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Days Remaining:</Text>
                <Text className={`font-bold ${
                  getDaysRemaining(currentSubscription.endDate) <= 7 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {getDaysRemaining(currentSubscription.endDate)} days
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Amount Paid:</Text>
                <Text className="font-bold text-green-600">₹{currentSubscription.amountPaid}</Text>
              </View>
            </View>

            <View className="mt-4 pt-4 border-t border-gray-200">
              <Text className="text-gray-700 font-medium mb-2">Meals Included:</Text>
              <View className="flex-row flex-wrap">
                {currentSubscription.package.mealsIncluded.map((meal, index) => (
                  <View key={index} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-blue-800 text-sm font-medium">{meal}</Text>
                  </View>
                ))}
              </View>
            </View>

            {getDaysRemaining(currentSubscription.endDate) <= 7 && (
              <View className="mt-4 p-3 bg-orange-50 rounded-lg">
                <Text className="text-orange-800 font-medium">⚠️ Subscription Expiring Soon</Text>
                <Text className="text-orange-700 text-sm mt-1">
                  Renew your subscription to continue enjoying mess services
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="items-center">
              <Ionicons name="card-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-lg mt-4">No Active Subscription</Text>
              <Text className="text-gray-400 text-center mt-2">
                Subscribe to a mess package to start enjoying meals
              </Text>
            </View>
          </View>
        )}

        {/* Available Packages */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Available Packages</Text>
          
          {packages.map((pkg, index) => (
            <View key={pkg.id} className="border border-gray-200 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">{pkg.name}</Text>
                  <Text className="text-gray-600">{pkg.messFacility.name}</Text>
                  {pkg.description && (
                    <Text className="text-gray-500 text-sm mt-1">{pkg.description}</Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-green-600">₹{pkg.price}</Text>
                  <Text className="text-gray-500 text-sm">for {pkg.durationDays} days</Text>
                </View>
              </View>

              <View className="flex-row flex-wrap mb-3">
                {pkg.mealsIncluded.map((meal, mealIndex) => (
                  <View key={mealIndex} className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                    <Text className="text-blue-800 text-xs font-medium">{meal}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm">
                  ₹{(pkg.price / pkg.durationDays).toFixed(0)} per day
                </Text>
                <TouchableOpacity
                  onPress={() => handleSubscribeToPackage(pkg)}
                  className="bg-primary px-4 py-2 rounded-lg"
                  disabled={currentSubscription?.status === 'ACTIVE'}
                >
                  <Text className="text-white font-semibold">
                    {currentSubscription?.status === 'ACTIVE' ? 'Active' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {packages.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="package-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-lg mt-4">No packages available</Text>
            </View>
          )}
        </View>

        {/* Subscription History */}
        {subscriptionHistory.length > 0 && (
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">Subscription History</Text>
            
            {subscriptionHistory.slice(0, 5).map((sub, index) => (
              <View key={sub.id} className="border-b border-gray-100 py-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{sub.package.name}</Text>
                    <Text className="text-gray-600 text-sm">{sub.messFacility.name}</Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className={`px-2 py-1 rounded-full ${getStatusColor(sub.status)}`}>
                      <Text className="text-xs font-semibold">{sub.status}</Text>
                    </View>
                    <Text className="text-green-600 font-bold text-sm mt-1">₹{sub.amountPaid}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}