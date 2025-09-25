import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';

export default function MealRatingScreen({ route, navigation }) {
  const { meal } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStarPress = (starRating) => {
    setRating(starRating);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await apiService.rateMeal(meal.id, rating, comment);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Thank you for your feedback!',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-secondary">
      <View className="px-6 py-8">
        {/* Meal Info */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">{meal.dishName}</Text>
          <Text className="text-lg text-gray-600 mb-1">{meal.mealType}</Text>
          <Text className="text-sm text-gray-500">{meal.time}</Text>
        </View>

        {/* Rating Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
            How was your meal?
          </Text>
          
          {/* Star Rating */}
          <View className="flex-row justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                className="mx-2"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#fbbf24' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating Labels */}
          <View className="items-center mb-6">
            {rating > 0 && (
              <Text className="text-lg font-semibold text-gray-700">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-3">
              Additional Comments (Optional)
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 text-gray-800 min-h-[100px]"
              placeholder="Share your thoughts about the meal..."
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitRating}
            disabled={loading || rating === 0}
            className={`py-4 rounded-xl ${
              loading || rating === 0 ? 'bg-gray-300' : 'bg-primary'
            }`}
          >
            <Text className={`text-center font-semibold text-lg ${
              loading || rating === 0 ? 'text-gray-500' : 'text-white'
            }`}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#2b377d" />
            <Text className="text-primary font-semibold ml-2">Your feedback matters!</Text>
          </View>
          <Text className="text-gray-600 text-sm">
            Your ratings help us improve the quality of meals and service in the mess.
          </Text>
        </View>
      </View>
    </View>
  );
}