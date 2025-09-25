import axios from 'axios';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { BASE_URL } from './baseurl';

//const BASE_URL = 'https://foodserver.orfus.in/api';
const BASE_URL1 = BASE_URL+'/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL1,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data);   
        const message = error.response?.data?.error || 'An error occurred';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: message,
        });
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Auth token set');
    } else {
      delete this.api.defaults.headers.common['Authorization'];
      console.log('Auth token cleared');
    }
  }

  // Auth endpoints
  async sendOTP(registerNumber) {
    const response = await this.api.post('/mobile/send-otp', { registerNumber });
    return response.data;
  }
   async registerPushToken(token,Platform) {
    const response = await this.api.post('/mobile/register-push-token', { token,Platform });
    return response.data;
  }

  async verifyOTP(registerNumber, otp) {
    const response = await this.api.post('/mobile/verify-otp', { registerNumber, otp });
    return response.data;
  }

  // Student endpoints
  async getStudentProfile() {
    const response = await this.api.get('/mobile/profile');
    return response.data;
  }

  async updateProfile(data) {
    const response = await this.api.put('/mobile/profile', data);
    return response.data;
  }

  // Meal endpoints
  async getTodaysMeals() {
    const response = await this.api.get('/mobile/meals/today');
    return response.data;
  }

  async getWeeklyMealPlan() {
    const response = await this.api.get('/mobile/meals/weekly/by-user');
    return response.data;
  }

  // Fetch configured meal times (breakfast_start, breakfast_end, etc.)
  async getMealTimes() {
    const response = await this.api.get('/mobile/meal-times');
    return response.data;
  }

  async setMealAttendance(mealId, willAttend) {
    const response = await this.api.post('/mobile/meals/attendance', {
      mealId,
      willAttend
    });
    return response.data;
  }

  async uploadProfilePhoto(photoData) {
    const response = await this.api.post('/mobile/upload-photo', { photoData });
    return response.data;
  }

  // Rating endpoints
  async rateMeal(mealId, rating, comment) {
    const response = await this.api.post('/mobile/meals/rate', {
      mealId,
      rating,
      comment
    });
    return response.data;
  }

  // QR Code endpoints
  async generateQRCode() {
    const response = await this.api.get('/mobile/qr-code');
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.api.get('/mobile/notifications');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.api.get('/mobile/notifications/unread-count');
    return response.data;
  }

  async markNotificationRead(notificationId) {
    const response = await this.api.put(`/mobile/notifications/${notificationId}/read`);
    return response.data;
  }

  // Subscription endpoints
  async getCurrentSubscription() {
    const response = await this.api.get('/mobile/subscription');
    return response.data;
  }

  async getAvailablePackages() {
    const response = await this.api.get('/mobile/packages');
    return response.data;
  }

  async getSubscriptionHistory() {
    const response = await this.api.get('/mobile/subscription-history');
    return response.data;
  }

  // Payment endpoints
  async createRazorpayOrder(packageId, messFacilityId) {
    const response = await this.api.post('/razorpay/create-order', {
      packageId,
      messFacilityId
    });
    return response.data;
  }

  async verifyPayment(paymentData) {
    const response = await this.api.post('/razorpay/verify-payment', paymentData);
    return response.data;
  }

  // Order endpoints
  async getMessFacilities() {
    const response = await this.api.get('/mobile/mess-facilities');
    return response.data;
  }

  async getMenuItems(facilityId, mealType) {
    const response = await this.api.get('/mobile/menu-items', {
      params: { facilityId, mealType }
    });
    return response.data;
  }

  async createOrder(orderData) {
    const response = await this.api.post('/mobile/orders', orderData);
    return response.data;
  }

  async createFoodOrder(orderId) {
    const response = await this.api.post('/razorpay/create-food-order', { orderId });
    return response.data;
  }

  async verifyFoodPayment(paymentData) {
    const response = await this.api.post('/razorpay/verify-food-payment', paymentData);
    return response.data;
  }

  async getOrderDetails(orderId) {
    console.log("Fetching order details for orderId:", orderId);
    const response = await this.api.get(`/mobile/orders/${orderId}`);
    return response.data;
  }

  async getOrderHistory() {
    const response = await this.api.get('/mobile/orders');
    return response.data;
  }
}

export const apiService = new ApiService();