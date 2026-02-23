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
    const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
    const bad = (s) => {
      if (!s) return true;
      const v = norm(s).toLowerCase();
      return (
        v === '' ||
        v === '-' ||
        v === '—' ||
        v === 'customer' ||
        v === 'guest' ||
        v === 'user' ||
        v === 'unknown' ||
        v === 'na' ||
        v === 'n/a' ||
        v === 'null' ||
        v === 'undefined'
      );
    };
    const join = (a, b) => {
      const A = a ? norm(a) : '';
      const B = b ? norm(b) : '';
      const t = [A, B].filter((x) => x && x.length).join(' ').trim();
      return t || null;
    };
    const pickFrom = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      const fields = [
        'full_name',
        'fullName',
        'customer_full_name',
        'customerFullName',
        'customer_name',
        'customerName',
        'name',
        'display_name',
        'displayName',
        'contact_name',
        'shipping_name',
        'billing_name',
      ];
      for (let i = 0; i < fields.length; i++) {
        const v = obj[fields[i]];
        if (v && !bad(v)) return norm(v);
      }
      const fns = obj.first_name ?? obj.firstName ?? obj.given_name ?? obj.givenName ?? null;
      const lns = obj.last_name ?? obj.lastName ?? obj.family_name ?? obj.familyName ?? null;
      const both = join(fns, lns);
      if (both && !bad(both)) return both;
      return null;
    };
    const cand =
      pickFrom(order) ||
      pickFrom(order?.user) ||
      pickFrom(order?.customer) ||
      pickFrom(order?.contact) ||
      pickFrom(order?.address) ||
      pickFrom(order?.delivery_address) ||
      pickFrom(order?.shipping_address) ||
      null;
    return cand && !bad(cand) ? cand : '';
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
