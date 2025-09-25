import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import logo from  '../assets/logo.png';
export default function LoginScreen({ navigation }) {
  const [registerNumber, setRegisterNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginType, setLoginType] = useState('register'); // 'register' or 'mobile'
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const identifier = loginType === 'register' ? registerNumber : mobileNumber;
    
    if (!identifier.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Please enter your ${loginType === 'register' ? 'register number' : 'mobile number'}`,
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.sendOTP(
        loginType === 'register' ? registerNumber : null,
        loginType === 'mobile' ? mobileNumber : null
      );
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent successfully',
      });
      navigation.navigate('OTP', { 
        registerNumber: loginType === 'register' ? registerNumber : null,
        mobileNumber: loginType === 'mobile' ? mobileNumber : null,
        loginType 
      });
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
          
          {/* Login Type Toggle */}
          <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setLoginType('register')}
              className={`flex-1 py-2 rounded-lg ${loginType === 'register' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-center font-medium ${loginType === 'register' ? 'text-primary' : 'text-gray-600'}`}>
                Register Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLoginType('mobile')}
              className={`flex-1 py-2 rounded-lg ${loginType === 'mobile' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-center font-medium ${loginType === 'mobile' ? 'text-primary' : 'text-gray-600'}`}>
                Mobile Number
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              {loginType === 'register' ? 'Register Number' : 'Mobile Number'}
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
              <Ionicons name={loginType === 'register' ? "card-outline" : "call-outline"} size={20} color="#666" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder={`Enter your ${loginType === 'register' ? 'register number' : 'mobile number'}`}
                value={loginType === 'register' ? registerNumber : mobileNumber}
                onChangeText={loginType === 'register' ? setRegisterNumber : setMobileNumber}
                autoCapitalize={loginType === 'register' ? "characters" : "none"}
                keyboardType={loginType === 'mobile' ? "phone-pad" : "default"}
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