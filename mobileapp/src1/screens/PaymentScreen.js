import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import RazorpayCheckout from 'react-native-razorpay';

export default function PaymentScreen({ route, navigation }) {
  const { orderId, amount, currency, subscriptionId, packageName, messFacilityName } = route.params;
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

const handlePay = async () => {
  setLoading(true);
  try {
    console.log('Initiating payment with orderId:', orderId);
    // Use order details from params, do not create order again
    var options = {
      description: `${packageName} - ${messFacilityName}`,
      image: 'https://yourcdn.com/logo.png',
      currency,
      key: 'rzp_test_R9ev2m8Lxf6gki', // 👈 from Razorpay Dashboard
      amount: amount, // in paise
      order_id: orderId,
      name: 'Mess Subscription',
      // You may want to fetch user details for prefill
      prefill: {},
      theme: { color: '#1c3c80' }
    };

    RazorpayCheckout.open(options)
      .then(async (paymentData) => {
        // paymentData contains { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        try {
          await apiService.verifyPayment({
            razorpayOrderId: paymentData.razorpay_order_id,
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpaySignature: paymentData.razorpay_signature,
            subscriptionId
          });

          setPaid(true);
          Toast.show({
            type: 'success',
            text1: 'Payment Successful',
            text2: 'Your subscription has been activated!'
          });

          setTimeout(() => {
            navigation.navigate('Subscription', { refresh: true });
          }, 1500);
        } catch (err) {
          console.error(err);
          Toast.show({
            type: 'error',
            text1: 'Payment Verification Failed',
          });
        }
      })
      .catch((error) => {
        console.log(error);
        Toast.show({
          type: 'error',
          text1: 'Payment Cancelled',
        });
      });
  } catch (error) {
    console.error(error);
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
      <View className="bg-white rounded-2xl p-8 shadow-md w-full max-w-md items-center">
        <Text className="text-xl font-bold mb-2">Pay for Subscription</Text>
        <Text className="text-gray-700 mb-1">{packageName}</Text>
        <Text className="text-gray-500 mb-4">{messFacilityName}</Text>
        <Text className="text-3xl font-bold text-green-600 mb-6">₹{(amount / 100).toFixed(2)} {currency}</Text>
        {!paid ? (
          <TouchableOpacity
            onPress={handlePay}
            disabled={loading}
            className="bg-primary px-6 py-3 rounded-lg w-full items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Pay Now</Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text className="text-green-700 font-bold mt-4">Payment Complete!</Text>
        )}
      </View>
    </View>
  );
}
