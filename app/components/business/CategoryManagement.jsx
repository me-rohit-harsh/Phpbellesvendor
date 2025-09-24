import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CategoryList from './CategoryList';
import CustomAlert from '../CustomAlert';
import AddCategoryModal from './AddCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import { getMenuCategories, deleteMenuCategory, getMenuItems } from '../../../lib/api/vendor';

const CategoryManagement = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch both categories and menu items
      const [categoriesResponse, itemsResponse] = await Promise.all([
        getMenuCategories(),
        getMenuItems()
      ]);
      
      // Handle different response structures for categories
      let categoriesData = [];
      if (categoriesResponse.categories) {
        categoriesData = categoriesResponse.categories;
      } else if (Array.isArray(categoriesResponse.data)) {
        categoriesData = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse)) {
        categoriesData = categoriesResponse;
      }

      // Handle different response structures for items
      let itemsData = [];
      if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
        itemsData = itemsResponse.data;
      } else if (Array.isArray(itemsResponse)) {
        itemsData = itemsResponse;
      }

      // Calculate items count for each category
      const categoriesWithItemCount = categoriesData.map(category => {
        const itemCount = itemsData.filter(item => item.menu_category_id === category.id).length;
        return {
          ...category,
          items_count: itemCount
        };
      });

      setCategories(categoriesWithItemCount);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to load categories. Please try again.',
        type: 'error',
        buttons: [
          {
            text: 'Retry',
            onPress: () => {
              setShowAlert(false);
              loadCategories();
            }
          },
          {
            text: 'Cancel',
            onPress: () => setShowAlert(false)
          }
        ]
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCategories(true);
  };

  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const handleCategoryAdded = () => {
    loadCategories();
  };

  const handleCategoryUpdated = () => {
    loadCategories();
  };

  const handleCategoryPress = (category) => {
    // TODO: Navigate to category details or items
    setAlertConfig({
      title: 'Category Details',
      message: `View items in "${category.name}" category.`,
      type: 'info',
      buttons: [
        {
          text: 'OK',
          onPress: () => setShowAlert(false)
        }
      ]
    });
    setShowAlert(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {
    // Check if category has items
    const hasItems = category.items_count > 0;
    
    if (hasItems) {
      Alert.alert(
        'Cannot Delete Category',
        `"${category.name}" has ${category.items_count} menu item(s) associated with it. Please remove or reassign all menu items before deleting this category.`,
        [
          {
            text: 'OK',
            style: 'default',
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuCategory(category.id);
              Alert.alert(
                'Success',
                'Category deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => loadCategories()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting category:', error);
              let errorMessage = 'Failed to delete category. Please try again.';
              
              // Handle specific error cases
              if (error.message && error.message.includes('foreign key')) {
                errorMessage = 'Cannot delete category because it has associated menu items. Please remove all menu items from this category first.';
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Category Management</Text>
            <Text style={styles.headerSubtitle}>Organize Your Categories</Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <CategoryList
          categories={categories}
          loading={loading}
          onRefresh={handleRefresh}
          onCategoryPress={handleCategoryPress}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddCategory={handleAddCategory}
        />
      </View>

      {/* Custom Alert */}
      {showAlert && (
        <CustomAlert
          visible={showAlert}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setShowAlert(false)}
        />
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        onCategoryUpdated={handleCategoryUpdated}
        category={selectedCategory}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#020A66',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
});

export default CategoryManagement;