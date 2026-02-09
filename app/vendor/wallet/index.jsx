import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWalletBalance, getEarningsSummary } from '../../../lib/api/vendorWallet';
import { ToastManager } from '../../components/NotificationToast';

const WalletScreen = () => {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [balanceRes, earningsRes] = await Promise.all([
        getWalletBalance(),
        getEarningsSummary(selectedPeriod),
      ]);

      if (balanceRes?.success && balanceRes?.data) {
        setBalance(balanceRes.data.balance || 0);
      }

      if (earningsRes?.success && earningsRes?.data) {
        setEarnings(earningsRes.data);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load wallet data');
      ToastManager.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, [fetchWalletData]);

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & Earnings</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
              </View>
            <Ionicons name="wallet" size={40} color="#020A66" />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.transactionButton]}
              onPress={() => router.push('/vendor/wallet/transactions')}
            >
              <Ionicons name="swap-horizontal" size={20} color="#020A66" />
              <Text style={styles.actionButtonText}>Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.payoutButton]}
              onPress={() => router.push('/vendor/wallet/payout')}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#020A66" />
              <Text style={styles.actionButtonText}>Payout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.bankButton]}
              onPress={() => router.push('/vendor/wallet/bank-details')}
            >
              <Ionicons name="card" size={20} color="#020A66" />
              <Text style={styles.actionButtonText}>Bank Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary */}
        {earnings && (
          <View style={styles.earningsCard}>
            <Text style={styles.cardTitle}>Earnings Summary</Text>

            <View style={styles.earningsRow}>
              <View style={styles.earningsItem}>
                <Ionicons name="cube-outline" size={24} color="#020A66" />
                <Text style={styles.earningsLabel}>Orders</Text>
                <Text style={styles.earningsValue}>{earnings.orders || 0}</Text>
              </View>

              <View style={styles.earningsItem}>
                <Ionicons name="cash-outline" size={24} color="#28A745" />
                <Text style={styles.earningsLabel}>Commission</Text>
                <Text style={[styles.earningsValue, { color: '#28A745' }]}>
                  ₹{(earnings.commission || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.earningsItem}>
                <Ionicons name="gift-outline" size={24} color="#FFC107" />
                <Text style={styles.earningsLabel}>Tips</Text>
                <Text style={[styles.earningsValue, { color: '#FFC107' }]}>
                  ₹{(earnings.tips || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.earningsRow}>
              <View style={styles.earningsItem}>
                <Ionicons name="star-outline" size={24} color="#FF6B6B" />
                <Text style={styles.earningsLabel}>Bonuses</Text>
                <Text style={[styles.earningsValue, { color: '#FF6B6B' }]}>
                  ₹{(earnings.bonuses || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.earningsItem}>
                <Ionicons name="trending-up" size={24} color="#17A2B8" />
                <Text style={styles.earningsLabel}>Total</Text>
                <Text style={[styles.earningsValue, { color: '#17A2B8' }]}>
                  ₹{(earnings.total_earnings || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!earnings && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No earnings data available</Text>
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#020A66',
    fontFamily: 'MyFont-Bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  transactionButton: {
    borderColor: '#020A66',
    backgroundColor: '#F3F4FF',
  },
  payoutButton: {
    borderColor: '#28A745',
    backgroundColor: '#F1F8F4',
  },
  bankButton: {
    borderColor: '#FFC107',
    backgroundColor: '#FFFAF0',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#020A66',
    fontFamily: 'MyFont-Medium',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  periodButtonActive: {
    borderColor: '#020A66',
    backgroundColor: '#020A66',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Medium',
    textAlign: 'center',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginTop: 8,
  },
  earningsValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
    marginTop: 12,
  },
});

export default WalletScreen;
