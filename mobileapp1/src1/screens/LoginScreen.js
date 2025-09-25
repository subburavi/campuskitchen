import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import logo from  '../assets/logo.png';
export default function LoginScreen({ navigation }) {
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!registerNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your register number',
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.sendOTP(registerNumber);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent successfully',
      });
      navigation.navigate('OTP', { registerNumber });
    } catch (error) {
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary"
    >
      <View className="flex-1 justify-center px-8">
        {/* Logo Section */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
           
<Image source={logo} style={{ width: 50, height: 50,tintColor:'#2b377d' }} resizeMode="contain" />

          </View>
          <Text className="text-white text-3xl font-bold">Mess Management</Text>
          <Text className="text-white text-lg opacity-80 mt-2">Student Portal</Text>
        </View>

        {/* Login Form */}
        <View className="bg-white rounded-2xl p-6 shadow-lg">
          <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Register Number</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
              <Ionicons name="card-outline" size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Enter your register number"
                value={registerNumber}
                onChangeText={setRegisterNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`bg-primary rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <Text className="text-white text-lg font-semibold">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-500 text-sm text-center mt-4">
            We'll send you a verification code to confirm your identity
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-white text-sm opacity-60">
            Having trouble? Contact mess administration
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}