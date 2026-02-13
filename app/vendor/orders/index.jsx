import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getVendorOrders } from '../../../lib/api/vendorOrders';
import OrderCard from '../../components/vendor/OrderCard';
import { ToastManager } from '../../components/NotificationToast';

const OrdersScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const parseList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getVendorOrders();
      const list = parseList(res);
      setOrders(list);
    } catch (e) {
      setError(e?.message || 'Failed to load orders');
      ToastManager.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

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

  const renderItem = ({ item }) => {
    const id = item?.id ?? item?.order_id ?? item?.uuid;
    const customerName = getCustomerDisplayName(item);
    const total = computeTotal(item);
    const status = item?.status ?? item?.order_status;
    const createdAt = item?.created_at ?? item?.createdAt ?? item?.date;

    return (
      <OrderCard
        id={id}
        customerName={customerName}
        total={total}
        status={status}
        created_at={createdAt}
        onPress={() => router.push(`/vendor/orders/${id}`)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
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
        <Text style={styles.headerTitle}>Vendor Orders</Text>
        <View style={styles.headerActions} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item?.id ?? item?.order_id ?? item?.uuid)}
        renderItem={renderItem}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 60,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'MyFont-Medium',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#020A66',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
  },
});

export default OrdersScreen;
