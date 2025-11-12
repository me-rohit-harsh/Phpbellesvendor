import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createCoupon } from './couponService';
import { ToastManager } from '../../components/NotificationToast';

const FieldLabel = ({ children }) => (
  <Text style={styles.label}>{children}</Text>
);

const Input = (props) => (
  <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor="#9CA3AF" />
);

const AddCouponScreen = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [usageLimit, setUsageLimit] = useState('');
  const [userUsageLimit, setUserUsageLimit] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const disabled = submitting;

  const validate = () => {
    const e = {};
    if (!code) e.code = 'Required';
    if (!type) e.type = 'Required';
    if (!value) e.value = 'Required';
    if (type === 'percentage') {
      const v = Number(value);
      if (!(v >= 1 && v <= 100)) e.value = '1-100';
      if (!maxDiscount) e.maxDiscount = 'Required';
    }
    if (minOrderAmount && Number.isNaN(Number(minOrderAmount))) e.minOrderAmount = 'Invalid';
    if (usageLimit && Number.isNaN(Number(usageLimit))) e.usageLimit = 'Invalid';
    if (userUsageLimit && Number.isNaN(Number(userUsageLimit))) e.userUsageLimit = 'Invalid';
    if (!validFrom) e.validFrom = 'Required';
    if (!validTo) e.validTo = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      ToastManager.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        code: code.trim(),
        type,
        value: Number(value),
        max_discount: type === 'percentage' ? Number(maxDiscount) : null,
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
        first_order_only: firstOrderOnly,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        user_usage_limit: userUsageLimit ? Number(userUsageLimit) : null,
        valid_from: validFrom,
        valid_to: validTo,
      };
      const resp = await createCoupon(payload);
      const ok = (resp && (resp.success === true || resp?.data?.success === true))
        || (resp && typeof resp.message === 'string' && /success/i.test(resp.message))
        || (resp && (resp.id || resp?.data?.id) && (resp.code || resp?.data?.code));
      if (!ok) {
        throw new Error('Failed to create coupon');
      }
      ToastManager.success('Created');
      router.replace('/vendor/coupons');
    } catch (e) {
      ToastManager.error(e?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#020A66" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Coupon</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Add Coupon</Text>

        <FieldLabel>Code</FieldLabel>
        <Input placeholder="WELCOME25" value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" style={errors.code && styles.inputError} />

        <FieldLabel>Type</FieldLabel>
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === 'percentage' && styles.typeActive]} onPress={() => setType('percentage')}>
            <Text style={[styles.typeText, type === 'percentage' && styles.typeTextActive]}>Percentage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'fixed' && styles.typeActive]} onPress={() => setType('fixed')}>
            <Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>Fixed</Text>
          </TouchableOpacity>
        </View>

        <FieldLabel>Value</FieldLabel>
        <Input placeholder={type === 'percentage' ? '25' : '100'} keyboardType="numeric" value={value} onChangeText={(t) => setValue(t.replace(/[^0-9]/g, ''))} style={errors.value && styles.inputError} />

        {type === 'percentage' && (
          <>
            <FieldLabel>Max Discount</FieldLabel>
            <Input placeholder="200" keyboardType="numeric" value={maxDiscount} onChangeText={(t) => setMaxDiscount(t.replace(/[^0-9]/g, ''))} style={errors.maxDiscount && styles.inputError} />
          </>
        )}

        <FieldLabel>Min Order Amount</FieldLabel>
        <Input placeholder="500" keyboardType="numeric" value={minOrderAmount} onChangeText={(t) => setMinOrderAmount(t.replace(/[^0-9]/g, ''))} style={errors.minOrderAmount && styles.inputError} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>First Order Only</Text>
          <Switch value={firstOrderOnly} onValueChange={setFirstOrderOnly} />
        </View>

        <FieldLabel>Usage Limit</FieldLabel>
        <Input placeholder="100" keyboardType="numeric" value={usageLimit} onChangeText={(t) => setUsageLimit(t.replace(/[^0-9]/g, ''))} style={errors.usageLimit && styles.inputError} />

        <FieldLabel>User Usage Limit</FieldLabel>
        <Input placeholder="1" keyboardType="numeric" value={userUsageLimit} onChangeText={(t) => setUserUsageLimit(t.replace(/[^0-9]/g, ''))} style={errors.userUsageLimit && styles.inputError} />

        <FieldLabel>Valid From (YYYY-MM-DD)</FieldLabel>
        <Input placeholder="2025-01-01" value={validFrom} onChangeText={setValidFrom} style={errors.validFrom && styles.inputError} />

        <FieldLabel>Valid To (YYYY-MM-DD)</FieldLabel>
        <Input placeholder="2025-12-31" value={validTo} onChangeText={setValidTo} style={errors.validTo && styles.inputError} />

        <TouchableOpacity style={[styles.submitBtn, disabled && styles.submitDisabled]} onPress={handleSubmit} disabled={disabled}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>Create Coupon</Text>
            </>
          )}
        </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#020A66',
    marginBottom: 16,
    fontFamily: 'MyFont-Bold',
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'MyFont-Medium',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontFamily: 'MyFont-Regular',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  typeRow: {
    flexDirection: 'row',
  },
  typeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  typeActive: {
    backgroundColor: '#020A66',
    borderColor: '#020A66',
  },
  typeText: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'MyFont-Medium',
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontFamily: 'MyFont-Bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'MyFont-Medium',
  },
  submitBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'MyFont-Bold',
  },
});

export default AddCouponScreen;