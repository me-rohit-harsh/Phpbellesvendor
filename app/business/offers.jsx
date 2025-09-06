import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Switch,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const OffersManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  // Form states
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [offerCode, setOfferCode] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const [offers, setOffers] = useState([
    {
      id: 1,
      title: 'Welcome Offer',
      description: 'Get 20% off on your first order',
      code: 'WELCOME20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 25,
      maxDiscount: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
      usageLimit: 100,
      usedCount: 45,
      status: 'active'
    },
    {
      id: 2,
      title: 'Weekend Special',
      description: '₹5 off on orders above ₹30',
      code: 'WEEKEND5',
      discountType: 'fixed',
      discountValue: 5,
      minOrderValue: 30,
      maxDiscount: 5,
      startDate: '2024-01-13',
      endDate: '2024-01-14',
      isActive: false,
      usageLimit: 50,
      usedCount: 32,
      status: 'expired'
    },
    {
      id: 3,
      title: 'Lunch Deal',
      description: '15% off on lunch orders',
      code: 'LUNCH15',
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 20,
      maxDiscount: 8,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      isActive: true,
      usageLimit: 200,
      usedCount: 78,
      status: 'active'
    },
    {
      id: 4,
      title: 'Free Delivery',
      description: 'Free delivery on all orders',
      code: 'FREEDEL',
      discountType: 'fixed',
      discountValue: 3.99,
      minOrderValue: 15,
      maxDiscount: 3.99,
      startDate: '2024-01-10',
      endDate: '2024-01-20',
      isActive: false,
      usageLimit: 75,
      usedCount: 75,
      status: 'completed'
    }
  ]);

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setOfferTitle('');
    setOfferDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setMaxDiscount('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setOfferCode('');
    setUsageLimit('');
  };

  const generateOfferCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOfferCode(result);
  };

  const showValidationError = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessMessage = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setAlertConfig({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', onPress: () => setShowAlert(false) },
        { text: 'Delete', onPress: () => { setShowAlert(false); onConfirm(); } }
      ]
    });
    setShowAlert(true);
  };

  const handleCreateOffer = () => {
    if (!offerTitle || !offerDescription || !discountValue || !minOrderValue || !startDate || !endDate || !offerCode) {
      showValidationError('Error', 'Please fill in all required fields');
      return;
    }

    const parsedDiscountValue = parseFloat(discountValue);
    const parsedMinOrderValue = parseFloat(minOrderValue);
    const parsedMaxDiscount = parseFloat(maxDiscount);
    const parsedUsageLimit = parseInt(usageLimit);

    if (isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
      showValidationError('Error', 'Please enter a valid discount value');
      return;
    }

    if (isNaN(parsedMinOrderValue) || parsedMinOrderValue < 0) {
      showValidationError('Error', 'Please enter a valid minimum order value');
      return;
    }

    if (discountType === 'percentage' && (parsedDiscountValue > 100 || parsedDiscountValue < 0)) {
      showValidationError('Error', 'Percentage discount must be between 0 and 100');
      return;
    }

    const newOffer = {
      id: Math.max(...offers.map(o => o.id), 0) + 1,
      title: offerTitle,
      description: offerDescription,
      code: offerCode,
      discountType,
      discountValue: parsedDiscountValue,
      minOrderValue: parsedMinOrderValue,
      maxDiscount: discountType === 'percentage' ? (parsedMaxDiscount || parsedDiscountValue) : parsedDiscountValue,
      startDate,
      endDate,
      isActive,
      usageLimit: parsedUsageLimit || 0,
      usedCount: 0,
      status: isActive ? 'active' : 'inactive'
    };

    setOffers(prevOffers => [...prevOffers, newOffer]);
    setShowCreateModal(false);
    resetForm();
    showSuccessMessage('Success', 'Offer created successfully!');
  };

  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    setOfferTitle(offer.title);
    setOfferDescription(offer.description);
    setDiscountType(offer.discountType);
    setDiscountValue(offer.discountValue.toString());
    setMinOrderValue(offer.minOrderValue.toString());
    setMaxDiscount(offer.maxDiscount.toString());
    setStartDate(offer.startDate);
    setEndDate(offer.endDate);
    setIsActive(offer.isActive);
    setOfferCode(offer.code);
    setUsageLimit(offer.usageLimit.toString());
    setShowEditModal(true);
  };

  const handleUpdateOffer = () => {
    if (!offerTitle || !offerDescription || !discountValue || !minOrderValue || !startDate || !endDate || !offerCode) {
      showValidationError('Error', 'Please fill in all required fields');
      return;
    }

    setOffers(prevOffers =>
      prevOffers.map(offer => {
        if (offer.id === selectedOffer.id) {
          return {
            ...offer,
            title: offerTitle,
            description: offerDescription,
            code: offerCode,
            discountType,
            discountValue: parseFloat(discountValue),
            minOrderValue: parseFloat(minOrderValue),
            maxDiscount: discountType === 'percentage' ? parseFloat(maxDiscount) : parseFloat(discountValue),
            startDate,
            endDate,
            isActive,
            usageLimit: parseInt(usageLimit) || 0,
            status: isActive ? 'active' : 'inactive'
          };
        }
        return offer;
      })
    );

    setShowEditModal(false);
    resetForm();
    showSuccessMessage('Success', 'Offer updated successfully!');
  };

  const handleDeleteOffer = (offerId) => {
    showConfirmDialog(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      () => {
        setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
        showSuccessMessage('Success', 'Offer deleted successfully!');
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'expired': return '#EF4444';
      case 'completed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'expired': return 'Expired';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const OfferCard = ({ offer }) => (
    <View style={styles.offerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.offerInfo}>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          <Text style={styles.offerCode}>Code: {offer.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status) }]}>
          <Text style={styles.statusText}>{getStatusText(offer.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.offerDescription}>{offer.description}</Text>
      
      <View style={styles.offerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Discount:</Text>
          <Text style={styles.detailValue}>
            {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Min Order:</Text>
          <Text style={styles.detailValue}>₹{offer.minOrderValue}</Text>
        </View>
        
        {offer.discountType === 'percentage' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Max Discount:</Text>
            <Text style={styles.detailValue}>₹{offer.maxDiscount}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valid Period:</Text>
          <Text style={styles.detailValue}>{offer.startDate} to {offer.endDate}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Usage:</Text>
          <Text style={styles.detailValue}>
            {offer.usedCount}/{offer.usageLimit || '∞'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditOffer(offer)}
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteOffer(offer.id)}
        >
          <Ionicons name="trash-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const OfferForm = ({ isEdit = false }) => (
    <View style={styles.modalBody}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Offer Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter offer title"
            placeholderTextColor="#9CA3AF"
            value={offerTitle}
            onChangeText={setOfferTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter offer description"
            placeholderTextColor="#9CA3AF"
            value={offerDescription}
            onChangeText={setOfferDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Offer Code *</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="Enter or generate code"
              placeholderTextColor="#9CA3AF"
              value={offerCode}
              onChangeText={setOfferCode}
            />
            <TouchableOpacity style={styles.generateButton} onPress={generateOfferCode}>
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.discountTypeContainer}>
          <Text style={styles.inputLabel}>Discount Type *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, discountType === 'percentage' && styles.typeButtonActive]}
              onPress={() => setDiscountType('percentage')}
            >
              <Text style={[styles.typeButtonText, discountType === 'percentage' && styles.typeButtonTextActive]}>
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, discountType === 'fixed' && styles.typeButtonActive]}
              onPress={() => setDiscountType('fixed')}
            >
              <Text style={[styles.typeButtonText, discountType === 'fixed' && styles.typeButtonTextActive]}>
                Fixed Amount
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>
              {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *
            </Text>
            <TextInput
              style={styles.input}
              placeholder={discountType === 'percentage' ? '20' : '5.00'}
              placeholderTextColor="#9CA3AF"
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Min Order Value (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="25.00"
              placeholderTextColor="#9CA3AF"
              value={minOrderValue}
              onChangeText={setMinOrderValue}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {discountType === 'percentage' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Discount Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="10.00"
              placeholderTextColor="#9CA3AF"
              value={maxDiscount}
              onChangeText={setMaxDiscount}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Start Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>End Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Usage Limit</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave empty for unlimited"
            placeholderTextColor="#9CA3AF"
            value={usageLimit}
            onChangeText={setUsageLimit}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#D1D5DB', true: '#020A66' }}
            thumbColor={isActive ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={isEdit ? handleUpdateOffer : handleCreateOffer}
        >
          <Text style={styles.saveButtonText}>
            {isEdit ? 'Update Offer' : 'Create Offer'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Promotions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#020A66" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search offers..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {offers.filter(offer => offer.status === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {offers.filter(offer => offer.status === 'expired').length}
          </Text>
          <Text style={styles.summaryLabel}>Expired</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
            {offers.filter(offer => offer.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Offers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </ScrollView>

      {/* Create Offer Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Offer</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <OfferForm />
          </View>
        </View>
      </Modal>

      {/* Edit Offer Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Offer</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <OfferForm isEdit={true} />
          </View>
        </View>
      </Modal>
      
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
    paddingVertical: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'MyFont-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  offerCode: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#FFFFFF',
  },
  offerDescription: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  offerDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    marginTop: -50,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    marginRight: 8,
  },
  generateButton: {
    backgroundColor: '#020A66',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#FFFFFF',
  },
  discountTypeContainer: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#020A66',
    borderColor: '#020A66',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
});

export default OffersManagement;