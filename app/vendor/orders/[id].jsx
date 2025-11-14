import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getVendorOrder } from '../../../lib/api/vendorOrders';
import OrderActionButtons from '../../components/vendor/OrderActionButtons';
import { ToastManager } from '../../components/NotificationToast';

const OrderDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseOrder = (data) => {
    return data?.data ?? data;
  };

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getVendorOrder(id);
      const ord = parseOrder(res);
      setOrder(ord);
    } catch (e) {
      setError(e?.message || 'Failed to load order');
      ToastManager.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

  const getCustomerName = () => order?.customer_name ?? order?.user?.name ?? order?.customer?.name;
  const getCustomerPhone = () => order?.customer_phone ?? order?.user?.phone ?? order?.customer?.phone;
  const getCustomerAddress = () => order?.address ?? order?.delivery_address ?? order?.shipping_address;
  const getStatus = () => order?.status ?? order?.order_status;
  const getTotal = () => order?.total ?? order?.grand_total ?? order?.amount;
  const getItems = () => order?.items ?? order?.order_items ?? [];
  const getRider = () => order?.rider ?? order?.delivery_partner ?? null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchOrder}>
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
        <Text style={styles.headerTitle}>Order #{String(id)}</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.row}>
            <Ionicons name="person" size={18} color="#6B7280" />
            <Text style={styles.rowText}>{getCustomerName() || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="call" size={18} color="#6B7280" />
            <Text style={styles.rowText}>{getCustomerPhone() || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location" size={18} color="#6B7280" />
            <Text style={styles.rowText}>{getCustomerAddress() || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {getItems().length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No items</Text>
            </View>
          ) : (
            getItems().map((it, idx) => {
              const name = it?.name ?? it?.product_name ?? it?.product?.name;
              const qty = it?.qty ?? it?.quantity ?? it?.count ?? 1;
              const price = it?.price ?? it?.unit_price ?? it?.amount ?? 0;
              const image = it?.image ?? it?.product_image ?? it?.product?.image;
              return (
                <View key={String(it?.id ?? idx)} style={styles.itemRow}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Ionicons name="image-outline" size={18} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{name || 'Item'}</Text>
                    <Text style={styles.itemMeta}>Qty: {qty}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{Number(price || 0).toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>

        {getRider() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rider</Text>
            <View style={styles.row}>
              <Ionicons name="bicycle" size={18} color="#6B7280" />
              <Text style={styles.rowText}>{getRider()?.name || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="call" size={18} color="#6B7280" />
              <Text style={styles.rowText}>{getRider()?.phone || '—'}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{Number(getTotal() || 0).toFixed(2)}</Text>
          </View>
          <OrderActionButtons
            orderId={id}
            status={getStatus()}
            onActionComplete={() => {
              fetchOrder();
            }}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'MyFont-Regular',
    flex: 1,
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Medium',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  itemPrice: {
    fontSize: 14,
    color: '#059669',
    fontFamily: 'MyFont-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  totalValue: {
    fontSize: 18,
    color: '#059669',
    fontFamily: 'MyFont-Bold',
  },
});

export default OrderDetailsScreen;