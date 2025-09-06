import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  Modal,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const FoodItemsManagement = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error', buttons: [] });
  
  // Helper functions for alerts
  const showErrorAlert = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessAlert = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showConfirmAlert = (title, message, onConfirm) => {
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
  
  // Mock data for food items with order tracking
  const [foodItems, setFoodItems] = useState([
    {
      id: 1,
      name: 'Chicken Biryani',
      category: 'Main Course',
      price: 299,
      description: 'Aromatic basmati rice with tender chicken pieces',
      image: null,
      inStock: true,
      quantity: 25,
      totalOrders: 156,
      weeklyOrders: 23
    },
    {
      id: 2,
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      price: 249,
      description: 'Creamy tomato-based curry with cottage cheese',
      image: null,
      inStock: true,
      quantity: 15,
      totalOrders: 89,
      weeklyOrders: 12
    },
    {
      id: 3,
      name: 'Gulab Jamun',
      category: 'Dessert',
      price: 89,
      description: 'Sweet milk dumplings in sugar syrup',
      image: null,
      inStock: false,
      quantity: 0,
      totalOrders: 67,
      weeklyOrders: 8
    },
    {
      id: 4,
      name: 'Masala Dosa',
      category: 'Main Course',
      price: 149,
      description: 'Crispy crepe with spiced potato filling',
      image: null,
      inStock: true,
      quantity: 30,
      totalOrders: 203,
      weeklyOrders: 31
    },
    {
      id: 5,
      name: 'Mango Lassi',
      category: 'Beverages',
      price: 79,
      description: 'Refreshing yogurt drink with mango',
      image: null,
      inStock: true,
      quantity: 20,
      totalOrders: 134,
      weeklyOrders: 19
    }
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    description: '',
    image: null,
    quantity: '',
    totalOrders: 0,
    weeklyOrders: 0
  });

  // Dynamic categories - in a real app, this would come from a shared state or API
  const [categories, setCategories] = useState(['All', 'Appetizer', 'Main Course', 'Dessert', 'Beverages', 'Snacks']);
  
  // Function to get most ordered items
  const getMostOrderedItems = (limit = 5) => {
    return [...foodItems]
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, limit);
  };
  
  // Function to get weekly trending items
  const getWeeklyTrendingItems = (limit = 5) => {
    return [...foodItems]
      .sort((a, b) => b.weeklyOrders - a.weeklyOrders)
      .slice(0, limit);
  };

  const filteredItems = foodItems.filter(item => {
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.quantity) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    const item = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category,
      price: parseFloat(newItem.price),
      description: newItem.description,
      image: newItem.image,
      inStock: parseInt(newItem.quantity) > 0,
      quantity: parseInt(newItem.quantity),
      totalOrders: 0,
      weeklyOrders: 0
    };

    setFoodItems([...foodItems, item]);
    setNewItem({ name: '', category: 'Main Course', price: '', description: '', image: null, quantity: '', totalOrders: 0, weeklyOrders: 0 });
    setShowAddModal(false);
    showSuccessAlert('Success', 'Food item added successfully!');
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image,
      quantity: item.quantity.toString(),
      totalOrders: item.totalOrders,
      weeklyOrders: item.weeklyOrders
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = () => {
    if (!newItem.name || !newItem.price || !newItem.quantity) {
      showErrorAlert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedItem = {
      ...editingItem,
      name: newItem.name,
      category: newItem.category,
      price: parseFloat(newItem.price),
      description: newItem.description,
      image: newItem.image,
      inStock: parseInt(newItem.quantity) > 0,
      quantity: parseInt(newItem.quantity)
    };

    setFoodItems(foodItems.map(item => 
      item.id === editingItem.id ? updatedItem : item
    ));
    setNewItem({ name: '', category: 'Main Course', price: '', description: '', image: null, quantity: '' });
    setEditingItem(null);
    setShowEditModal(false);
    showSuccessAlert('Success', 'Food item updated successfully!');
  };

  const handleDeleteItem = (id) => {
    showConfirmAlert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      () => {
        setFoodItems(foodItems.filter(item => item.id !== id));
      }
    );
  };

  const toggleStock = (id) => {
    setFoodItems(foodItems.map(item => 
      item.id === id ? { ...item, inStock: !item.inStock } : item
    ));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewItem({ ...newItem, image: result.assets[0].uri });
    }
  };

  const FoodItemCard = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.stockInfo}>
            <View style={[styles.stockIndicator, { backgroundColor: item.inStock ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.stockText}>
              {item.inStock ? `Stock: ${item.quantity}` : 'Out of Stock'}
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.inStock ? '#EF4444' : '#10B981' }]}
            onPress={() => toggleStock(item.id)}
          >
            <Ionicons 
              name={item.inStock ? 'close-circle' : 'checkmark-circle'} 
              size={14} 
              color="white" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleEditItem(item)}
          >
            <Ionicons name="pencil" size={14} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Ionicons name="trash" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Items</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Food Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No food items found</Text>
            <Text style={styles.emptyStateSubtext}>Add your first food item to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Food Item</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {newItem.image ? (
                <Image source={{ uri: newItem.image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={40} color="#9CA3AF" />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categorySelectorButton,
                        newItem.category === category && styles.selectedCategorySelectorButton
                      ]}
                      onPress={() => setNewItem({ ...newItem, category })}
                    >
                      <Text style={[
                        styles.categorySelectorText,
                        newItem.category === category && styles.selectedCategorySelectorText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.price}
                  onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter item description"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Food Item</Text>
            <TouchableOpacity onPress={handleUpdateItem}>
              <Text style={styles.saveButton}>Update</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {newItem.image ? (
                <Image source={{ uri: newItem.image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={40} color="#9CA3AF" />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categorySelectorButton,
                        newItem.category === category && styles.selectedCategorySelectorButton
                      ]}
                      onPress={() => setNewItem({ ...newItem, category })}
                    >
                      <Text style={[
                        styles.categorySelectorText,
                        newItem.category === category && styles.selectedCategorySelectorText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.price}
                  onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter item description"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#020A66',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#1F2937',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    maxHeight: 55,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    
  },
  selectedCategoryButton: {
    backgroundColor: '#020A66',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockText: {
    fontSize: 11,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imagePicker: {
    alignItems: 'center',
    marginVertical: 20,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imagePickerPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
  },
  categorySelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategorySelectorButton: {
    backgroundColor: '#020A66',
    borderColor: '#020A66',
  },
  categorySelectorText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  selectedCategorySelectorText: {
    color: '#FFFFFF',
  },
});

export default FoodItemsManagement;