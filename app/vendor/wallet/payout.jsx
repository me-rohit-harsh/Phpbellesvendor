import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getWalletBalance,
  getBankDetails,
  requestPayout,
  getPayoutHistory,
} from '../../../lib/api/vendorWallet';
import { ToastManager } from '../../components/NotificationToast';

const PayoutScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [balance, setBalance] = useState(0);
  const [bankAccount, setBankAccount] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [balanceRes, bankRes, payoutRes] = await Promise.all([
        getWalletBalance(),
        getBankDetails(),
        getPayoutHistory(1, 10),
      ]);

      if (balanceRes?.success && balanceRes?.data) {
        setBalance(balanceRes.data.balance || 0);
      }

      if (bankRes?.success && bankRes?.data) {
        setBankAccount(bankRes.data);
      }

      if (payoutRes?.success && payoutRes?.data) {
        setPayoutHistory(payoutRes.data);
      }
    } catch (e) {
      ToastManager.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const validateForm = () => {
    const newErrors = {};

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (amountNum > balance) {
        newErrors.amount = `Amount cannot exceed wallet balance (₹${Math.round(balance)})`;
      }
    }

    if (!bankAccount) {
      newErrors.bank = 'Bank details are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestPayout = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const amountNum = parseFloat(amount);
      const res = await requestPayout(amountNum);

      if (res?.success) {
        ToastManager.success('Payout request submitted successfully');
        setAmount('');
        await fetchData();
      } else {
        ToastManager.error(res?.message || 'Failed to request payout');
      }
    } catch (e) {
      ToastManager.error('Failed to request payout');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'approved':
        return '#17A2B8';
      case 'processed':
        return '#28A745';
      case 'rejected':
        return '#DC3545';
      default:
        return '#6B7280';
    }
  };

  const renderPayoutItem = ({ item }) => (
    <View style={styles.payoutItem}>
      <View style={styles.payoutInfo}>
        <Text style={styles.payoutAmount}>₹{Math.round(item.amount)}</Text>
        <Text style={styles.payoutStatus}>
          <Text
            style={[
              styles.statusBadge,
              { color: getStatusColor(item.status), borderColor: getStatusColor(item.status) },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </Text>
      </View>

      <View style={styles.payoutMeta}>
        <Text style={styles.payoutDate}>
          {new Date(item.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading payout details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Payout</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
          </View>

          {/* Payout Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Request Payout</Text>

            {bankAccount ? (
              <View style={styles.bankInfo}>
                <View style={styles.bankIcon}>
                  <Ionicons name="card" size={24} color="#020A66" />
                </View>
                <View style={styles.bankDetails}>
                  <Text style={styles.bankName}>{bankAccount.bank_name}</Text>
                  <Text style={styles.accountNumber}>****{bankAccount.account_number.slice(-4)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/vendor/wallet/bank-details')}
                >
                  <Ionicons name="pencil" size={20} color="#020A66" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.setupBankButton}
                onPress={() => router.push('/vendor/wallet/bank-details')}
              >
                <Ionicons name="add-circle" size={20} color="#020A66" />
                <Text style={styles.setupBankText}>Setup Bank Details First</Text>
              </TouchableOpacity>
            )}

            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payout Amount (₹) *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                placeholder="Enter amount"
                value={amount}
                onChangeText={(value) => {
                  setAmount(value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }
                }}
                keyboardType="decimal-pad"
                editable={!!bankAccount && !submitting}
                placeholderTextColor="#9CA3AF"
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountButtons}>
              <Text style={styles.quickAmountLabel}>Quick Select</Text>
              <View style={styles.buttonRow}>
                {[100, 500, 1000, 5000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickButton,
                      amount === String(value) && styles.quickButtonActive,
                      value > balance && styles.quickButtonDisabled,
                    ]}
                    onPress={() => value <= balance && setAmount(String(value))}
                    disabled={value > balance || !bankAccount}
                  >
                    <Text
                      style={[
                        styles.quickButtonText,
                        amount === String(value) && styles.quickButtonTextActive,
                      ]}
                    >
                      ₹{value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!bankAccount || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleRequestPayout}
              disabled={!bankAccount || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Request Payout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Recent Payouts */}
          {payoutHistory.length > 0 && (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Recent Payout Requests</Text>
              <FlatList
                data={payoutHistory}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderPayoutItem}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No payout requests yet</Text>
                }
              />
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#17A2B8" />
              <Text style={styles.infoText}>
                Payouts are processed to your bank account within 2-3 business days. Minimum
                payout amount is ₹100.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 50,
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
    backgroundColor: '#020A66',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'MyFont-Regular',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'MyFont-Bold',
  },
  formCard: {
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
  formTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 16,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  bankIcon: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
  },
  accountNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginTop: 2,
  },
  setupBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  setupBankText: {
    fontSize: 14,
    color: '#020A66',
    fontFamily: 'MyFont-Medium',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Regular',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    fontFamily: 'MyFont-Regular',
    marginTop: 4,
  },
  quickAmountButtons: {
    marginBottom: 20,
  },
  quickAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Medium',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickButtonActive: {
    borderColor: '#020A66',
    backgroundColor: '#020A66',
  },
  quickButtonDisabled: {
    opacity: 0.5,
  },
  quickButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Bold',
  },
  quickButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 12,
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 4,
  },
  payoutStatus: {
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    fontSize: 10,
    fontFamily: 'MyFont-Bold',
  },
  payoutMeta: {
    alignItems: 'flex-end',
  },
  payoutDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
    textAlign: 'center',
    paddingVertical: 12,
  },
  infoCard: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#17A2B8',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0C5460',
    fontFamily: 'MyFont-Regular',
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default PayoutScreen;
