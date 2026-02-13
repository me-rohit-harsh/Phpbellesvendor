import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';
import { toggleVendorStatus, getVendorStatus } from '../../../lib/api';
import { useDashboardAPI } from '../../../hooks/useDashboardAPI';
import { useRecentActivity } from '../../../hooks/useRecentActivity';
import { getVendorOrders } from '../../../lib/api/vendorOrders';
import OrderCard from '../vendor/OrderCard';
import { ToastManager } from '../NotificationToast';

const Dashboard = ({ businessData }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  // Use the new API-based custom hook for dashboard statistics
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useDashboardAPI({
    autoRefresh: true,
    refreshInterval: 30000
  });
  
  // Use the custom hook for recent activities
  const { 
    activities, 
    loading: activitiesLoading,
    backgroundLoading: activitiesBackgroundLoading,
    error: activitiesError,
    refreshActivities,
    getRelativeTime
  } = useRecentActivity({
    refreshInterval: 30000, // Refresh every 30 seconds
    limit: 5, // Show last 5 activities
    autoRefresh: true
  });

  const parseOrdersList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const res = await getVendorOrders();
      const list = parseOrdersList(res);
      const filtered = list.filter((item) => {
        const status = item?.status ?? item?.order_status;
        return ['pending', 'accepted_by_vendor', 'running', 'ready_for_pickup'].includes(status);
      });
      setOrders(filtered);
    } catch (e) {
      setOrdersError(e?.message || 'Failed to load orders');
      ToastManager.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleToggleStatus = async () => {
    if (isToggling) return; // Prevent multiple calls
    
    setIsToggling(true);
    try {
      await toggleVendorStatus();
      setIsRestaurantOpen(!isRestaurantOpen);
      
      setAlertConfig({
        title: 'Status Updated',
        message: `Your restaurant is now ${!isRestaurantOpen ? 'online' : 'offline'}`,
        type: 'success',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } catch (error) {
      setAlertConfig({
        title: 'Error',
        message: 'Failed to update status. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } finally {
      setIsToggling(false);
    }
  };

  const menuItems = [
    // {
    //   id: 'test-upload',
    //   title: '🧪 Test Upload',
    //   subtitle: 'Test image upload API',
    //   icon: 'cloud-upload-outline',
    //   color: '#FF6B35',
    //   route: '/business/test-upload',
    //   badge: 'DEBUG'
    // },
    // {
    //   id: 'menu',
    //   title: 'Menu Management',
    //   subtitle: 'Configure menu settings',
    //   icon: 'menu-outline',
    //   color: '#10B981',
    //   route: '/business/menu'
    // },
    // {
    //   id: 'categories',
    //   title: 'Categories',
    //   subtitle: 'Organize menu items',
    //   icon: 'grid-outline',
    //   color: '#8B5CF6',
    //   route: '/business/categories'
    // },
    // {
    //   id: 'food-items',
    //   title: 'Food Items',
    //   subtitle: 'Manage your menu',
    //   icon: 'restaurant-outline',
    //   color: '#FF6B6B',
    //   route: '/business/food-items'
    // },
    // {
    //   id: 'stock',
    //   title: 'Stock Management',
    //   subtitle: 'Track inventory',
    //   icon: 'cube-outline',
    //   color: '#4ECDC4',
    //   route: '/business/stock'
    // },
    // {
    //   id: 'pricing',
    //   title: 'Pricing',
    //   subtitle: 'Set item prices',
    //   icon: 'pricetag-outline',
    //   color: '#45B7D1',
    //   route: '/business/pricing'
    // },
    // {
    //   id: 'offers',
    //   title: 'Offers & Promotions',
    //   subtitle: 'Create deals',
    //   icon: 'gift-outline',
    //   color: '#F7DC6F',
    //   route: '/business/offers'
    // },
    {
      id: 'coupons',
      title: 'Coupons',
      subtitle: 'Manage discount codes',
      icon: 'gift-outline',
      color: '#0F9D58',
      route: '/vendor/coupons'
    },
    {
      id: 'profile',
      title: 'Business Profile',
      subtitle: 'Update details',
      icon: 'business-outline',
      color: '#BB8FCE',
      route: '/business/profile'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View reports',
      icon: 'analytics-outline',
      color: '#85C1E9',
      route: '/business/analytics'
    }
  ];

  const quickStats = [
    { 
      label: 'Total Items', 
      value: statsLoading ? '...' : stats.totalItems.toString(), 
      icon: 'restaurant', 
      color: '#FF6B6B',
      route: '/business/food-items',
      action: () => router.push('/business/food-items')
    },
    { 
      label: 'Categories', 
      value: statsLoading ? '...' : stats.totalCategories.toString(), 
      icon: 'grid', 
      color: '#9B59B6',
      route: '/business/categories',
      action: () => router.push('/business/categories')
    },
    { 
      label: 'Orders Today', 
      value: stats.ordersToday.toString(), 
      icon: 'bag', 
      color: '#4ECDC4',
      route: '/vendor/orders',
      action: () => router.push('/vendor/orders')
    },
    { 
      label: 'Revenue', 
      value: stats.revenue, 
      icon: 'cash', 
      color: '#45B7D1',
      route: '/vendor/wallet',
      action: () => router.push('/vendor/wallet')
    }
  ];

  const handleMenuPress = (route) => {
    router.push(route);
  };

  const showInfoMessage = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refreshStats(),
      refreshActivities(),
      fetchOrders()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [refreshStats, refreshActivities, fetchOrders]);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Add Food Items':
        router.push('/business/food-items');
        break;
      case 'View Orders':
        showInfoMessage('Quick Action', `${action} feature coming soon!`);
        break;
      case 'Update Menu':
        router.push('/business/food-items');
        break;
      case 'Manage Offers':
        showInfoMessage('Quick Action', `${action} feature coming soon!`);
        break;
      default:
        showInfoMessage('Quick Action', `${action} feature coming soon!`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.businessName}>
              {businessData?.businessName || 'Your Business'}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: isRestaurantOpen ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {isRestaurantOpen ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[
                styles.statusToggle, 
                { 
                  backgroundColor: isRestaurantOpen ? '#EF4444' : '#10B981',
                  opacity: isToggling ? 0.7 : 1
                }
              ]}
              onPress={handleToggleStatus}
              disabled={isToggling}
            >
              {isToggling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name={isRestaurantOpen ? 'pause' : 'play'} 
                  size={16} 
                  color="white" 
                />
              )}
              <Text style={styles.statusToggleText}>
                {isToggling ? 'Updating...' : (isRestaurantOpen ? 'Go Offline' : 'Go Online')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/business/profile')}
            >
              <Ionicons name="person-circle-outline" size={32} color="#020A66" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#020A66']}
            tintColor="#020A66"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.sectionHeader}>
            {/* <Text style={styles.sectionTitle}>Today's Overview</Text> */}
            {statsError && (
              <TouchableOpacity onPress={refreshStats} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#020A66" />
              </TouchableOpacity>
            )}
          </View>
          
          {statsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText} numberOfLines={1} ellipsizeMode="tail">Failed to load statistics</Text>
              <TouchableOpacity onPress={refreshStats} style={styles.retryButton}>
                <Text style={styles.retryText} numberOfLines={1} ellipsizeMode="tail">Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {quickStats.map((stat, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.statCard}
                  onPress={stat.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                    <Ionicons name={stat.icon} size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">{stat.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">{stat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Menu Management */}
        <View style={styles.menuContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Management</Text>
            {/* <TouchableOpacity onPress={() => router.push('/business/food-items')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity> */}
          </View>
          
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false}
            style={styles.menuGridContainer}
          >
            <View style={styles.menuGrid}>
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/business/menu')}
              >
                <View style={styles.menuCardContent}>
                  <Ionicons name="menu" size={24} color="#020A66" />
                  <Text style={styles.menuCardTitle} numberOfLines={1} ellipsizeMode="tail">Menu Details</Text>
                  <Text style={styles.menuCardCount} numberOfLines={1} ellipsizeMode="tail">
                   Manage Menu
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/business/food-items')}
              >
                <View style={styles.menuCardContent}>
                  <Ionicons name="restaurant" size={24} color="#020A66" />
                  <Text style={styles.menuCardTitle} numberOfLines={1} ellipsizeMode="tail">Food Items</Text>
                  <Text style={styles.menuCardCount} numberOfLines={1} ellipsizeMode="tail">
                    {statsLoading ? '...' : `${stats.totalItems} items`}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => router.push('/business/categories')}
              >
                <View style={styles.menuCardContent}>
                  <Ionicons name="pricetag" size={24} color="#10B981" />
                  <Text style={styles.menuCardTitle} numberOfLines={1} ellipsizeMode="tail">Categories</Text>
                  <Text style={styles.menuCardCount} numberOfLines={1} ellipsizeMode="tail">
                    {statsLoading ? '...' : `${stats.totalCategories} categories`}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Business Management */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Manage Your Business</Text>
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuGrid}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.menuTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                <Text style={styles.menuSubtitle} numberOfLines={1} ellipsizeMode="tail">{item.subtitle}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <View style={styles.sectionHeader}>
              <View style={styles.activityTitleContainer}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {activitiesBackgroundLoading && (
                  <View style={styles.backgroundLoadingIndicator} />
                )}
              </View>
              <TouchableOpacity 
                onPress={refreshActivities}
                style={styles.activityRefreshButton}
                disabled={activitiesLoading}
              >
                {activitiesLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="refresh" size={18} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
          
          <View style={styles.activityCard}>
            {activitiesLoading && activities.length === 0 ? (
            <View style={styles.activityLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.activityLoadingText} numberOfLines={1} ellipsizeMode="tail">Loading activities...</Text>
            </View>
          ) : activitiesError ? (
              <View style={styles.activityErrorContainer}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.activityErrorText}>Failed to load activities</Text>
                <TouchableOpacity onPress={refreshActivities} style={styles.retryButton}>
                  <Text style={styles.retryText} numberOfLines={1} ellipsizeMode="tail">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.activityEmptyContainer}>
                <Ionicons name="time-outline" size={32} color="#9CA3AF" />
                <Text style={styles.activityEmptyText} numberOfLines={1} ellipsizeMode="tail">No recent activities</Text>
                <Text style={styles.activityEmptySubtext}>
                  Real-time activities will appear here when customers place orders, you update your menu, or other business events occur
                </Text>
              </View>
            ) : (
              activities.map((activity, index) => (
                <View key={activity.id || index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={activity.icon} 
                      size={20} 
                      color={activity.color} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{getRelativeTime(activity.timestamp)}</Text>
                  </View>
                  {activity.amount && (
                    <View style={styles.activityAmount}>
                      <Text style={styles.activityAmountText}>₹{activity.amount}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.menuContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Orders</Text>
            <TouchableOpacity onPress={() => router.push('/vendor/orders')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {ordersLoading ? (
            <View style={styles.errorContainer}>
              <ActivityIndicator size="large" color="#020A66" />
              <Text style={styles.activityLoadingText} numberOfLines={1} ellipsizeMode="tail">Loading orders...</Text>
            </View>
          ) : ordersError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText} numberOfLines={1} ellipsizeMode="tail">{ordersError}</Text>
              <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
                <Text style={styles.retryText} numberOfLines={1} ellipsizeMode="tail">Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.activityEmptyContainer}>
              <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
              <Text style={styles.activityEmptyText} numberOfLines={1} ellipsizeMode="tail">No orders yet</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {orders.map((item) => {
                const id = item?.id ?? item?.order_id ?? item?.uuid;
                const getCustomerDisplayName = (order) => {
                  const direct =
                    order?.customer_name ??
                    order?.customerName ??
                    order?.name ??
                    order?.full_name ??
                    order?.fullName;
                  if (direct && String(direct).trim().length) return String(direct).trim();
                  const fromUser =
                    order?.user?.name ??
                    (order?.user?.first_name && order?.user?.last_name
                      ? `${order.user.first_name} ${order.user.last_name}`
                      : null) ??
                    order?.user?.full_name;
                  if (fromUser && String(fromUser).trim().length) return String(fromUser).trim();
                  const fromCustomer =
                    order?.customer?.name ??
                    (order?.customer?.first_name && order?.customer?.last_name
                      ? `${order.customer.first_name} ${order.customer.last_name}`
                      : null) ??
                    order?.customer?.full_name;
                  if (fromCustomer && String(fromCustomer).trim().length) return String(fromCustomer).trim();
                  const fromContact = order?.contact?.name;
                  if (fromContact && String(fromContact).trim().length) return String(fromContact).trim();
                  return '';
                };
                const customerName = getCustomerDisplayName(item);
                const computeTotal = (order) => {
                  const candidates = [order?.total, order?.grand_total, order?.amount, order?.price];
                  const firstValid = candidates.find((v) => v !== null && v !== undefined && Number(v) > 0);
                  if (firstValid !== undefined) return Number(firstValid);
                  const items = order?.items ?? order?.order_items ?? [];
                  if (Array.isArray(items) && items.length > 0) {
                    const sum = items.reduce((acc, it) => {
                      const qty = Number(it?.qty ?? it?.quantity ?? it?.count ?? 1);
                      const unit = Number(it?.price ?? it?.unit_price ?? it?.amount ?? it?.total ?? 0);
                      return acc + (Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : 0);
                    }, 0);
                    if (sum > 0) return sum;
                  }
                  const fees = Number(order?.delivery_fee ?? order?.shipping_fee ?? 0);
                  const taxes = Number(order?.tax ?? order?.taxes ?? 0);
                  const subtotal = Number(order?.subtotal ?? 0);
                  return subtotal + fees + taxes;
                };
                const total = computeTotal(item);
                const status = item?.status ?? item?.order_status;
                const createdAt = item?.created_at ?? item?.createdAt ?? item?.date;
                return (
                  <OrderCard
                    key={String(id)}
                    id={id}
                    customerName={customerName}
                    total={total}
                    status={status}
                    created_at={createdAt}
                    onPress={() => router.push(`/vendor/orders/${id}`)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'MyFont-Regular',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  businessName: {
    fontSize: 24,
    color: '#020A66',
    fontFamily: 'MyFont-Bold',
    marginTop: 2,
    marginRight: 4,
    lineHeight: 28
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Medium',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusToggleText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'MyFont-Medium',
  },
  profileButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 15,
    marginTop: 20,
  },
  statsContainer: {
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    textAlign: 'center',
  },
  menuContainer: {
    marginTop: 10,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: 160,
    marginRight: 12,
    marginBottom: 12,
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
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    textAlign: 'center',
  },
  activityContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  activityTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backgroundLoadingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    opacity: 0.6,
  },
  activityRefreshButton: {
    padding: 4,
  },
  activityCard: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityIcon: {
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Medium',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  activityDescription: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'MyFont-Regular',
    marginBottom: 2,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  activityAmountText: {
    fontSize: 14,
    color: '#059669',
    fontFamily: 'MyFont-Bold',
  },
  activityLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  activityLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginLeft: 8,
  },
  activityErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  activityErrorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'MyFont-Medium',
    marginTop: 8,
    marginBottom: 12,
  },
  activityEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  activityEmptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'MyFont-Medium',
    marginTop: 12,
    marginBottom: 4,
  },
  activityEmptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#020A66',
    fontFamily: 'MyFont-Medium',
  },
  menuCardContent: {
    alignItems: 'center',
  },
  menuCardTitle: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  menuCardCount: {
     fontSize: 12,
     fontFamily: 'MyFont-Regular',
     color: '#6B7280',
   },
   menuGridContainer: {
    flexDirection: 'row',
  },
  menuGrid: {
    flexDirection: 'row',
    paddingRight: 16,
  },
   section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'MyFont-Medium',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#020A66',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'MyFont-Medium',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'MyFont-Bold',
    letterSpacing: 0.5,
  },
});

export default Dashboard;
