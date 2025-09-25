import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-primary">
      <ActivityIndicator size="large" color="#fff" />
      <Text className="text-white text-lg mt-4 font-bold">Mess Management</Text>
      <Text className="text-white text-sm mt-2">Loading...</Text>
    </View>
  );
}