import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Utensils, 
  TrendingUp,
  Download,
  Filter,
  Building,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MealAttendanceData {
  dishNames: string;
  attendingCount: number;
  totalEligible: number;
  attendancePercentage: string;
}

interface FacilityReport {
  id: string;
  name: string;
  location: string;
  meals: {
    BREAKFAST: MealAttendanceData;
    LUNCH: MealAttendanceData;
    SNACKS: MealAttendanceData;
    DINNER: MealAttendanceData;
  };
}

interface AttendanceReport {
  date: string;
  facilities: FacilityReport[];
}

const MealAttendanceReport: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchAttendanceReport();
  }, [selectedDate]);

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/meal-attendance-report', {
        params: { date: selectedDate }
      });
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance report:', error);
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const csvData = [];
      
      report?.facilities.forEach(facility => {
        Object.entries(facility.meals).forEach(([mealType, mealData]) => {
          csvData.push({
            date: report.date,
            facility: facility.name,
            location: facility.location,
            meal_type: mealType,
            dish_names: mealData.dishNames,
            attending_count: mealData.attendingCount,
            total_eligible: mealData.totalEligible,
            attendance_percentage: mealData.attendancePercentage
          });
        });
      });

      const csvContent = convertToCSV(csvData);
      downloadCSV(csvContent, `meal-attendance-report-${selectedDate}.csv`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST': return '🌅';
      case 'LUNCH': return '🌞';
      case 'SNACKS': return '☕';
      case 'DINNER': return '🌙';
      default: return '🍽️';
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST': return 'from-orange-400 to-orange-600';
      case 'LUNCH': return 'from-green-400 to-green-600';
      case 'SNACKS': return 'from-purple-400 to-purple-600';
      case 'DINNER': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && user?.role !== 'CHEF' && user?.role !== 'FNB_MANAGER') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view attendance reports.</p>
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

  const overallStats = report?.facilities.reduce((acc, facility) => {
    Object.values(facility.meals).forEach(meal => {
      acc.totalAttending += meal.attendingCount;
      acc.totalEligible += meal.totalEligible;
    });
    return acc;
  }, { totalAttending: 0, totalEligible: 0 });

  const chartData = report?.facilities.map(facility => ({
    name: facility.name,
    BREAKFAST: facility.meals.BREAKFAST.attendingCount,
    LUNCH: facility.meals.LUNCH.attendingCount,
    SNACKS: facility.meals.SNACKS.attendingCount,
    DINNER: facility.meals.DINNER.attendingCount,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Attendance Report</h1>
          <p className="text-gray-600">Tomorrow's meal attendance planning</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchAttendanceReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mt-6"
          >
            <Filter size={16} />
            <span>Update Report</span>
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <p className="text-blue-100">Total Attending</p>
              <p className="text-3xl font-bold">{overallStats?.totalAttending.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 mr-3" />
            <div>
              <p className="text-green-100">Total Eligible</p>
              <p className="text-3xl font-bold">{overallStats?.totalEligible.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 mr-3" />
            <div>
              <p className="text-purple-100">Attendance Rate</p>
              <p className="text-3xl font-bold">
                {overallStats?.totalEligible > 0 
                  ? ((overallStats.totalAttending / overallStats.totalEligible) * 100).toFixed(1)
                  : 0
                }%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Facility-wise Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Facility & Meal</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="BREAKFAST" fill="#f59e0b" name="Breakfast" />
              <Bar dataKey="LUNCH" fill="#10b981" name="Lunch" />
              <Bar dataKey="SNACKS" fill="#8b5cf6" name="Snacks" />
              <Bar dataKey="DINNER" fill="#3b82f6" name="Dinner" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Facility Reports */}
      <div className="space-y-6">
        {report?.facilities.map((facility, index) => (
          <motion.div
            key={facility.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{facility.name}</h3>
                    <p className="text-gray-500 text-sm">{facility.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Attending</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Object.values(facility.meals).reduce((sum, meal) => sum + meal.attendingCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(facility.meals).map(([mealType, mealData]) => (
                  <div key={mealType} className={`bg-gradient-to-r ${getMealColor(mealType)} rounded-lg p-4 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getMealIcon(mealType)}</span>
                        <div>
                          <h4 className="font-semibold capitalize">
                            {mealType.toLowerCase()}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm opacity-90">
                        <strong>Dish:</strong> {mealData.dishNames || 'Not planned'}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white bg-opacity-20 p-2 rounded">
                          <div className="opacity-75">Attending</div>
                          <div className="font-bold text-lg">
                            {mealData.attendingCount}
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded">
                          <div className="opacity-75">Eligible</div>
                          <div className="font-bold text-lg">
                            {mealData.totalEligible}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white bg-opacity-20 p-2 rounded">
                        <div className="flex justify-between items-center text-sm">
                          <span className="opacity-75">Rate</span>
                          <span className="font-bold">
                            {mealData.attendancePercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-1">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(parseFloat(mealData.attendancePercentage), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.values(facility.meals).reduce((sum, meal) => sum + meal.totalEligible, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Eligible</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(facility.meals).reduce((sum, meal) => sum + meal.attendingCount, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Will Attend</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.values(facility.meals).reduce((sum, meal) => sum + (meal.totalEligible - meal.attendingCount), 0)}
                    </div>
                    <div className="text-sm text-gray-500">Will Skip</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.values(facility.meals).reduce((sum, meal) => sum + meal.totalEligible, 0) > 0
                        ? ((Object.values(facility.meals).reduce((sum, meal) => sum + meal.attendingCount, 0) / 
                           Object.values(facility.meals).reduce((sum, meal) => sum + meal.totalEligible, 0)) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Overall Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!report?.facilities.length && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">No meal attendance data found for the selected date.</p>
        </div>
      )}
    </div>
  );
};

export default MealAttendanceReport;