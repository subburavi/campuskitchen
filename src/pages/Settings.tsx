import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Plus, Edit, Trash2, Save } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { showSuccess, showError, showConfirm } from '../utils/sweetAlert';

interface Category {
  id: string;
  name: string;
  _count?: { items: number };
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mealTimes, setMealTimes] = useState({
    breakfast_start: '07:30',
    breakfast_end: '09:30',
    lunch_start: '12:00',
    lunch_end: '14:00',
    snacks_start: '16:00',
    snacks_end: '17:30',
    dinner_start: '19:00',
    dinner_end: '21:00'
  });
  const [attendanceSettings, setAttendanceSettings] = useState({
    isMandatory: false,
    reminderStartTime: '15:00',
    reminderEndTime: '22:00',
    cutoffTime: '23:00'
  });
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [savingTimes, setSavingTimes] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchMealTimes();
    fetchAttendanceSettings();
    fetchPaymentGateways();
    setLoading(false);
  }, []);

  const fetchMealTimes = async () => {
    try {
      const response = await api.get('/system-config/meal-times');
      setMealTimes(response.data);
    } catch (error) {
      console.error('Failed to fetch meal times:', error);
    }
  };

  const fetchAttendanceSettings = async () => {
    try {
      const response = await api.get('/system-config/attendance-settings');
      setAttendanceSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance settings:', error);
    }
  };

  const fetchPaymentGateways = async () => {
    try {
      const response = await api.get('/system-config/payment-gateways');
      setPaymentGateways(response.data);
    } catch (error) {
      console.error('Failed to fetch payment gateways:', error);
    }
  };

  const handleMealTimeChange = (key: string, value: string) => {
    setMealTimes(prev => ({ ...prev, [key]: value }));
  };

  const handleAttendanceChange = (key: string, value: any) => {
    setAttendanceSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePaymentGatewayChange = (index: number, key: string, value: any) => {
    const newGateways = [...paymentGateways];
    newGateways[index] = { ...newGateways[index], [key]: value };
    setPaymentGateways(newGateways);
  };

  const handleSaveMealTimes = async () => {
    setSavingTimes(true);
    try {
      await api.post('/system-config/meal-times', mealTimes);
      showSuccess('Success', 'Meal times updated successfully');
    } catch (error) {
      showError('Error', 'Failed to update meal times');
    } finally {
      setSavingTimes(false);
    }
  };

  const handleSaveAttendanceSettings = async () => {
    setSavingAttendance(true);
    try {
      await api.post('/system-config/attendance-settings', attendanceSettings);
      showSuccess('Success', 'Attendance settings updated successfully');
    } catch (error) {
      showError('Error', 'Failed to update attendance settings');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleSavePaymentGateways = async () => {
    setSavingPayment(true);
    try {
      for (const gateway of paymentGateways) {
        await api.post('/system-config/payment-gateways', gateway);
      }
      showSuccess('Success', 'Payment gateway settings updated successfully');
    } catch (error) {
      showError('Error', 'Failed to update payment gateway settings');
    } finally {
      setSavingPayment(false);
    }
  };








  const canManage = user?.role === 'ADMIN';

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <SettingsIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">System-wide application settings</p>
      </div>




      {/* System Settings Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Settings</h2>
          <p className="text-sm text-gray-500">Configure system-wide settings</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Meal Times Configuration */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Meal Times Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breakfast Start</label>
                <input
                  type="time"
                  value={mealTimes.breakfast_start}
                  onChange={(e) => handleMealTimeChange('breakfast_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breakfast End</label>
                <input
                  type="time"
                  value={mealTimes.breakfast_end}
                  onChange={(e) => handleMealTimeChange('breakfast_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Start</label>
                <input
                  type="time"
                  value={mealTimes.lunch_start}
                  onChange={(e) => handleMealTimeChange('lunch_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch End</label>
                <input
                  type="time"
                  value={mealTimes.lunch_end}
                  onChange={(e) => handleMealTimeChange('lunch_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Snacks Start</label>
                <input
                  type="time"
                  value={mealTimes.snacks_start}
                  onChange={(e) => handleMealTimeChange('snacks_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Snacks End</label>
                <input
                  type="time"
                  value={mealTimes.snacks_end}
                  onChange={(e) => handleMealTimeChange('snacks_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dinner Start</label>
                <input
                  type="time"
                  value={mealTimes.dinner_start}
                  onChange={(e) => handleMealTimeChange('dinner_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dinner End</label>
                <input
                  type="time"
                  value={mealTimes.dinner_end}
                  onChange={(e) => handleMealTimeChange('dinner_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleSaveMealTimes}
                disabled={savingTimes}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {savingTimes ? 'Saving...' : 'Save Meal Times'}
              </button>
            </div>
          </div>

          {/* Meal Attendance Settings */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Meal Attendance Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Mandatory Attendance Marking</h4>
                  <p className="text-sm text-gray-500">
                    Require students to mark attendance for next day meals
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={attendanceSettings.isMandatory}
                    onChange={(e) => handleAttendanceChange('isMandatory', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Start Time</label>
                  <input
                    type="time"
                    value={attendanceSettings.reminderStartTime}
                    onChange={(e) => handleAttendanceChange('reminderStartTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder End Time</label>
                  <input
                    type="time"
                    value={attendanceSettings.reminderEndTime}
                    onChange={(e) => handleAttendanceChange('reminderEndTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cutoff Time</label>
                  <input
                    type="time"
                    value={attendanceSettings.cutoffTime}
                    onChange={(e) => handleAttendanceChange('cutoffTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleSaveAttendanceSettings}
                disabled={savingAttendance}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {savingAttendance ? 'Saving...' : 'Save Attendance Settings'}
              </button>
            </div>
          </div>

          {/* Payment Gateway Settings */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Payment Gateway Configuration</h3>
            
            {paymentGateways.map((gateway, index) => (
              <div key={gateway.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 capitalize">{gateway.provider}</h4>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gateway.isLive}
                        onChange={(e) => handlePaymentGatewayChange(index, 'isLive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Live Mode</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gateway.active}
                        onChange={(e) => handlePaymentGatewayChange(index, 'active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Key ID</label>
                    <input
                      type="text"
                      value={gateway.testKeyId || ''}
                      onChange={(e) => handlePaymentGatewayChange(index, 'testKeyId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="rzp_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Key Secret</label>
                    <input
                      type="password"
                      value={gateway.testKeySecret || ''}
                      onChange={(e) => handlePaymentGatewayChange(index, 'testKeySecret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Test secret key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Live Key ID</label>
                    <input
                      type="text"
                      value={gateway.liveKeyId || ''}
                      onChange={(e) => handlePaymentGatewayChange(index, 'liveKeyId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="rzp_live_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Live Key Secret</label>
                    <input
                      type="password"
                      value={gateway.liveKeySecret || ''}
                      onChange={(e) => handlePaymentGatewayChange(index, 'liveKeySecret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Live secret key"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                    <input
                      type="password"
                      value={gateway.webhookSecret || ''}
                      onChange={(e) => handlePaymentGatewayChange(index, 'webhookSecret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Webhook secret"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4">
              <button
                onClick={handleSavePaymentGateways}
                disabled={savingPayment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {savingPayment ? 'Saving...' : 'Save Payment Settings'}
              </button>
            </div>
          </div>

          {/* Auto PO Settings */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Automatic Purchase Orders</h3>
              <p className="text-sm text-gray-500">
                Automatically generate POs for low stock items
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Stock Alert Settings */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Stock Alerts</h3>
              <p className="text-sm text-gray-500">
                Send notifications for low stock and expiring items
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Default Tax Rate */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Default Tax Rate</h3>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue="18"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Settings;