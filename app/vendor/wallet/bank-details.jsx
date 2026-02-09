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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBankDetails, updateBankDetails } from '../../../lib/api/vendorWallet';
import { ToastManager } from '../../components/NotificationToast';

const BankDetailsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
  });

  const [errors, setErrors] = useState({});

  const fetchBankDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBankDetails();

      if (res?.success && res?.data) {
        setFormData(res.data);
      }
    } catch (e) {
      ToastManager.error('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBankDetails();
    }, [fetchBankDetails])
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account_holder_name.trim()) {
      newErrors.account_holder_name = 'Account holder name is required';
    }

    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    } else if (formData.account_number.length < 9 || formData.account_number.length > 18) {
      newErrors.account_number = 'Account number must be between 9 and 18 digits';
    }

    if (!formData.ifsc_code.trim()) {
      newErrors.ifsc_code = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code)) {
      newErrors.ifsc_code = 'Invalid IFSC code format';
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.branch_name.trim()) {
      newErrors.branch_name = 'Branch name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await updateBankDetails(formData);

      if (res?.success) {
        ToastManager.success('Bank details updated successfully');
        setIsEditing(false);
      } else {
        ToastManager.error(res?.message || 'Failed to update bank details');
      }
    } catch (e) {
      ToastManager.error('Failed to update bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Ionicons name={isEditing ? 'close' : 'pencil'} size={20} color="#020A66" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.infoHeader}>
              <Ionicons name="card" size={32} color="#020A66" />
              <Text style={styles.infoTitle}>Bank Account Information</Text>
            </View>

            {/* Account Holder Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={[styles.input, errors.account_holder_name && styles.inputError]}
                placeholder="Enter account holder name"
                value={formData.account_holder_name}
                onChangeText={(value) => handleInputChange('account_holder_name', value)}
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
              {errors.account_holder_name && (
                <Text style={styles.errorText}>{errors.account_holder_name}</Text>
              )}
            </View>

            {/* Account Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={[styles.input, errors.account_number && styles.inputError]}
                placeholder="Enter account number"
                value={formData.account_number}
                onChangeText={(value) => handleInputChange('account_number', value)}
                editable={isEditing}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              {errors.account_number && (
                <Text style={styles.errorText}>{errors.account_number}</Text>
              )}
            </View>

            {/* IFSC Code */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={[styles.input, errors.ifsc_code && styles.inputError]}
                placeholder="e.g., SBIN0001234"
                value={formData.ifsc_code}
                onChangeText={(value) => handleInputChange('ifsc_code', value.toUpperCase())}
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
              {errors.ifsc_code && (
                <Text style={styles.errorText}>{errors.ifsc_code}</Text>
              )}
            </View>

            {/* Bank Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bank Name *</Text>
              <TextInput
                style={[styles.input, errors.bank_name && styles.inputError]}
                placeholder="Enter bank name"
                value={formData.bank_name}
                onChangeText={(value) => handleInputChange('bank_name', value)}
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
              {errors.bank_name && (
                <Text style={styles.errorText}>{errors.bank_name}</Text>
              )}
            </View>

            {/* Branch Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Branch Name *</Text>
              <TextInput
                style={[styles.input, errors.branch_name && styles.inputError]}
                placeholder="Enter branch name"
                value={formData.branch_name}
                onChangeText={(value) => handleInputChange('branch_name', value)}
                editable={isEditing}
                placeholderTextColor="#9CA3AF"
              />
              {errors.branch_name && (
                <Text style={styles.errorText}>{errors.branch_name}</Text>
              )}
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Bank Details</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#17A2B8" />
              <Text style={styles.infoText}>
                Your bank details are encrypted and securely stored. They are only used for
                processing payouts.
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
  editButton: {
    padding: 8,
    width: 50,
    alignItems: 'flex-end',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginLeft: 12,
  },
  formGroup: {
    marginBottom: 20,
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
    backgroundColor: '#FFFFFF',
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
  submitButton: {
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
  },
  infoCard: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#17A2B8',
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

export default BankDetailsScreen;
