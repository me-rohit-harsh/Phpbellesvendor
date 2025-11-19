import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Analytics = () => {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'

  // Sample analytics data
  const analyticsData = {
    week: {
      revenue: 2450.75,
      orders: 87,
      customers: 65,
      avgOrderValue: 28.17,
      topItems: [
        { name: 'Butter Chicken', orders: 23, revenue: 436.77 },
        { name: 'Chicken Biryani', orders: 18, revenue: 413.82 },
        { name: 'Paneer Tikka', orders: 15, revenue: 194.85 },
        { name: 'Garlic Naan', orders: 32, revenue: 159.68 },
        { name: 'Gulab Jamun', orders: 12, revenue: 83.88 }
      ],
      dailySales: [
        { day: 'Mon', revenue: 320.50, orders: 12 },
        { day: 'Tue', revenue: 285.25, orders: 10 },
        { day: 'Wed', revenue: 410.75, orders: 15 },
        { day: 'Thu', revenue: 380.00, orders: 14 },
        { day: 'Fri', revenue: 520.25, orders: 18 },
        { day: 'Sat', revenue: 345.00, orders: 13 },
        { day: 'Sun', revenue: 189.00, orders: 5 }
      ],
      customerMetrics: {
        newCustomers: 23,
        returningCustomers: 42,
        customerRetention: 64.6
      }
    },
    month: {
      revenue: 12750.50,
      orders: 425,
      customers: 287,
      avgOrderValue: 30.00,
      topItems: [
        { name: 'Butter Chicken', orders: 98, revenue: 1862.02 },
        { name: 'Chicken Biryani', orders: 85, revenue: 1954.15 },
        { name: 'Paneer Tikka', orders: 72, revenue: 934.28 },
        { name: 'Garlic Naan', orders: 156, revenue: 778.44 },
        { name: 'Gulab Jamun', orders: 64, revenue: 447.36 }
      ],
      customerMetrics: {
        newCustomers: 89,
        returningCustomers: 198,
        customerRetention: 69.0
      }
    },
    year: {
      revenue: 156780.25,
      orders: 5234,
      customers: 1876,
      avgOrderValue: 29.95,
      topItems: [
        { name: 'Butter Chicken', orders: 1245, revenue: 23655.55 },
        { name: 'Chicken Biryani', orders: 1089, revenue: 25045.11 },
        { name: 'Paneer Tikka', orders: 892, revenue: 11584.08 },
        { name: 'Garlic Naan', orders: 1876, revenue: 9361.24 },
        { name: 'Gulab Jamun', orders: 756, revenue: 5284.44 }
      ],
      customerMetrics: {
        newCustomers: 1234,
        returningCustomers: 642,
        customerRetention: 34.2
      }
    }
  };

  const currentData = analyticsData[selectedPeriod];

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'This Week';
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color = '#020A66' }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const TopItemCard = ({ item, index }) => (
    <View style={styles.topItemCard}>
      <View style={styles.topItemRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <View style={styles.topItemInfo}>
        <Text style={styles.topItemName}>{item.name}</Text>
        <Text style={styles.topItemStats}>
          {item.orders} orders • {formatCurrency(item.revenue)}
        </Text>
      </View>
      <View style={styles.topItemRevenue}>
        <Text style={styles.revenueAmount}>{formatCurrency(item.revenue)}</Text>
      </View>
    </View>
  );

  const SimpleBarChart = ({ data }) => {
    const maxRevenue = Math.max(...data.map(item => item.revenue));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Sales</Text>
        <View style={styles.chart}>
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 120;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height }]} />
                  <Text style={styles.barValue}>{formatCurrency(item.revenue)}</Text>
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity 
          style={styles.walletButton}
          onPress={() => router.push('/vendor/wallet')}
        >
          <Ionicons name="wallet" size={20} color="#020A66" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getPeriodLabel()} Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(currentData.revenue)}
              icon="cash-outline"
              color="#10B981"
            />
            <MetricCard
              title="Total Orders"
              value={currentData.orders.toString()}
              icon="receipt-outline"
              color="#3B82F6"
            />
            <MetricCard
              title="Customers"
              value={currentData.customers.toString()}
              icon="people-outline"
              color="#8B5CF6"
            />
            <MetricCard
              title="Avg Order Value"
              value={formatCurrency(currentData.avgOrderValue)}
              icon="trending-up-outline"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Sales Chart */}
        {selectedPeriod === 'week' && currentData.dailySales && (
          <View style={styles.section}>
            <SimpleBarChart data={currentData.dailySales} />
          </View>
        )}

        {/* Customer Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          <View style={styles.customerMetricsContainer}>
            <View style={styles.customerMetricCard}>
              <Text style={styles.customerMetricValue}>
                {currentData.customerMetrics.newCustomers}
              </Text>
              <Text style={styles.customerMetricLabel}>New Customers</Text>
              <View style={styles.customerMetricIcon}>
                <Ionicons name="person-add-outline" size={20} color="#10B981" />
              </View>
            </View>
            
            <View style={styles.customerMetricCard}>
              <Text style={styles.customerMetricValue}>
                {currentData.customerMetrics.returningCustomers}
              </Text>
              <Text style={styles.customerMetricLabel}>Returning</Text>
              <View style={styles.customerMetricIcon}>
                <Ionicons name="repeat-outline" size={20} color="#3B82F6" />
              </View>
            </View>
            
            <View style={styles.customerMetricCard}>
              <Text style={styles.customerMetricValue}>
                {formatPercentage(currentData.customerMetrics.customerRetention)}
              </Text>
              <Text style={styles.customerMetricLabel}>Retention Rate</Text>
              <View style={styles.customerMetricIcon}>
                <Ionicons name="heart-outline" size={20} color="#EF4444" />
              </View>
            </View>
          </View>
        </View>

        {/* Top Selling Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <View style={styles.topItemsList}>
            {currentData.topItems.map((item, index) => (
              <TopItemCard key={index} item={item} index={index} />
            ))}
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={styles.insightTitle}>Revenue Growth</Text>
              </View>
              <Text style={styles.insightDescription}>
                Your revenue has increased by 15.3% compared to last {selectedPeriod}
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.insightTitle}>Best Performer</Text>
              </View>
              <Text style={styles.insightDescription}>
                {currentData.topItems[0].name} is your top revenue generator this {selectedPeriod}
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
                <Text style={styles.insightTitle}>Customer Base</Text>
              </View>
              <Text style={styles.insightDescription}>
                {formatPercentage((currentData.customerMetrics.newCustomers / currentData.customers) * 100)} of your customers are new this {selectedPeriod}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  placeholder: {
    width: 40,
  },
  walletButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#020A66',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#9CA3AF',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
    marginBottom: 8,
  },
  bar: {
    width: 20,
    backgroundColor: '#020A66',
    borderRadius: 2,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    transform: [{ rotate: '-45deg' }],
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
  },
  customerMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerMetricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  customerMetricValue: {
    fontSize: 24,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerMetricLabel: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  customerMetricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topItemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#020A66',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  topItemStats: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  topItemRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#10B981',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default Analytics;