import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function OrderHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
 const isFocused = useIsFocused();
  useEffect(() => {
    if(isFocused){
       fetchOrders();
    }
   
  }, [isFocused]);
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiService.getOrderHistory();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderConfirmation', { order });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED':
        return {
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: 'checkmark-circle'
        };
      case 'CANCELLED':
        return {
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: 'close-circle'
        };
      case 'PENDING':
        return {
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: 'time'
        };
      default:
        return {
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: 'information-circle'
        };
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (diffDays === 1) {
      return `Today at ${timeString}`;
    } else if (diffDays === 2) {
      return `Yesterday at ${timeString}`;
    } else if (diffDays <= 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${dayName} at ${timeString}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} at ${timeString}`;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <View className="bg-white rounded-2xl p-8 shadow-sm">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4 text-center font-medium">Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Enhanced Header */}
      <View className="bg-primary shadow-sm">
        <View className="flex-row items-center px-4 pt-12 pb-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('Order')}
            className="p-2 mr-3 rounded-full bg-white/10"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Order History
            </Text>
            {orders.length > 0 && (
              <Text className="text-white/80 text-sm mt-0.5">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </Text>
            )}
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 32
        }}
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item.status);
          
          return (
            <TouchableOpacity
              onPress={() => handleOrderPress(item)}
              activeOpacity={0.95}
              className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Card Header */}
              <View className="px-5 pt-4 pb-3">
                <View className="flex-row justify-between gap-3 items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-primary/10 rounded-full p-2 mr-3">
                        <Ionicons name="receipt" size={16} color="#3B82F6" />
                      </View>
                      <Text className="text-lg font-bold text-gray-900">
                        Order #{item.orderNumber}
                      </Text>
                    </View>
                    
                    {/* DateTime with better formatting */}
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1 font-medium">
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View className={`flex-row items-center absolute top-10 right-0 px-2 py-1.5 rounded-full ${statusStyle.bgColor} ${statusStyle.borderColor} border`}>
                    <Ionicons 
                      name={statusStyle.icon} 
                      size={14} 
                      color={statusStyle.textColor.includes('emerald') ? '#047857' : 
                             statusStyle.textColor.includes('red') ? '#B91C1C' : 
                             statusStyle.textColor.includes('amber') ? '#B45309' : '#1D4ED8'} 
                    />
                    <Text className={`ml-1.5 text-[10px] font-semibold ${statusStyle.textColor}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mess and Meal Info */}
              <View className="px-5 pb-4">
                <View className="bg-gray-50 rounded-xl p-3 mb-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="restaurant" size={16} color="#6B7280" />
                      <Text className="text-gray-700 font-medium ml-2 flex-1" numberOfLines={1}>
                        {item.messFacility?.name || 'N/A'}
                      </Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-lg ml-3">
                      <Text className="text-primary font-semibold text-sm capitalize">
                        {item.mealType?.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Amount and Arrow */}
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-2xl font-bold text-primary">
                      ₹{parseInt(item.totalAmount).toFixed(2)}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                      Total Amount
                    </Text>
                  </View>
                  
                  <View className="bg-gray-100 rounded-full p-2">
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-24">
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center mx-4">
              <View className="bg-primary/10 rounded-full p-6 mb-4">
                <Ionicons name="receipt-outline" size={48} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
                No Orders Yet
              </Text>
              <Text className="text-gray-500 text-center text-base leading-6 mb-6">
                Your order history will appear here{'\n'}once you place your first order
              </Text>
              <TouchableOpacity 
                className="bg-primary rounded-xl px-6 py-3 shadow-sm"
                onPress={() => navigation.navigate('Order')}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">Start Ordering</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  );
}