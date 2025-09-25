import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';

export default function QRScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      await apiService.markAttendance(data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Attendance marked successfully!',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert(
        'Error',
        'Failed to mark attendance. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Ionicons name="camera-outline" size={64} color="#fff" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-white text-center mt-2 opacity-80">
          Please grant camera permission to scan QR codes
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary px-6 py-3 rounded-full mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View className="absolute inset-0 flex-1 justify-center items-center top-0 left-0 right-0 bottom-[25%]">
        <View className="w-64 h-64 border-2 border-white rounded-2xl">
          <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
          <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
          <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
          <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
        </View>
      </View>

      {/* Instructions */}
      <View className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-6">
        <Text className="text-white text-lg font-semibold text-center mb-2">
          Scan QR Code
        </Text>
        <Text className="text-white text-center opacity-80">
          Position the QR code within the frame to mark your attendance
        </Text>

        {scanned && (
          <View className="mt-4 items-center">
            <Text className="text-white mb-2">
              {loading ? 'Processing...' : 'Tap to scan again'}
            </Text>
            {!loading && (
              <TouchableOpacity
                onPress={() => setScanned(false)}
                className="bg-primary px-6 py-2 rounded-full"
              >
                <Text className="text-white font-semibold">Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
