import axios from 'axios';
import Toast from 'react-native-toast-message';

const BASE_URL = 'https://subbuserver.pretutors.com/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
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
        console.error('Stack trace:', error.response?.data);   
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
          console.log('Auth token set:', this.api.defaults.headers.common['Authorization']);
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

  async getTomorrowsMealPlan() {
    const response = await this.api.get('/mobile/meals/tomorrow');
    return response.data;
  }

  async getWeeklyMealPlan() {
    const response = await this.api.get('/mobile/meals/weekly');
    return response.data;
  }

  async setMealAttendance(mealId, willAttend) {
    const response = await this.api.post('/mobile/meals/attendance', {
      mealId,
      willAttend
    });
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

  async getMealRatings() {
    const response = await this.api.get('/mobile/meals/ratings');
    return response.data;
  }

  // QR Code endpoints
  async generateQRCode() {
    const response = await this.api.get('/mobile/qr-code');
    return response.data;
  }

  async markAttendance(qrData) {
    const response = await this.api.post('/mobile/attendance', { qrData });
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.api.get('/mobile/notifications');
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

  async registerPushToken(token, platform) {
    const response = await this.api.post('/mobile/register-push-token', {
      token,
      platform
    });
    return response.data;
  }
}

export const apiService = new ApiService();