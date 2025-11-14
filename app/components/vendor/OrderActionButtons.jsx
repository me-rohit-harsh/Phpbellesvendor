import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { acceptVendorOrder, rejectVendorOrder, readyForPickup } from '../../../lib/api/vendorOrders';
import { ToastManager } from '../../components/NotificationToast';

const PrimaryButton = ({ title, onPress, disabled, icon }) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.disabledButton]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={styles.btnIcon} />}
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

const DangerButton = ({ title, onPress, disabled, icon }) => (
  <TouchableOpacity
    style={[styles.dangerButton, disabled && styles.disabledButton]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={styles.btnIcon} />}
    <Text style={styles.dangerButtonText}>{title}</Text>
  </TouchableOpacity>
);

const OrderActionButtons = ({ orderId, status, onActionComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await acceptVendorOrder(orderId);
      ToastManager.success('Order accepted');
      onActionComplete && onActionComplete();
    } catch (e) {
      ToastManager.error(e?.message || 'Failed to accept order');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await rejectVendorOrder(orderId, 'Rejected by vendor');
      ToastManager.success('Order rejected');
      onActionComplete && onActionComplete();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to reject order';
      ToastManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReady = async () => {
    try {
      setLoading(true);
      await readyForPickup(orderId);
      ToastManager.success('Marked ready for pickup');
      onActionComplete && onActionComplete();
    } catch (e) {
      ToastManager.error(e?.message || 'Failed to mark ready');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#020A66" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {status === 'pending' && (
        <View style={styles.row}>
          <PrimaryButton title="Accept" onPress={handleAccept} disabled={loading} icon="checkmark" />
          <DangerButton title="Reject" onPress={handleReject} disabled={loading} icon="close" />
        </View>
      )}

      {(['accepted_by_vendor', 'running', 'accepted', 'in_progress', 'processing'].includes(status)) && (
        <View style={styles.row}>
          <PrimaryButton title="Ready for Pickup" onPress={handleReady} disabled={loading} icon="bag-check" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#020A66',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
  },
  disabledButton: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
});

export default OrderActionButtons;