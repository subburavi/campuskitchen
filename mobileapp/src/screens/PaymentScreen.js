import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import RazorpayCheckout from 'react-native-razorpay';

export default function PaymentScreen({ paymentData, onSuccess, onCancel, type = 'subscription' }) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
console.log('PaymentScreen paymentData:', paymentData);

  const handlePay = async () => {
    setLoading(true);
    try {
      const options = {
        description: type === 'subscription' 
          ? `${paymentData.packageName} - ${paymentData.messFacilityName}`
          : `Order #${paymentData.orderNumber} - ${paymentData.messFacilityName}`,
        image: 'https://www.asram.in/asramlogo.png',
        currency: paymentData.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_R9ev2m8Lxf6gki',
        amount: paymentData.amount,
        order_id: paymentData.payorderId,
        name: type === 'subscription' ? 'Mess Subscription' : 'Food Order',
        prefill: {},
        theme: { color: '#1c3c80' }
      };

      RazorpayCheckout.open(options)
        .then(async (razorpayData) => {
          try {
            let response;
            if (type === 'subscription') {
              response = await apiService.verifyPayment({
                razorpayOrderId: razorpayData.razorpay_order_id,
                razorpayPaymentId: razorpayData.razorpay_payment_id,
                razorpaySignature: razorpayData.razorpay_signature,
                subscriptionId: paymentData.subscriptionId
              });
            } else {
              response = await apiService.verifyFoodPayment({
                razorpayOrderId: razorpayData.razorpay_order_id,
                razorpayPaymentId: razorpayData.razorpay_payment_id,
                razorpaySignature: razorpayData.razorpay_signature,
                orderId: paymentData.orderId
              });
            }

            setPaid(true);
            Toast.show({
              type: 'success',
              text1: 'Payment Successful',
              text2: type === 'subscription' 
                ? 'Your subscription has been activated!'
                : 'Your order has been confirmed!',
            });

            setTimeout(() => {
              onSuccess(response.order || response.subscription, response.qrCode);
            }, 1500);
          } catch (err) {
            console.error('Payment verification error:', err);
            Toast.show({
              type: 'error',
              text1: 'Payment Verification Failed',
            });
          }
        })
        .catch((error) => {
          console.log('Payment cancelled:', error);
          Toast.show({
            type: 'error',
            text1: 'Payment Cancelled',
          });
        });
    } catch (error) {
      console.error('Payment error:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-secondary px-6">
      <View className="bg-white rounded-2xl p-8 shadow-md w-full items-center">
        <Text className="text-xl font-bold mb-2">
          {type === 'subscription' ? 'Pay for Subscription' : 'Pay for Order'}
        </Text>
        <Text className="text-gray-700 mb-1">
          {type === 'subscription' ? paymentData?.packageName : `Order #${paymentData?.orderNumber}`}
        </Text>
        <Text className="text-gray-500 mb-4">
          {type === 'subscription' ? paymentData?.messFacilityName : paymentData?.messFacilityName}
        </Text>
        <Text className="text-3xl font-bold text-green-600 mb-6">
          ₹{(paymentData?.amount / 100).toFixed(2)} {paymentData?.currency}
        </Text>
        
        {!paid ? (
          <View className="w-full space-y-3">
            <TouchableOpacity
              onPress={handlePay}
              disabled={loading}
              className="bg-primary px-6 py-4 rounded-lg w-full items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">Pay Now</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onCancel}
              className="bg-gray-200 px-6 py-4 rounded-lg w-full items-center"
            >
              <Text className="text-gray-700 font-semibold text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-green-700 font-bold mt-4">Payment Complete!</Text>
        )}
      </View>
    </View>
  );
}