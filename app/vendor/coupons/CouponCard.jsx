import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatAmount = (type, value) => {
  if (type === 'percentage') return `${value}% OFF`;
  return `₹${Number(value || 0).toFixed(0)} OFF`;
};

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString();
};

const CouponCard = ({ code, type, value, valid_from, valid_to, is_active, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.code}>{code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: is_active ? '#E6F9EE' : '#FFECEC' }]}>
          <Text style={[styles.statusText, { color: is_active ? '#0F9D58' : '#D93025' }]}>
            {is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{formatAmount(type, value)}</Text>
      <Text style={styles.validity}>Valid {formatDate(valid_from)} → {formatDate(valid_to)}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#1F2937" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#D93025" />
          <Text style={[styles.actionText, { color: '#D93025' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 18,
    fontWeight: '700',
    color: '#020A66',
    fontFamily: 'MyFont-Bold',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'MyFont-Medium',
  },
  validity: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'MyFont-Medium',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  deleteBtn: {
    backgroundColor: '#FFF5F5',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'MyFont-Medium',
  },
});

export default CouponCard;