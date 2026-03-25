import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVendorOrder } from '../../../lib/api/vendorOrders';
import OrderActionButtons from '../../components/vendor/OrderActionButtons';
import { ToastManager } from '../../components/NotificationToast';
import { getAPIConfig } from '../../../lib/api/api';
import { useSafePress } from '../../../lib/utils/clickSafety';

const OrderDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const { baseURL } = getAPIConfig();
  const API_MEDIA_ROOT = (baseURL || '').replace(/\/$/, '').replace(/\/api$/, '');

  const formatAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'string') return addr.trim();
    const flat = (arr) =>
      arr.reduce((acc, v) => acc.concat(Array.isArray(v) ? flat(v) : [v]), []);
    const fromComponents = (components) => {
      if (!Array.isArray(components)) return null;
      const tokens = [];
      components.forEach((c) => {
        if (!c) return;
        if (typeof c === 'string' || typeof c === 'number') {
          const s = String(c).trim();
          if (s) tokens.push(s);
          return;
        }
        const v =
          c.long_name ??
          c.short_name ??
          c.name ??
          c.value ??
          c.label ??
          c.text ??
          c.title ??
          null;
        if (v && String(v).trim()) tokens.push(String(v).trim());
      });
      const out = Array.from(new Set(tokens)).filter((t) => t && t.length);
      return out.length ? out.join(', ') : null;
    };
    const pickFromObject = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj.formatted_address === 'string' && obj.formatted_address.trim()) {
        return obj.formatted_address.trim();
      }
      if (typeof obj.formattedAddress === 'string' && obj.formattedAddress.trim()) {
        return obj.formattedAddress.trim();
      }
      const comp =
        obj.address_components ??
        obj.components ??
        obj.addressParts ??
        obj.parts ??
        null;
      const compText = fromComponents(comp);
      if (compText) return compText;
      const parts = [
        obj.full_address ?? obj.fullAddress,
        obj.address ?? obj.address1 ?? obj.line1 ?? obj.street ?? obj.road,
        obj.address2 ?? obj.line2,
        obj.house ?? obj.house_no ?? obj.houseNo ?? obj.building ?? obj.apartment ?? obj.flat,
        obj.block,
        obj.landmark,
        obj.area ?? obj.locality ?? obj.neighborhood ?? obj.sublocality,
        obj.district ?? obj.town,
        obj.city ?? obj.municipality,
        obj.state ?? obj.region ?? obj.state_name,
        obj.pincode ?? obj.postal_code ?? obj.postalCode ?? obj.zip ?? obj.zipcode,
        obj.country,
      ];
      const text = parts
        .map((p) => (p !== undefined && p !== null ? String(p).trim() : ''))
        .filter((p) => p.length)
        .join(', ');
      if (text && text.trim().length) return text;
      if (obj.latitude && obj.longitude) {
        return `${obj.latitude}, ${obj.longitude}`;
      }
      if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
        return `${obj.coordinates[0]}, ${obj.coordinates[1]}`;
      }
      const values = Object.values(obj)
        .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
        .filter((v) => v.length);
      if (values.length) return Array.from(new Set(values)).slice(0, 6).join(', ');
      return null;
    };
    if (Array.isArray(addr)) {
      const items = flat(addr).map((el) => {
        if (typeof el === 'string' || typeof el === 'number') return String(el).trim();
        if (el && typeof el === 'object') return pickFromObject(el);
        return null;
      });
      const out = items.filter((p) => p && String(p).trim().length);
      if (out.length) return Array.from(new Set(out)).join(', ');
      return null;
    }
    if (typeof addr === 'object') {
      return pickFromObject(addr) ?? null;
    }
    return String(addr);
  };

  const computeTotal = (o) => {
    const candidates = [o?.total, o?.grand_total, o?.amount, o?.price];
    const firstValid = candidates.find((v) => v !== null && v !== undefined && Number(v) > 0);
    if (firstValid !== undefined) return Number(firstValid);
    const items = o?.items ?? o?.order_items ?? [];
    if (Array.isArray(items) && items.length > 0) {
      const sum = items.reduce((acc, it) => {
        const qty = Number(it?.qty ?? it?.quantity ?? it?.count ?? 1);
        const unit = Number(it?.price ?? it?.unit_price ?? it?.amount ?? it?.total ?? 0);
        return acc + (Number.isFinite(qty) && Number.isFinite(unit) ? qty * unit : 0);
      }, 0);
      if (sum > 0) return sum;
    }
    const fees = Number(o?.delivery_fee ?? o?.shipping_fee ?? 0);
    const taxes = Number(o?.tax ?? o?.taxes ?? 0);
    const subtotal = Number(o?.subtotal ?? 0);
    return subtotal + fees + taxes;
  };

  const getCustomerName = () => {
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
    const tryAll = () => {
      const cand =
        pickFrom(order) ||
        pickFrom(order?.user) ||
        pickFrom(order?.customer) ||
        pickFrom(order?.contact) ||
        pickFrom(order?.address) ||
        pickFrom(order?.delivery_address) ||
        pickFrom(order?.shipping_address) ||
        null;
      if (cand && !bad(cand)) return cand;
      return '';
    };
    return tryAll();
  };
  const getCustomerPhone = () => order?.customer_phone ?? order?.user?.phone ?? order?.customer?.phone;
  const getCustomerAddress = () =>
    formatAddress(
      order?.address ??
        order?.delivery_address ??
        order?.shipping_address ??
        order?.customer?.address ??
        order?.user?.address ??
        order?.location ??
        order?.coordinates
    );
  const getStatus = () => order?.status ?? order?.order_status;
  const getTotal = () => computeTotal(order);
  const getItems = () => {
    const pick = (src) => {
      if (!src) return null;
      if (Array.isArray(src)) return src;
      if (typeof src === 'object') {
        if (Array.isArray(src.data)) return src.data;
        if (Array.isArray(src.items)) return src.items;
        const vals = Object.values(src);
        return Array.isArray(vals) && vals.length ? vals : null;
      }
      return null;
    };
    const candidates = [
      order?.items,
      order?.order_items,
      order?.orderItems,
      order?.products,
      order?.line_items,
      order?.lines,
      order?.ordered_items,
      order?.order_details,
      order?.details,
      order?.order?.items,
      order?.order?.order_items,
      order?.order?.details,
      order?.cart?.items,
      order?.data?.items,
      order?.order_data?.items,
      order?.orderData?.items,
      order?.cart_items,
      order?.menu_items,
      order?.food_items,
    ];
    for (let i = 0; i < candidates.length; i++) {
      const arr = pick(candidates[i]);
      if (arr && arr.length) return arr;
    }
    return [];
  };
  const getRider = () => order?.rider ?? order?.delivery_partner ?? null;

  const normalizeUrl = (url) => {
    if (!url) return null;
    const s = String(url).trim();
    if (!s) return null;
    if (/^(https?:|data:|file:|content:)/i.test(s)) return s;
    if (s.startsWith('//')) return `https:${s}`;
    const root = API_MEDIA_ROOT || '';
    const path = s.replace(/^\/+/, '');
    return root ? `${root}/${path}` : s;
  };

  const resolveImageFrom = (src) => {
    if (!src) return null;
    if (typeof src === 'string') return normalizeUrl(src);
    if (Array.isArray(src)) {
      for (let i = 0; i < src.length; i++) {
        const u = resolveImageFrom(src[i]);
        if (u) return u;
      }
      return null;
    }
    if (typeof src === 'object') {
      const fields = [
        'asset_url',
        'image_url',
        'image',
        'photo',
        'picture',
        'thumbnail',
        'thumb',
        'product_image',
        'product_image_url',
        'featured_image',
        'featuredImage',
        'image_path',
        'imagePath',
        'imageURL',
        'imageUri',
        'url',
        'uri',
        'src',
      ];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (src[f]) {
          const u = resolveImageFrom(src[f]);
          if (u) return u;
        }
      }
      if (Array.isArray(src.images) && src.images.length) {
        const u = resolveImageFrom(src.images[0]);
        if (u) return u;
      }
      if (Array.isArray(src.media) && src.media.length) {
        const u = resolveImageFrom(src.media[0]);
        if (u) return u;
      }
      if (src.path) {
        const u = resolveImageFrom(src.path);
        if (u) return u;
      }
      return null;
    }
    return null;
  };

  const getItemImage = (it) => {
    const img =
      resolveImageFrom(it) ||
      resolveImageFrom(it?.product) ||
      resolveImageFrom(it?.variant) ||
      resolveImageFrom(it?.menu_item) ||
      resolveImageFrom(it?.menuItem) ||
      resolveImageFrom(it?.food_item) ||
      resolveImageFrom(it?.food) ||
      resolveImageFrom(it?.item) ||
      null;
    return img;
  };

  const cleanText = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).replace(/\s+/g, ' ').trim();
    return s.length ? s : null;
  };

  const resolveNameFrom = (src) => {
    if (!src) return null;
    if (typeof src === 'string' || typeof src === 'number') return cleanText(src);
    if (Array.isArray(src)) {
      for (let i = 0; i < src.length; i++) {
        const n = resolveNameFrom(src[i]);
        if (n) return n;
      }
      return null;
    }
    if (typeof src === 'object') {
      const fields = [
        'name',
        'product_name',
        'food_name',
        'menu_item_name',
        'title',
        'product_title',
        'item_name',
        'itemTitle',
        'productTitle',
        'productName',
        'item',
        'foodItemName',
        'menuItemName',
        'label',
        'text',
        'displayName',
      ];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (src[f]) {
          const n = resolveNameFrom(src[f]);
          if (n) return n;
        }
      }
      return null;
    }
    return null;
  };

  const getItemName = (it) => {
    const n =
      resolveNameFrom(it) ||
      resolveNameFrom(it?.product) ||
      resolveNameFrom(it?.variant) ||
      resolveNameFrom(it?.menu_item) ||
      resolveNameFrom(it?.menuItem) ||
      resolveNameFrom(it?.food_item) ||
      resolveNameFrom(it?.food) ||
      resolveNameFrom(it?.item) ||
      null;
    return n || 'Item';
  };

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
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
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
          {/* <View style={styles.row}>
            <Ionicons name="location" size={18} color="#6B7280" />
            <Text style={styles.rowText}>{getCustomerAddress() || '—'}</Text>
          </View> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {getItems().length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No items</Text>
            </View>
          ) : (
            getItems().map((it, idx) => {
              const name = getItemName(it);
              const qty = it?.qty ?? it?.quantity ?? it?.count ?? it?.pivot?.quantity ?? 1;
              const price =
                it?.price ??
                it?.unit_price ??
                it?.unitPrice ??
                it?.amount ??
                it?.item_price ??
                it?.line_total ??
                it?.total ??
                0;
              const image = getItemImage(it);
              return (
                <View key={String(it?.id ?? idx)} style={styles.itemRow}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Ionicons name="image-outline" size={18} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                      {name || 'Item'}
                    </Text>
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
