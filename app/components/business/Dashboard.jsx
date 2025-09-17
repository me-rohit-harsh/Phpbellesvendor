import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';
import { toggleVendorStatus, getVendorStatus } from '../../../lib/api';

const Dashboard = ({ businessData }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  // Additional security check - verify vendor status when dashboard loads
  useEffect(() => {
    const verifyVendorStatus = async () => {
      try {
        const statusResponse = await getVendorStatus();
        
        // If vendor is not verified, redirect to home (which will show verification screen)
        if (statusResponse && statusResponse.status !== 'verified') {
          router.replace('/home');
          return;
        }
        
        setIsVerifying(false);
      } catch (error) {
        console.error('Error verifying vendor status:', error);
        // On error, redirect to registration
        router.replace('/vendor/register');
      }
    };

    verifyVendorStatus();
  }, []);

  // Show loading while verifying status
  if (isVerifying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Verifying access permissions...</Text>
      </View>
    );
  }

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
    {
      id: 'food-items',
      title: 'Food Items',
      subtitle: 'Manage your menu',
      icon: 'restaurant-outline',
      color: '#FF6B6B',
      route: '/business/food-items'
    },
    {
      id: 'stock',
      title: 'Stock Management',
      subtitle: 'Track inventory',
      icon: 'cube-outline',
      color: '#4ECDC4',
      route: '/business/stock'
    },
    {
      id: 'pricing',
      title: 'Pricing',
      subtitle: 'Set item prices',
      icon: 'pricetag-outline',
      color: '#45B7D1',
      route: '/business/pricing'
    },
    {
      id: 'offers',
      title: 'Offers & Promotions',
      subtitle: 'Create deals',
      icon: 'gift-outline',
      color: '#F7DC6F',
      route: '/business/offers'
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
    { label: 'Total Items', value: '24', icon: 'restaurant', color: '#FF6B6B' },
    { label: 'Orders Today', value: '12', icon: 'bag', color: '#4ECDC4' },
    { label: 'Revenue', value: '₹2,450', icon: 'cash', color: '#45B7D1' },
    { label: 'Active Offers', value: '3', icon: 'gift', color: '#F7DC6F' }
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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Add Food Item':
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Management */}
        <View style={styles.menuContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Management</Text>
            <TouchableOpacity onPress={() => router.push('/business/food-items')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={() => router.push('/business/food-items')}
            >
              <View style={styles.menuCardContent}>
                <Ionicons name="restaurant" size={24} color="#020A66" />
                <Text style={styles.menuCardTitle}>Food Items</Text>
                <Text style={styles.menuCardCount}>12 items</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuCard}>
              <View style={styles.menuCardContent}>
                <Ionicons name="pricetag" size={24} color="#10B981" />
                <Text style={styles.menuCardTitle}>Categories</Text>
                <Text style={styles.menuCardCount}>5 categories</Text>
              </View>
            </TouchableOpacity>
          </View>
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
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New order received</Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="add-circle" size={20} color="#45B7D1" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Menu item added</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="trending-up" size={20} color="#F7DC6F" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Sales increased by 15%</Text>
                <Text style={styles.activityTime}>Today</Text>
              </View>
            </View>
          </View>
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
});

export default Dashboard;