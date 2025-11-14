import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const statusColors = {
  pending: '#F59E0B',
  accepted_by_vendor: '#3B82F6',
  running: '#8B5CF6',
  ready_for_pickup: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
  rejected: '#EF4444',
};

const OrderCard = ({ id, customerName, total, status, created_at, onPress }) => {
  const badgeColor = statusColors[status] || '#6B7280';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <View style={styles.idRow}>
          <Ionicons name="receipt-outline" size={18} color="#1F2937" />
          <Text style={styles.idText}>#{String(id)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
          <Ionicons name="ellipse" size={10} color={badgeColor} style={styles.statusDot} />
          <Text style={[styles.statusText, { color: badgeColor }]}>{String(status || 'unknown').replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.customerRow}>
          <Ionicons name="person" size={16} color="#6B7280" />
          <Text style={styles.customerText}>{customerName || 'Unknown Customer'}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{Number(total || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
        <Text style={styles.dateText}>{created_at ? new Date(created_at).toLocaleString() : '—'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'MyFont-Medium',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  totalValue: {
    fontSize: 16,
    color: '#059669',
    fontFamily: 'MyFont-Bold',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
  },
});

export default OrderCard;