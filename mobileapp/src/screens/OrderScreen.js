import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import PaymentScreen from './PaymentScreen';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function OrderScreen({ navigation }) {
  const { user } = useAuth();
  const [messFacilities, setMessFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMealType, setCurrentMealType] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [mealTimes, setMealTimes] = useState(null);
 const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      (async () => {
        await loadMealTimes();
        await loadMessFacilities();
      })();
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      await loadMealTimes();
      await loadMessFacilities();
    })();
  }, []);

  useEffect(() => {
    if (selectedFacility && currentMealType !== 'CLOSED') {
      loadMenuItems();
    }
  }, [selectedFacility, currentMealType]);

  // Load meal times from server and set state
  const loadMealTimes = async () => {
    try {
      const mt = await apiService.getMealTimes();
      setMealTimes(mt);
      setCurrentMealType(getCurrentMealType(mt));
    } catch (e) {
      console.warn('Failed to fetch meal times, using defaults', e);
      setMealTimes(null);
      setCurrentMealType(getCurrentMealType(null));
    }
  };

  // Determine current meal type using optional mealTimes config
  const getCurrentMealType = (mt) => {
    if (mt) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const within = (start, end, t) => {
        if (!start || !end) return false;
        return t >= start && t <= end;
      };

      if (within(mt.breakfast_start, mt.breakfast_end, timeStr)) return 'BREAKFAST';
      if (within(mt.lunch_start, mt.lunch_end, timeStr)) return 'LUNCH';
      if (within(mt.snacks_start, mt.snacks_end, timeStr)) return 'SNACKS';
      if (within(mt.dinner_start, mt.dinner_end, timeStr)) return 'DINNER';
      return 'CLOSED';
    }

    // fallback static ranges
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 10) return 'BREAKFAST';
    if (hour >= 12 && hour < 15) return 'LUNCH';
    if (hour >= 16 && hour < 19) return 'SNACKS';
    if (hour >= 19 && hour < 24) return 'DINNER';
    return 'CLOSED';
  };

  const formatTo12Hour = (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return '';
    const [hh, mm] = hhmm.split(':').map(s => parseInt(s, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const period = hh >= 12 ? 'PM' : 'AM';
    const hour12 = ((hh + 11) % 12) + 1;
    return `${hour12}:${mm.toString().padStart(2, '0')} ${period}`;
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
      // Create order first
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

      const orderResponse = await apiService.createOrder(orderData);
      
      // Create Razorpay order for payment
      const razorpayResponse = await apiService.createFoodOrder(orderResponse.order.id);
      
      setPaymentData({
        ...razorpayResponse,
        orderId: orderResponse.order.id,
        orderNumber: orderResponse.order.orderNumber,
        
      });
      
      setShowCart(false);
      setShowPayment(true);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handlePaymentSuccess = (order, qrCode) => {
    setShowPayment(false);
    setCart([]);
    
    Toast.show({
      type: 'success',
      text1: 'Order Placed',
      text2: 'Your order has been placed successfully!',
    });

    // Navigate to order confirmation
    navigation.navigate('OrderHistory');
  };

  const getMealIcon2 = (mealType) => {
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
        <View className="bg-primary px-6 py-10 pt-16">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Order Food</Text>
            <Text className="text-white opacity-80 mt-1">
              Current: {currentMealType}
            </Text>
          </View>
         <View className="flex-row justify-between items-center">
  <TouchableOpacity
    onPress={() => navigation.navigate('OrderHistory')} // Navigate to order history screen
    className="p-2 mr-2"
  >
     <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
      <Ionicons name="list" size={24} color="#1c3c80" />
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setShowCart(true)}
    className="relative"
  >
    <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
      <Ionicons name="basket-outline" size={24} color="#1c3c80" />
    </View>
    {cart.length > 0 && (
      <View className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
        <Text className="text-white text-xs font-bold">{cart.length}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>

        </View>
      </View>
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
            <Ionicons name="time-outline" size={64} color="#ef4444" />
            <Text className="text-xl font-bold text-gray-800 mt-4">Mess Closed</Text>
            <Text className="text-gray-600 text-center mt-2">
              Individual ordering is only available during meal times
            </Text>
            <View className="mt-4 space-y-2">
              <Text className="text-sm text-gray-600 font-semibold">Meal Times:</Text>
              <Text className="text-sm text-gray-500">Breakfast: {mealTimes ? `${formatTo12Hour(mealTimes.breakfast_start)} - ${formatTo12Hour(mealTimes.breakfast_end)}` : '7:30 AM - 9:30 AM'}</Text>
              <Text className="text-sm text-gray-500">Lunch: {mealTimes ? `${formatTo12Hour(mealTimes.lunch_start)} - ${formatTo12Hour(mealTimes.lunch_end)}` : '12:00 PM - 2:00 PM'}</Text>
              <Text className="text-sm text-gray-500">Snacks: {mealTimes ? `${formatTo12Hour(mealTimes.snacks_start)} - ${formatTo12Hour(mealTimes.snacks_end)}` : '4:00 PM - 5:30 PM'}</Text>
              <Text className="text-sm text-gray-500">Dinner: {mealTimes ? `${formatTo12Hour(mealTimes.dinner_start)} - ${formatTo12Hour(mealTimes.dinner_end)}` : '7:00 PM - 9:00 PM'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Order Food</Text>
            <Text className="text-white opacity-80 mt-1">
              Current: {currentMealType}
            </Text>
          </View>
         <View className="flex-row justify-between items-center">
  <TouchableOpacity
    onPress={() => navigation.navigate('OrderHistory')} // Navigate to order history screen
    className="p-2 mr-2"
  >
     <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
      <Ionicons name="list" size={24} color="#1c3c80" />
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setShowCart(true)}
    className="relative"
  >
    <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
      <Ionicons name="basket-outline" size={24} color="#1c3c80" />
    </View>
    {cart.length > 0 && (
      <View className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
        <Text className="text-white text-xs font-bold">{cart.length}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>

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
                    <Ionicons name={getMealIcon2(currentMealType)} size={16} color={getMealColor(currentMealType)} />
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
      <Modal
        visible={showCart}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Your Cart</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Ionicons name="close-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {cart.length > 0 ? (
              cart.map((item) => (
                <View key={item.id} className="flex-row justify-between items-center py-4 border-b border-gray-100">
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
                    <Text className="font-bold text-lg w-8 text-center">{item.quantity}</Text>
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
            <View className="p-6 border-t border-gray-200">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Total</Text>
                <Text className="text-2xl font-bold text-green-600">₹{getTotalAmount()}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCheckout}
                className="bg-primary py-4 rounded-xl"
              >
                <Text className="text-white text-lg font-bold text-center">
                  Proceed to Payment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PaymentScreen
          paymentData={paymentData}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
          type="order"
        />
      </Modal>
    </View>
  );
}