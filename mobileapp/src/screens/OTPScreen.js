import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export default function OTPScreen({ route, navigation }) {
  const { registerNumber } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter complete OTP',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyOTP(registerNumber, otpString);
      await login(response.user, response.token);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Login successful',
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      await apiService.sendOTP(registerNumber);
      setResendTimer(30);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP resent successfully',
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary"
    >
      <View className="flex-1 justify-center px-8">
        <View className="bg-white rounded-2xl p-6 shadow-lg">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4">
              <Ionicons name="mail-outline" size={24} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-gray-800">Verify OTP</Text>
            <Text className="text-gray-600 text-center mt-2">
              Enter the 6-digit code sent to your registered mobile number
            </Text>
            <Text className="text-primary font-semibold mt-1">{registerNumber}</Text>
          </View>

          {/* OTP Input */}
          <View className="flex-row justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:border-primary"
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            className={`bg-primary rounded-lg py-4 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text className="text-white text-lg font-semibold">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          {/* Resend OTP */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Didn't receive code? </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={resendTimer > 0}
            >
              <Text className={`font-semibold ${resendTimer > 0 ? 'text-gray-400' : 'text-primary'}`}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}