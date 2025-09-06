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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';

const PricingManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [bulkType, setBulkType] = useState('increase'); // 'increase' or 'decrease'
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Butter Chicken',
      category: 'Main Course',
      currentPrice: 18.99,
      previousPrice: 17.99,
      cost: 12.50,
      margin: 34.2,
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Paneer Tikka',
      category: 'Appetizer',
      currentPrice: 12.99,
      previousPrice: 12.99,
      cost: 8.00,
      margin: 38.4,
      lastUpdated: '2024-01-10',
      status: 'active'
    },
    {
      id: 3,
      name: 'Chicken Biryani',
      category: 'Main Course',
      currentPrice: 22.99,
      previousPrice: 21.99,
      cost: 15.00,
      margin: 34.7,
      lastUpdated: '2024-01-14',
      status: 'active'
    },
    {
      id: 4,
      name: 'Garlic Naan',
      category: 'Bread',
      currentPrice: 4.99,
      previousPrice: 4.49,
      cost: 2.00,
      margin: 59.9,
      lastUpdated: '2024-01-12',
      status: 'active'
    },
    {
      id: 5,
      name: 'Gulab Jamun',
      category: 'Dessert',
      currentPrice: 6.99,
      previousPrice: 6.99,
      cost: 3.50,
      margin: 49.9,
      lastUpdated: '2024-01-08',
      status: 'inactive'
    }
  ]);

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateMargin = (price, cost) => {
    return ((price - cost) / price * 100).toFixed(1);
  };

  const handleEditPrice = (item) => {
    setSelectedItem(item);
    setNewPrice('');
    setPriceChangeReason('');
    setShowEditModal(true);
  };

  const showValidationError = (message) => {
    setAlertConfig({
      title: 'Validation Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessMessage = (message) => {
    setAlertConfig({
      title: 'Success',
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const handleSavePriceChange = () => {
    if (!newPrice || !priceChangeReason) {
      showValidationError('Please fill in all fields');
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      showValidationError('Please enter a valid price');
      return;
    }

    setMenuItems(prevItems =>
      prevItems.map(item => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            previousPrice: item.currentPrice,
            currentPrice: price,
            margin: calculateMargin(price, item.cost),
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      })
    );

    setShowEditModal(false);
    setNewPrice('');
    setPriceChangeReason('');
    setSelectedItem(null);
    showSuccessMessage('Price updated successfully!');
  };

  const handleBulkPriceUpdate = () => {
    if (!bulkPercentage) {
      showValidationError('Please enter a percentage');
      return;
    }

    const percentage = parseFloat(bulkPercentage);
    if (isNaN(percentage) || percentage <= 0) {
      showValidationError('Please enter a valid percentage');
      return;
    }

    setAlertConfig({
      title: 'Confirm Bulk Update',
      message: `Are you sure you want to ${bulkType} all prices by ${percentage}%?`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', onPress: () => setShowAlert(false) },
        {
          text: 'Confirm',
          onPress: () => {
            setMenuItems(prevItems =>
              prevItems.map(item => {
                const multiplier = bulkType === 'increase' 
                  ? (1 + percentage / 100)
                  : (1 - percentage / 100);
                const newPrice = item.currentPrice * multiplier;
                
                return {
                  ...item,
                  previousPrice: item.currentPrice,
                  currentPrice: parseFloat(newPrice.toFixed(2)),
                  margin: calculateMargin(newPrice, item.cost),
                  lastUpdated: new Date().toISOString().split('T')[0]
                };
              })
            );
            setShowBulkModal(false);
            setBulkPercentage('');
            setBulkType('increase');
            setShowAlert(false);
            showSuccessMessage('Bulk price update completed!');
          }
        }
      ]
    });
    setShowAlert(true);
  };

  const PriceCard = ({ item }) => {
    const priceChange = item.currentPrice - item.previousPrice;
    const priceChangePercent = ((priceChange / item.previousPrice) * 100).toFixed(1);
    
    return (
      <View style={styles.priceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280' 
          }]}>
            <Text style={styles.statusText}>
              {item.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <View style={styles.priceDetails}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Current Price:</Text>
            <Text style={styles.currentPrice}>₹{item.currentPrice.toFixed(2)}</Text>
          </View>
          
          {priceChange !== 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Previous Price:</Text>
              <View style={styles.priceChangeContainer}>
                <Text style={styles.previousPrice}>₹{item.previousPrice.toFixed(2)}</Text>
                <Text style={[
                  styles.priceChange,
                  { color: priceChange > 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {priceChange > 0 ? '+' : ''}{priceChangePercent}%
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Cost:</Text>
            <Text style={styles.priceValue}>₹{item.cost.toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Margin:</Text>
            <Text style={[
              styles.marginValue,
              { color: item.margin > 30 ? '#10B981' : item.margin > 15 ? '#F59E0B' : '#EF4444' }
            ]}>
              {item.margin}%
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Last Updated:</Text>
            <Text style={styles.priceValue}>{item.lastUpdated}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditPrice(item)}
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <Text style={styles.editButtonText}>Edit Price</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pricing Management</Text>
        <TouchableOpacity 
          style={styles.bulkButton}
          onPress={() => {
            setBulkPercentage('');
            setBulkType('increase');
            setShowBulkModal(true);
          }}
        >
          <Ionicons name="layers-outline" size={20} color="#020A66" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            ₹{(menuItems.reduce((sum, item) => sum + item.currentPrice, 0) / menuItems.length).toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Avg Price</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {(menuItems.reduce((sum, item) => sum + parseFloat(item.margin), 0) / menuItems.length).toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>Avg Margin</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {menuItems.filter(item => item.status === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active Items</Text>
        </View>
      </View>

      {/* Menu Items List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item) => (
          <PriceCard key={item.id} item={item} />
        ))}
      </ScrollView>

      {/* Edit Price Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditModal(false);
          setNewPrice('');
          setPriceChangeReason('');
          setSelectedItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Price</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setNewPrice('');
                setPriceChangeReason('');
                setSelectedItem(null);
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.modalBody}>
                <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                <Text style={styles.modalCurrentPrice}>
                  Current Price: ₹{selectedItem.currentPrice.toFixed(2)}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new price"
                    placeholderTextColor="#9CA3AF"
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason for Change</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter reason for price change"
                    placeholderTextColor="#9CA3AF"
                    value={priceChangeReason}
                    onChangeText={setPriceChangeReason}
                    multiline
                  />
                </View>

                {newPrice && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Preview:</Text>
                    <Text style={styles.previewText}>
                      New Margin: {calculateMargin(parseFloat(newPrice) || 0, selectedItem.cost)}%
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSavePriceChange}>
                  <Text style={styles.saveButtonText}>Update Price</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        visible={showBulkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBulkModal(false);
          setBulkPercentage('');
          setBulkType('increase');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Price Update</Text>
              <TouchableOpacity onPress={() => {
                setShowBulkModal(false);
                setBulkPercentage('');
                setBulkType('increase');
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.bulkDescription}>
                Update all menu item prices by a percentage
              </Text>

              <View style={styles.bulkTypeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, bulkType === 'increase' && styles.typeButtonActive]}
                  onPress={() => setBulkType('increase')}
                >
                  <Text style={[styles.typeButtonText, bulkType === 'increase' && styles.typeButtonTextActive]}>
                    Increase Prices
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, bulkType === 'decrease' && styles.typeButtonActive]}
                  onPress={() => setBulkType('decrease')}
                >
                  <Text style={[styles.typeButtonText, bulkType === 'decrease' && styles.typeButtonTextActive]}>
                    Decrease Prices
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter percentage"
                  placeholderTextColor="#9CA3AF"
                  value={bulkPercentage}
                  onChangeText={setBulkPercentage}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleBulkPriceUpdate}>
                <Text style={styles.saveButtonText}>Apply Bulk Update</Text>
              </TouchableOpacity>
            </View>
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
    fontWeight: '700',
    color: '#020A66',
  },
  bulkButton: {
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
    fontWeight: '400',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#020A66',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  priceCard: {
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
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  priceDetails: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020A66',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previousPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginRight: 8,
  },
  priceChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  marginValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalCurrentPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 20,
  },
  bulkDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  bulkTypeContainer: {
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
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontWeight: '400',
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  inputFocused: {
    borderColor: '#020A66',
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#020A66',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PricingManagement;