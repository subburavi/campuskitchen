import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const data = await apiService.getOrderDetails(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed', icon: 'checkmark-circle' },
      { key: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
      { key: 'PREPARED', label: 'Prepared', icon: 'checkmark-circle' },
      { key: 'SERVED', label: 'Served', icon: 'checkmark-circle' }
    ];

    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARED', 'SERVED'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#3b82f6';
      case 'PREPARED': return '#8b5cf6';
      case 'SERVED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4">Order Not Found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Order Tracking</Text>
            <Text className="text-white opacity-80 mt-1">#{order.orderNumber}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Order Status Timeline */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-6">Order Status</Text>
          
          <View className="space-y-4">
            {getStatusSteps().map((step, index) => (
              <View key={step.key} className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  step.completed ? 'bg-green-500' : step.current ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  <Ionicons 
                    name={step.completed ? 'checkmark-outline' : 'ellipse-outline'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`font-semibold ${
                    step.completed || step.current ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </Text>
                  {step.current && (
                    <Text className="text-blue-600 text-sm">Current Status</Text>
                  )}
                </View>
                {index < getStatusSteps().length - 1 && (
                  <View className={`absolute left-4 top-8 w-0.5 h-8 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Order Summary</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Meal Type:</Text>
              <Text className="font-semibold text-gray-800">{order.mealType}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Date:</Text>
              <Text className="font-semibold text-gray-800">
                {new Date(order.orderDate).toLocaleDateString()}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Time:</Text>
              <Text className="font-semibold text-gray-800">
                {new Date(order.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Amount:</Text>
              <Text className="text-2xl font-bold text-green-600">₹{order.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Items</Text>
          
          {order.items.map((item, index) => (
            <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">{item.menuItem.name}</Text>
                <Text className="text-gray-600 text-sm">₹{item.unitPrice} each</Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-gray-800">x{item.quantity}</Text>
                <Text className="text-green-600 font-bold">₹{item.totalPrice}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Estimated Time */}
        {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text className="text-blue-800 font-semibold ml-2">Estimated Preparation Time</Text>
            </View>
            <Text className="text-blue-700 text-sm">
              Your order will be ready in approximately 15-20 minutes
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          {order.status === 'SERVED' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('MealRating', { order })}
              className="bg-yellow-500 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-bold text-center">Rate Your Order</Text>
            </TouchableOpacity>
          ) : order.status === 'PENDING' ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => cancelOrder() }
                  ]
                );
              }}
              className="bg-red-500 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-bold text-center">Cancel Order</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            className="bg-gray-200 py-4 rounded-xl"
          >
            <Text className="text-gray-700 text-lg font-semibold text-center">Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}