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
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const StockManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  // Helper functions for alerts
  const showErrorAlert = (message) => {
    setAlertConfig({
      title: 'Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessAlert = (message) => {
    setAlertConfig({
      title: 'Success',
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      name: 'Butter Chicken',
      category: 'Main Course',
      currentStock: 25,
      minStock: 10,
      unit: 'portions',
      lastUpdated: '2024-01-15',
      status: 'in_stock'
    },
    {
      id: 2,
      name: 'Paneer Tikka',
      category: 'Appetizer',
      currentStock: 5,
      minStock: 8,
      unit: 'portions',
      lastUpdated: '2024-01-14',
      status: 'low_stock'
    },
    {
      id: 3,
      name: 'Biryani',
      category: 'Main Course',
      currentStock: 0,
      minStock: 5,
      unit: 'portions',
      lastUpdated: '2024-01-13',
      status: 'out_of_stock'
    },
    {
      id: 4,
      name: 'Naan Bread',
      category: 'Bread',
      currentStock: 50,
      minStock: 20,
      unit: 'pieces',
      lastUpdated: '2024-01-15',
      status: 'in_stock'
    },
    {
      id: 5,
      name: 'Gulab Jamun',
      category: 'Dessert',
      currentStock: 12,
      minStock: 15,
      unit: 'pieces',
      lastUpdated: '2024-01-14',
      status: 'low_stock'
    }
  ]);

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return '#10B981';
      case 'low_stock': return '#F59E0B';
      case 'out_of_stock': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  const handleAdjustStock = (item) => {
    if (!item) {
      showErrorAlert('Item not found');
      return;
    }
    setSelectedItem(item);
    setAdjustmentType('add');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = () => {
    if (!adjustmentQuantity || isNaN(adjustmentQuantity) || parseFloat(adjustmentQuantity) <= 0) {
      showErrorAlert('Please enter a valid quantity');
      return;
    }

    if (!adjustmentReason.trim()) {
      showErrorAlert('Please provide a reason for the adjustment');
      return;
    }

    // Here you would typically save to your backend
    console.info('Saving adjustment:', {
      item: selectedItem.id,
      type: adjustmentType,
      quantity: parseFloat(adjustmentQuantity),
      reason: adjustmentReason
    });

    showSuccessAlert('Stock adjustment saved successfully');
    setShowAdjustModal(false);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  };

  const StockCard = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.stockDetails}>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Current Stock:</Text>
          <Text style={[styles.stockValue, { color: getStatusColor(item.status) }]}>
            {item.currentStock} {item.unit}
          </Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Minimum Stock:</Text>
          <Text style={styles.stockValue}>{item.minStock} {item.unit}</Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Last Updated:</Text>
          <Text style={styles.stockValue}>{item.lastUpdated}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.adjustButton}
        onPress={() => handleAdjustStock(item)}
      >
        <Ionicons name="create-outline" size={16} color="white" />
        <Text style={styles.adjustButtonText}>Adjust Stock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stock Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stockItems.filter(item => item.status === 'in_stock').length}</Text>
          <Text style={styles.summaryLabel}>In Stock</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {stockItems.filter(item => item.status === 'low_stock').length}
          </Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {stockItems.filter(item => item.status === 'out_of_stock').length}
          </Text>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Stock Items List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item) => (
          <StockCard key={item.id} item={item} />
        ))}
      </ScrollView>

      {/* Adjust Stock Modal */}
      <Modal
        visible={showAdjustModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.modalBody}>
                <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </Text>

                <View style={styles.adjustmentTypeContainer}>
                  <TouchableOpacity
                    style={[styles.typeButton, adjustmentType === 'add' && styles.typeButtonActive]}
                    onPress={() => setAdjustmentType('add')}
                  >
                    <Text style={[styles.typeButtonText, adjustmentType === 'add' && styles.typeButtonTextActive]}>
                      Add Stock
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, adjustmentType === 'remove' && styles.typeButtonActive]}
                    onPress={() => setAdjustmentType('remove')}
                  >
                    <Text style={[styles.typeButtonText, adjustmentType === 'remove' && styles.typeButtonTextActive]}>
                      Remove Stock
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    placeholderTextColor="#9CA3AF"
                    value={adjustmentQuantity}
                    onChangeText={setAdjustmentQuantity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter reason for adjustment"
                    placeholderTextColor="#9CA3AF"
                    value={adjustmentReason}
                    onChangeText={setAdjustmentReason}
                    multiline
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAdjustment}>
                  <Text style={styles.saveButtonText}>Save Adjustment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
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
  placeholder: {
    width: 40,
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
  stockCard: {
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
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
  },
  stockDetails: {
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  stockValue: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  adjustButtonText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
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
  modalItemName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalCurrentStock: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 20,
  },
  adjustmentTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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

export default StockManagement;