import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Modal,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CategoryManagement = () => {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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
  
  // Mock data for categories
  const [categories, setCategories] = useState([
    { id: 1, name: 'Appetizer', description: 'Starters and small plates', itemCount: 5, isActive: true },
    { id: 2, name: 'Main Course', description: 'Primary dishes and entrees', itemCount: 12, isActive: true },
    { id: 3, name: 'Dessert', description: 'Sweet treats and desserts', itemCount: 8, isActive: true },
    { id: 4, name: 'Beverages', description: 'Drinks and refreshments', itemCount: 15, isActive: true },
    { id: 5, name: 'Snacks', description: 'Light bites and quick eats', itemCount: 3, isActive: false }
  ]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      showErrorAlert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const exists = categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase());
    if (exists) {
      showErrorAlert('Error', 'Category with this name already exists');
      return;
    }

    const category = {
      id: Date.now(),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      itemCount: 0,
      isActive: true
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', description: '' });
    setShowAddModal(false);
    showSuccessAlert('Success', 'Category added successfully!');
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description
    });
    setShowEditModal(true);
  };

  const handleUpdateCategory = () => {
    if (!newCategory.name.trim()) {
      showErrorAlert('Error', 'Please enter a category name');
      return;
    }

    // Check if category name already exists (excluding current category)
    const exists = categories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategory.name.toLowerCase()
    );
    if (exists) {
      showErrorAlert('Error', 'Category with this name already exists');
      return;
    }

    const updatedCategories = categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: newCategory.name.trim(), description: newCategory.description.trim() }
        : cat
    );

    setCategories(updatedCategories);
    setNewCategory({ name: '', description: '' });
    setEditingCategory(null);
    setShowEditModal(false);
    showSuccessAlert('Success', 'Category updated successfully!');
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category.itemCount > 0) {
      showErrorAlert('Cannot Delete', `This category has ${category.itemCount} items. Please move or delete the items first.`);
      return;
    }

    showConfirmAlert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      () => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        showSuccessAlert('Success', 'Category deleted successfully!');
      }
    );
  };

  const handleToggleActive = (categoryId) => {
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    );
    setCategories(updatedCategories);
  };

  const renderCategoryModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            isEdit ? setShowEditModal(false) : setShowAddModal(false);
            setNewCategory({ name: '', description: '' });
            if (isEdit) setEditingCategory(null);
          }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit Category' : 'Add Category'}</Text>
          <TouchableOpacity onPress={isEdit ? handleUpdateCategory : handleAddCategory}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name *</Text>
            <TextInput
              style={styles.input}
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
              placeholder="Enter category name"
              maxLength={30}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newCategory.description}
              onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
              placeholder="Enter category description (optional)"
              multiline
              maxLength={100}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <ScrollView style={styles.categoriesList}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <Text style={styles.itemCount}>{category.itemCount} items</Text>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: category.isActive ? '#10B981' : '#6B7280' }]}
                  onPress={() => handleToggleActive(category.id)}
                >
                  <Ionicons 
                    name={category.isActive ? 'checkmark' : 'close'} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                  onPress={() => handleEditCategory(category)}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleDeleteCategory(category.id)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        {categories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No Categories</Text>
            <Text style={styles.emptyStateSubtext}>Add your first category to organize your food items</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Category Modal */}
      {renderCategoryModal(false)}
      {renderCategoryModal(true)}

      {/* Custom Alert */}
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={() => setShowAlert(false)}
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
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#9CA3AF',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
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
});

export default CategoryManagement;