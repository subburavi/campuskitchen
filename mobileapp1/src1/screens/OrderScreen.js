import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export default function OrderScreen({ navigation }) {
  const { user } = useAuth();
  const [messFacilities, setMessFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMealType, setCurrentMealType] = useState('');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadMessFacilities();
    setCurrentMealType(getCurrentMealType());
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadMenuItems();
    }
  }, [selectedFacility, currentMealType]);

  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 10) return 'BREAKFAST';
    if (hour >= 11 && hour < 15) return 'LUNCH';
    if (hour >= 16 && hour < 18) return 'SNACKS';
    if (hour >= 19 && hour < 22) return 'DINNER';
    return 'CLOSED';
  };

  const loadMessFacilities = async () => {
    try {
      const data = await apiService.getMessFacilities();
      setMessFacilities(data);
    } catch (error) {
      console.error('Error loading mess facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const data = await apiService.getMenuItems(selectedFacility.id, currentMealType);
      setMenuItems(data);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${item.name} added to your cart`,
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Empty Cart',
        text2: 'Please add items to your cart first',
      });
      return;
    }

    try {
      const orderData = {
        messFacilityId: selectedFacility.id,
        mealType: currentMealType,
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        totalAmount: getTotalAmount()
      };

      const response = await apiService.createOrder(orderData);
      
      Toast.show({
        type: 'success',
        text1: 'Order Placed',
        text2: 'Your order has been placed successfully!',
      });

      // Navigate to order confirmation with QR code
      navigation.navigate('OrderConfirmation', { 
        order: response.order,
        qrCode: response.qrCode 
      });

      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Checkout error:', error);
    }
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
        <Text className="text-primary text-lg">Loading...</Text>
      </View>
    );
  }

  if (currentMealType === 'CLOSED') {
    return (
      <View className="flex-1 bg-secondary">
        <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
          <Text className="text-white text-2xl font-bold">Order Food</Text>
          <Text className="text-white opacity-80 mt-1">Individual meal ordering</Text>
        </View>
        
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
            <Ionicons name="time-outline" size={64} color="#ef4444" />
            <Text className="text-xl font-bold text-gray-800 mt-4">Mess Closed</Text>
            <Text className="text-gray-600 text-center mt-2">
              Individual ordering is only available during meal times
            </Text>
            <View className="mt-4 space-y-2">
              <Text className="text-sm text-gray-600">Meal Times:</Text>
              <Text className="text-sm text-gray-500">Breakfast: 7:30 AM - 9:30 AM</Text>
              <Text className="text-sm text-gray-500">Lunch: 12:00 PM - 2:00 PM</Text>
              <Text className="text-sm text-gray-500">Snacks: 4:00 PM - 5:30 PM</Text>
              <Text className="text-sm text-gray-500">Dinner: 7:00 PM - 9:00 PM</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16 rounded-b-3xl">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Order Food</Text>
            <Text className="text-white opacity-80 mt-1">
              Current: {currentMealType}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCart(true)}
            className="relative"
          >
            <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
              <Ionicons name="basket-outline" size={24} color="#fff" />
            </View>
            {cart.length > 0 && (
              <View className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-6">
        {/* Mess Facility Selection */}
        {!selectedFacility ? (
          <View className="space-y-4">
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
              <Text className="text-xl font-bold text-gray-800 mb-4">Choose Mess Facility</Text>
              {messFacilities.map((facility) => (
                <TouchableOpacity
                  key={facility.id}
                  onPress={() => setSelectedFacility(facility)}
                  className="border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <Text className="text-lg font-semibold text-gray-800">{facility.name}</Text>
                  {facility.location && (
                    <Text className="text-gray-600 text-sm">{facility.location}</Text>
                  )}
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text className="text-gray-500 text-sm ml-1">Capacity: {facility.capacity}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View className="space-y-4">
            {/* Selected Facility Header */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold text-gray-800">{selectedFacility.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name={getMealIcon(currentMealType)} size={16} color={getMealColor(currentMealType)} />
                    <Text className="text-gray-600 text-sm ml-1">{currentMealType} Menu</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFacility(null)}
                  className="p-2"
                >
                  <Ionicons name="chevron-back-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Items */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-xl font-bold text-gray-800 mb-4">Available Items</Text>
              
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <View key={item.id} className="border-b border-gray-100 py-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                        {item.description && (
                          <Text className="text-gray-600 text-sm mt-1">{item.description}</Text>
                        )}
                        <View className="flex-row items-center mt-2">
                          <Text className="text-2xl font-bold text-green-600">₹{item.price}</Text>
                          {item.preparationTime > 0 && (
                            <View className="flex-row items-center ml-4">
                              <Ionicons name="time-outline" size={14} color="#666" />
                              <Text className="text-gray-500 text-xs ml-1">{item.preparationTime}m</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => addToCart(item)}
                        className="bg-primary px-4 py-2 rounded-lg ml-4"
                      >
                        <Text className="text-white font-semibold">Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="restaurant-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-500 text-lg mt-4">No items available</Text>
                  <Text className="text-gray-400 text-center mt-2">
                    No menu items available for {currentMealType} at this time
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cart Modal */}
      {showCart && (
        <View className="absolute inset-0 bg-black/50 bg-opacity-50 justify-end right-0 left-0 bottom-0 top-0 ">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Your Cart</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <View key={item.id} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800">{item.name}</Text>
                      <Text className="text-green-600 font-bold">₹{item.price}</Text>
                    </View>
                    <View className="flex-row items-center space-x-3">
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                      >
                        <Ionicons name="remove-outline" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text className="font-bold text-lg">{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-primary rounded-full items-center justify-center"
                      >
                        <Ionicons name="add-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="basket-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-500 text-lg mt-4">Cart is empty</Text>
                </View>
              )}
            </ScrollView>

            {cart.length > 0 && (
              <View className="pt-4 border-t border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-800">Total</Text>
                  <Text className="text-2xl font-bold text-green-600">₹{getTotalAmount()}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCheckout}
                  className="bg-primary py-4 rounded-xl"
                >
                  <Text className="text-white text-lg font-bold text-center">
                    Place Order
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}