import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CouponCard from './CouponCard';
import { getCoupons, deleteCoupon } from './couponService';
import { ToastManager } from '../../components/NotificationToast';

const CouponsScreen = () => {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [openGroups, setOpenGroups] = useState({ type: false, status: false, sort: false });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoupons();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data) {
        if (Array.isArray(data.data)) {
          list = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          list = data.data.data;
        } else if (Array.isArray(data.items)) {
          list = data.items;
        } else if (Array.isArray(data.coupons)) {
          list = data.coupons;
        } else if (data.data && Array.isArray(data.data.items)) {
          list = data.data.items;
        } else if (data.data && Array.isArray(data.data.coupons)) {
          list = data.data.coupons;
        } else if (Array.isArray(data.results)) {
          list = data.results;
        }
      }
      setCoupons(list);
    } catch (e) {
      setError(e?.message || 'Failed to load coupons');
      ToastManager.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCoupons();
    }, [fetchCoupons])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  }, [fetchCoupons]);

  const handleDelete = useCallback((id) => {
    Alert.alert('Delete Coupon', 'Are you sure you want to delete this coupon?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCoupon(id);
            ToastManager.success('Deleted');
            fetchCoupons();
          } catch (e) {
            ToastManager.error('Delete failed');
          }
        },
      },
    ]);
  }, [fetchCoupons]);

  const renderItem = ({ item }) => (
    <CouponCard
      code={item?.code}
      type={item?.type}
      value={item?.value}
      valid_from={item?.valid_from}
      valid_to={item?.valid_to}
      is_active={item?.is_active}
      onEdit={() => router.push(`/vendor/coupons/${item?.id}`)}
      onDelete={() => handleDelete(item?.id)}
    />
  );

  const displayed = coupons
    .filter((c) => {
      const matchesQuery = query.trim().length === 0 || String(c?.code || '').toLowerCase().includes(query.trim().toLowerCase());
      const matchesType = typeFilter === 'all' || c?.type === typeFilter;
      const isActive = Boolean(c?.is_active);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
      return matchesQuery && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'expiring') {
        const ad = new Date(a?.valid_to || a?.valid_from || 0).getTime();
        const bd = new Date(b?.valid_to || b?.valid_from || 0).getTime();
        return ad - bd;
      }
      const ad = new Date(a?.valid_from || 0).getTime();
      const bd = new Date(b?.valid_from || 0).getTime();
      return bd - ad;
    });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading coupons...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCoupons}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coupon Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/vendor/coupons/add')}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={displayed}
        keyExtractor={(item) => String(item?.id)}
        renderItem={renderItem}
        contentContainerStyle={coupons.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by code"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <View style={styles.filterGroup}>
                <TouchableOpacity style={styles.filterLabelRow} onPress={() => toggleGroup('type')}>
                  <Text style={styles.filterLabel}>Type</Text>
                  <Ionicons name={openGroups.type ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" style={styles.filterChevron} />
                </TouchableOpacity>
                {openGroups.type && (
                  <View style={styles.filterChipsRow}>
                    <TouchableOpacity
                      style={[styles.filterBtn, typeFilter === 'all' && styles.filterActive]}
                      onPress={() => setTypeFilter('all')}
                    >
                      <Text style={[styles.filterText, typeFilter === 'all' && styles.filterTextActive]}>All Types</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterBtn, typeFilter === 'percentage' && styles.filterActive]}
                      onPress={() => setTypeFilter('percentage')}
                    >
                      <Text style={[styles.filterText, typeFilter === 'percentage' && styles.filterTextActive]}>Percentage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterBtn, typeFilter === 'fixed' && styles.filterActive]}
                      onPress={() => setTypeFilter('fixed')}
                    >
                      <Text style={[styles.filterText, typeFilter === 'fixed' && styles.filterTextActive]}>Fixed</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.filterGroup}>
                <TouchableOpacity style={styles.filterLabelRow} onPress={() => toggleGroup('status')}>
                  <Text style={styles.filterLabel}>Status</Text>
                  <Ionicons name={openGroups.status ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" style={styles.filterChevron} />
                </TouchableOpacity>
                {openGroups.status && (
                  <View style={styles.filterChipsRow}>
                    <TouchableOpacity
                      style={[styles.filterBtn, statusFilter === 'all' && styles.filterActive]}
                      onPress={() => setStatusFilter('all')}
                    >
                      <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>All Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterBtn, statusFilter === 'active' && styles.filterActive]}
                      onPress={() => setStatusFilter('active')}
                    >
                      <Text style={[styles.filterText, statusFilter === 'active' && styles.filterTextActive]}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterBtn, statusFilter === 'inactive' && styles.filterActive]}
                      onPress={() => setStatusFilter('inactive')}
                    >
                      <Text style={[styles.filterText, statusFilter === 'inactive' && styles.filterTextActive]}>Inactive</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.filterGroup}>
                <TouchableOpacity style={styles.filterLabelRow} onPress={() => toggleGroup('sort')}>
                  <Text style={styles.filterLabel}>Sort</Text>
                  <Ionicons name={openGroups.sort ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" style={styles.filterChevron} />
                </TouchableOpacity>
                {openGroups.sort && (
                  <View style={styles.filterChipsRow}>
                    <TouchableOpacity
                      style={[styles.filterBtn, sortBy === 'recent' && styles.filterActive]}
                      onPress={() => setSortBy('recent')}
                    >
                      <Text style={[styles.filterText, sortBy === 'recent' && styles.filterTextActive]}>Recent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterBtn, sortBy === 'expiring' && styles.filterActive]}
                      onPress={() => setSortBy('expiring')}
                    >
                      <Text style={[styles.filterText, sortBy === 'expiring' && styles.filterTextActive]}>Expiring</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="pricetags-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No coupons yet</Text>
            <Text style={styles.emptySubtitle}>Create your first coupon to attract customers</Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => router.push('/vendor/coupons/add')}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyCreateText}>Create Coupon</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 0,
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
    fontWeight: '700',
    color: '#020A66',
    fontFamily: 'MyFont-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#020A66',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
    paddingVertical: 12,
    fontFamily: 'MyFont-Regular',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    fontFamily: 'MyFont-Medium',
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  filterChevron: {
    marginLeft: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterActive: {
    backgroundColor: '#020A66',
    borderColor: '#020A66',
  },
  filterText: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'MyFont-Medium',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontFamily: 'MyFont-Bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  errorText: {
    fontSize: 14,
    color: '#D93025',
    marginBottom: 12,
    fontFamily: 'MyFont-Medium',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#020A66',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'MyFont-Bold',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    fontFamily: 'MyFont-Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    fontFamily: 'MyFont-Regular',
  },
  emptyCreateBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptyCreateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'MyFont-Bold',
  },
});

export default CouponsScreen;