import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../services/baseurl';


export default function ProfileScreen({navigation}) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiService.getStudentProfile();
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatedProfile = await apiService.updateProfile(editedProfile);
      setProfile(updatedProfile);
      setEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploadingPhoto(true);
        const response = await apiService.uploadProfilePhoto(result.assets[0].base64);
        
        setProfile(prev => ({ ...prev, photoUrl: response.photoUrl }));
        setEditedProfile(prev => ({ ...prev, photoUrl: response.photoUrl }));
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile photo updated successfully',
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload photo',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-12 rounded-b-3xl">
        <View className="flex-row justify-between items-center mt-2">
          <View>
            <Text className="text-white text-2xl font-bold">Profile</Text>
            <Text className="text-white opacity-80 mt-1">Manage your account</Text>
          </View>
          <TouchableOpacity
            onPress={() => setEditing(!editing)}
            className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center"
          >
            <Ionicons 
              name={editing ? 'close-outline' : 'create-outline'} 
              size={24} 
              color="#2b377d" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 -mt-6">
        {/* Profile Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <View className="items-center mb-6">
            <TouchableOpacity 
              onPress={handlePhotoUpload}
              className="relative mb-3"
              disabled={uploadingPhoto}
            >
              {profile?.photoUrl ? (
                <Image
                  source={{ uri: BASE_URL+profile.photoUrl }}
                  className="w-20 h-20 rounded-full"
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-bold">
                    {profile?.name?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                {uploadingPhoto ? (
                  <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ionicons name="camera" size={14} color="white" />
                )}
              </View>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">{profile?.name}</Text>
            <Text className="text-gray-600">{profile?.registerNumber}</Text>
          </View>

          {/* Profile Fields */}
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
              {editing ? (
                <TextInput
                  className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
                  value={editedProfile.name || ''}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <Text className="text-gray-800 text-lg">{profile?.name}</Text>
              )}
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Register Number</Text>
              <Text className="text-gray-800 text-lg">{profile?.registerNumber}</Text>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Mobile Number</Text>
              {editing ? (
                <TextInput
                  className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
                  value={editedProfile.mobileNumber || ''}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, mobileNumber: text }))}
                  placeholder="Enter your mobile number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-gray-800 text-lg">{profile?.mobileNumber}</Text>
              )}
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              {editing ? (
                <TextInput
                  className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
                  value={editedProfile.email || ''}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text className="text-gray-800 text-lg">{profile?.email || 'Not provided'}</Text>
              )}
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Room Number</Text>
              {editing ? (
                <TextInput
                  className="bg-gray-50 rounded-lg px-4 py-3 text-gray-800"
                  value={editedProfile.roomNumber || ''}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, roomNumber: text }))}
                  placeholder="Enter your room number"
                />
              ) : (
                <Text className="text-gray-800 text-lg">{profile?.roomNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              className={`mt-6 py-4 rounded-xl ${saving ? 'bg-gray-300' : 'bg-primary'}`}
            >
              <Text className={`text-center font-semibold text-lg ${
                saving ? 'text-gray-500' : 'text-white'
              }`}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

    

        {/* Settings */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Settings</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={24} color="#666" />
              <Text className="text-gray-800 ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
          </TouchableOpacity>

          {/* <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="camera-outline" size={24} color="#666" />
              <Text className="text-gray-800 ml-3">Upload Photo</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
          </TouchableOpacity> */}

          {/* <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={24} color="#666" />
              <Text className="text-gray-800 ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={24} color="#666" />
              <Text className="text-gray-800 ml-3">About</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
          </TouchableOpacity> */}

          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center py-3 mt-2"
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text className="text-red-500 ml-3 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}