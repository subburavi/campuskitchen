import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';

export default function OrderConfirmationScreen({ route, navigation }) {
  const { order, qrCode } = route.params;
  const [qrShared, setQrShared] = useState(false);

  const handleShareQR = async () => {
    try {
      // In a real app, you would convert QR code to image and share
      const result = await Share.share({
        message: `Order #${order.orderNumber} - QR Code: ${qrCode}`,
        title: 'Mess Order QR Code',
      });

      if (result.action === Share.sharedAction) {
        setQrShared(true);
        Toast.show({
          type: 'success',
          text1: 'QR Code Shared',
          text2: 'QR code has been shared successfully',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Failed to share QR code',
      });
    }
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

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Order Confirmed</Text>
            <Text className="text-white opacity-80 mt-1">#{order.orderNumber}</Text>
          </View>
          <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
            <Ionicons name="checkmark-outline" size={24} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-6">
        {/* Order QR Code */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">Order QR Code</Text>
          
          <View className="items-center">
            <View className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-200">
              <QRCode
                value={qrCode}
                size={200}
                color="#1c3c80"
                backgroundColor="white"
              />
            </View>
            
            <Text className="text-gray-600 text-sm mt-3 text-center">
              Show this QR code when collecting your order
            </Text>
            
            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                onPress={handleShareQR}
                className="bg-green-600 px-6 py-3 rounded-xl flex-1"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Share QR</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                className="bg-blue-600 px-6 py-3 rounded-xl flex-1"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="eye-outline" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Track</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Order Details</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Number:</Text>
              <Text className="font-semibold text-gray-800">{order.orderNumber}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Meal Type:</Text>
              <View className="flex-row items-center">
                <Ionicons name={getMealIcon(order.mealType)} size={16} color={getMealColor(order.mealType)} />
                <Text className="font-semibold text-gray-800 ml-1">{order.mealType}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Status:</Text>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: getStatusColor(order.status) + '20' }}>
                <Text className="font-semibold" style={{ color: getStatusColor(order.status) }}>
                  {order.status}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Amount:</Text>
              <Text className="text-2xl font-bold text-green-600">₹{order.totalAmount}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Time:</Text>
              <Text className="font-semibold text-gray-800">
                {new Date(order.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Items Ordered</Text>
          
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

        {/* Important Notes */}
        <View className="bg-yellow-50 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text className="text-yellow-800 font-semibold ml-2">Important Notes</Text>
          </View>
          <Text className="text-yellow-700 text-sm">
            • This QR code can only be used once{'\n'}
            • QR code expires in 24 hours{'\n'}
            • Show this code when collecting your order{'\n'}
            • Order will be marked as served after QR scan
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View className="flex-row space-x-3 mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            className="flex-1 bg-gray-200 py-3 rounded-xl"
          >
            <Text className="text-gray-700 font-semibold text-center">Back to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Order')}
            className="flex-1 bg-primary py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-center">Order Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}