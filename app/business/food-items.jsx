import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
// Import Android-specific functions
import { getMenuItems, getMenuItemsByCategory, getMenuCategories, createMenuItem, updateMenuItem, toggleMenuItemStock } from '../../lib/api/vendor';
// removed api import previously used for connectivity tests
import { showImagePickerOptions } from '../../lib/utils/permissions';

const FoodItemsManagement = () => {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error', buttons: [] });
  
  // Add ref to track if data has been loaded to prevent infinite loops
  const hasLoadedData = useRef(false);
  
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
  
  // State for food items loaded from API
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    discount_price: '',
    description: '',
    image: null,
    quantity: '',
    type: 'veg', // veg or non-veg
    preparation_time: '15', // in minutes
    calories: '',
    tags: [],
    sort_order: '1',
    is_available: true,
    totalOrders: 0,
    weeklyOrders: 0
  });

  // Dynamic categories loaded from API - store as objects with id and name
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]); // Start with 'All' as default
  const [categoryObjects, setCategoryObjects] = useState([]); // Store full category objects for API calls
  
  // Enhanced loadMenuItems function with better error handling
  const loadMenuItems = useCallback(async (selectedCategoryId = null, categoriesData = null) => {
    setLoading(true);
    
    try {
      // Use provided categories or fall back to state
      const availableCategories = categoriesData || categoryObjects;
      
      // removed console.log by codemod — use logger for persistent logs
      // removed console.log by codemod — use logger for persistent logs
      // removed console.log by codemod — use logger for persistent logs
      // removed console.log by codemod — use logger for persistent logs
      
      // Add Android-specific logging
      if (Platform.OS === 'android') {
        // removed console.log by codemod — use logger for persistent logs
      }
      
      // Determine which API call to make
      let response;
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        // Load items for specific category ID
        // removed console.log by codemod — use logger for persistent logs
        response = await getMenuItemsByCategory(selectedCategoryId);
      } else {
        // Load all items (for 'All' category or no specific category)
        // removed console.log by codemod — use logger for persistent logs
        response = await getMenuItems(); // This now uses Android-specific handling
      }
      
      console.info('📦 Raw menu items response:', response);
      
      // Handle different response structures
      let menuItems = [];
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          menuItems = response.data;
          console.info('✅ Using response.data structure');
        }
        // If response.data has a data property (nested), use that
        else if (response.data.data && Array.isArray(response.data.data)) {
          menuItems = response.data.data;
          console.info('✅ Using response.data.data structure');
        }
        // If response.data has items property, use that
        else if (response.data.items && Array.isArray(response.data.items)) {
          menuItems = response.data.items;
        }
        // If response.data is an object with menu_items property
        else if (response.data.menu_items && Array.isArray(response.data.menu_items)) {
          menuItems = response.data.menu_items;
        }
      } else if (response) {
        menuItems = Array.isArray(response) ? response : [response];
        console.info('✅ Using direct response structure');
      }
      
      // removed console.log by codemod — use logger for persistent logs
      // removed console.log by codemod — use logger for persistent logs
      
      // Normalize menu items to ensure consistent category and stock fields for filtering
      const normalizedItems = menuItems.map(item => {
        // Get category name from various possible fields with better priority
        let categoryName = 'Uncategorized';
        
        // First try to map using menu_category_id and loaded categories
        if (item.menu_category_id && availableCategories.length > 0) {
          const matchingCategory = availableCategories.find(cat => 
            (cat.id || cat.category_id) === item.menu_category_id
          );
          if (matchingCategory) {
            categoryName = matchingCategory.name || matchingCategory.category_name || matchingCategory.title;
          }
        }
        // Fallback to other possible fields
        else if (item.menu_category?.name) {
          categoryName = item.menu_category.name;
        } else if (item.menu_category?.category_name) {
          categoryName = item.menu_category.category_name;
        } else if (item.category_name) {
          categoryName = item.category_name;
        } else if (item.category) {
          categoryName = item.category;
        }
        
        // Normalize stock status - use is_available as the primary field
        const stockStatus = item.is_available !== undefined ? item.is_available : 
                           item.inStock !== undefined ? item.inStock :
                           item.in_stock !== undefined ? item.in_stock :
                           item.stock !== undefined ? item.stock :
                           item.available !== undefined ? item.available :
                           true; // Default to true if no stock field found
        
        return {
          ...item,
          // Ensure we have a consistent category field for filtering
          category: categoryName,
          // Ensure we have consistent stock fields
          is_available: stockStatus,
          inStock: stockStatus, // Keep for backward compatibility
          // Also preserve original category info for debugging
          originalCategory: item.category,
          categoryName: item.category_name,
          menuCategory: item.menu_category
        };
      });
      
      // removed console.log by codemod — use logger for persistent logs
      
      // Debug each item's image field
      normalizedItems.forEach((item, index) => {
        // removed console.log by codemod — use logger for persistent logs
      });
      
      setFoodItems(normalizedItems);
      console.info('✅ Food items state updated with', normalizedItems.length, 'items');
      
      if (normalizedItems.length === 0) {
        console.info('⚠️ No menu items found in response');
      }
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Enhanced error handling for Android
      if (Platform.OS === 'android' && error.message && (error.message.includes('Network Error') || error.code === 'ERR_NETWORK')) {
        console.error('🤖 Android Network Error detected - showing specific error message');
        showErrorAlert('Network Error', 'Unable to connect to the server. Please check your internet connection and try again. This specific Android network issue has been fixed - please restart the app.');
      } else {
        showErrorAlert('Error', `Failed to load menu items: ${error.message || 'Please try again.'}`);
      }
      
      setFoodItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we don't want this function to change

  // Load categories from API
  const loadCategories = async () => {
    // Default fallback categories
    const fallbackCategories = [
      { id: 'all', name: 'All' },
      { id: 'appetizer', name: 'Appetizer' },
      { id: 'main', name: 'Main Course' },
      { id: 'dessert', name: 'Dessert' },
      { id: 'beverages', name: 'Beverages' },
      { id: 'snacks', name: 'Snacks' },
    ];

    try {
      console.info('🔄 Loading categories from API...');
      const response = await getMenuCategories();
      console.info('📦 Categories API Response:', response);
      
      // Handle different response structures
      let categoryList = [];
      if (response) {
        // If response is an array directly
        if (Array.isArray(response)) {
          categoryList = response;
        }
        // If response has data property
        else if (response.data) {
          // If response.data is an array, use it directly
          if (Array.isArray(response.data)) {
            categoryList = response.data;
          }
          // If response.data has a data property (nested), use that
          else if (response.data.data && Array.isArray(response.data.data)) {
            categoryList = response.data.data;
          }
          // If response.data has categories property, use that
          else if (response.data.categories && Array.isArray(response.data.categories)) {
            categoryList = response.data.categories;
          }
        }
        // If response has categories property directly
        else if (response.categories && Array.isArray(response.categories)) {
          categoryList = response.categories;
        }
      }
      
      console.info('🏷️ Processed categories from API:', categoryList);
      
      // If we got categories from API, use them
      if (categoryList && categoryList.length > 0) {
        // Store full category objects for API calls (keep original structure)
        setCategoryObjects(categoryList);
        
        // Create display categories with id and name, add 'All' at the beginning and 'Uncategorized' at the end
        const displayCategories = categoryList.map(cat => ({
          id: cat.id || cat.category_id,
          name: cat.name || cat.category_name || cat.title || cat
        }));
        const allCategories = [
          { id: 'all', name: 'All' }, 
          ...displayCategories,
          { id: 'uncategorized', name: 'Uncategorized' }
        ];
        
        console.info('📋 Final categories list from API:', allCategories);
        console.info('📋 Category objects for API calls:', categoryList);
        setCategories(allCategories);
        
        // Set default category for new items (first non-'All' category)
        const defaultCategory = allCategories.length > 1 ? allCategories[1].name : 'Main Course';
        setNewItem(prev => ({ ...prev, category: defaultCategory }));
        
        return categoryList; // Return the loaded categories
      } else {
        // No categories from API, use fallback
        console.info('⚠️ No categories from API, using fallback categories');
        setCategories(fallbackCategories);
        setNewItem(prev => ({ ...prev, category: 'Main Course' }));
        return []; // Return empty array for fallback
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Always show fallback categories on error
      console.info('🔄 Using fallback categories due to error');
      setCategories(fallbackCategories);
      setNewItem(prev => ({ ...prev, category: 'Main Course' }));
      return []; // Return empty array on error
    }
  };

  // Helper function to get default category
  const getDefaultCategory = () => {
    return categories.length > 1 ? categories[1].name : 'Main Course';
  };

  // Handle category selection (memoized to prevent unnecessary re-renders)
  const handleCategorySelect = useCallback(async (category) => {
    console.info('🎯 Category selected:', category);
    setSelectedCategory(category.name);
    
    // Load items based on selected category
    if (category.id === 'all' || category.name === 'All') {
      console.info('📋 Loading all items...');
      await loadMenuItems(); // Load all items
    } else {
      console.info('🏷️ Loading items for category:', category.name, 'ID:', category.id);
      // Load items for the specific category
      await loadMenuItems(category.id);
    }
  }, [loadMenuItems]); // Depend on loadMenuItems since we call it

  // Connectivity test handler removed — not needed in production UI

  // Load data on component mount only (prevent infinite loops)
  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedData.current) {
        console.info('🔄 Data already loaded, skipping...');
        return;
      }
      
      console.info('🚀 Initial data load starting...');
      hasLoadedData.current = true;
      
      try {
        const loadedCategories = await loadCategories(); // Load categories first
        await loadMenuItems(null, loadedCategories); // Then load menu items with the loaded categories
        console.info('✅ Initial data load completed');
      } catch (error) {
        console.error('❌ Error during initial data load:', error);
        hasLoadedData.current = false; // Reset on error to allow retry
      }
    };
    loadData();
  }, []); // Empty dependency array - only run on mount
  
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
    const matchesSearch = searchQuery === '' || 
                         (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Use the normalized category field for filtering
    const itemCategory = item.category || 'Uncategorized';
    
    // Category matching logic
    let matchesCategory = false;
    
    if (selectedCategory === 'All' || !selectedCategory) {
      // Show all items when 'All' is selected
      matchesCategory = true;
    } else if (selectedCategory === 'Uncategorized') {
      // Show only uncategorized items when 'Uncategorized' is selected
      matchesCategory = itemCategory === 'Uncategorized';
    } else {
      // For specific categories, try exact match first, then case-insensitive
      matchesCategory = itemCategory === selectedCategory || 
                       itemCategory.toLowerCase() === selectedCategory.toLowerCase();
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = async () => {
    // Enhanced validation with specific error messages
    if (!newItem.name?.trim()) {
      showErrorAlert('Validation Error', 'Item name is required');
      return;
    }

    if (!newItem.price || isNaN(parseFloat(newItem.price)) || parseFloat(newItem.price) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid price greater than 0');
      return;
    }

    if (!newItem.quantity || isNaN(parseInt(newItem.quantity)) || parseInt(newItem.quantity) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (!newItem.category) {
      showErrorAlert('Validation Error', 'Please select a category');
      return;
    }

    if (!newItem.description?.trim()) {
      showErrorAlert('Validation Error', 'Please enter a description for the item');
      return;
    }

    // Image is required by the API
    if (!newItem.image) {
      showErrorAlert('Validation Error', 'Please select an image for your food item');
      return;
    }

    // Validate image file object structure
    if (typeof newItem.image === 'object' && !newItem.image.uri) {
      showErrorAlert('Validation Error', 'Invalid image file. Please select a new image');
      return;
    }

    // Validate discount price if provided
    if (newItem.discount_price && (isNaN(parseFloat(newItem.discount_price)) || parseFloat(newItem.discount_price) < 0)) {
      showErrorAlert('Validation Error', 'Please enter a valid discount price');
      return;
    }

    // Validate preparation time if provided
    if (newItem.preparation_time && (isNaN(parseInt(newItem.preparation_time)) || parseInt(newItem.preparation_time) < 0)) {
      showErrorAlert('Validation Error', 'Please enter a valid preparation time in minutes');
      return;
    }
    
    try {
      // Find the category object to get the category_id
      const selectedCategoryObj = categoryObjects.find(cat => 
        (cat.name || cat.category_name) === newItem.category
      );

      if (!selectedCategoryObj || !selectedCategoryObj.id) {
        console.error('❌ Category not found or missing ID');
        console.error('❌ Selected category name:', newItem.category);
        console.error('❌ Available categories:', categoryObjects.map(cat => ({ name: cat.name || cat.category_name, id: cat.id })));
        showErrorAlert('Category Error', `Category "${newItem.category}" not found. Please select a valid category.`);
        return;
      }
      
      // Create the menu item with required image
      console.info('📦 Creating menu item...');
      const itemData = {
        menu_category_id: selectedCategoryObj.id.toString(), // API expects string ID
        name: newItem.name,
        description: newItem.description || '',
        price: parseFloat(newItem.price).toFixed(2), // API expects decimal format
        discount_price: newItem.discount_price ? parseFloat(newItem.discount_price).toFixed(2) : parseFloat(newItem.price).toFixed(2), // Use discount price or fallback to price
        is_available: newItem.is_available,
        type: newItem.type || 'veg', // Use form value or default to veg
        tags: Array.isArray(newItem.tags) ? newItem.tags : (typeof newItem.tags === 'string' ? newItem.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []), // Handle both array and string formats
        preparation_time: newItem.preparation_time || '15', // Use form value or default
        calories: newItem.calories || '0', // Use form value or default to 0
        sort_order: newItem.sort_order || '1', // Use form value or default sort order
        stock: parseInt(newItem.quantity).toString(), // API expects string
        image: newItem.image // Required image field
      };

      const response = await createMenuItem(itemData);
      
      // Validate that we actually got a successful response
      if (!response) {
        throw new Error('❌ No response received from API');
      }
      
      // Check if response indicates success
      // The API returns the created menu item object directly, so check for required fields
      const isSuccess = response.success || 
                       (response.data && response.data.success) || 
                       (response.status && response.status >= 200 && response.status < 300) ||
                       response.message?.includes('success') ||
                       (response.id && response.name && response.price); // Menu item created successfully
      
      if (!isSuccess) {
        console.error('❌ API response indicates failure:', response);
        throw new Error(response.message || response.error || 'Failed to create menu item');
      }
      
      // Reload menu items to get the updated list from server
      await loadMenuItems();
      
      // Only show success if everything completed without errors
      setNewItem({ name: '', category: getDefaultCategory(), price: '', discount_price: '', description: '', image: null, quantity: '', type: 'veg', preparation_time: '15', calories: '', tags: [], sort_order: '1', is_available: true, totalOrders: 0, weeklyOrders: 0 });
      setShowAddModal(false);
      
      console.info('🎉 Food item creation process completed successfully');
      showSuccessAlert('Success', 'Food item added successfully!');
    } catch (error) {
      console.error('❌ Error adding food item:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error stack:', error.stack);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = 'Error';
      
      // Handle specific error types
      if (error.message?.includes('toString')) {
        errorTitle = 'Data Processing Error';
        errorMessage = 'There was an issue processing the item data. Please check all fields and try again.';
      } else if (error.message?.includes('Network')) {
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('Server error') || error.message?.includes('HTML')) {
        errorTitle = 'Server Error';
        errorMessage = 'The server is experiencing issues. Please try again later or contact support if the problem persists.';
      } else if (error.response?.status === 422) {
        errorTitle = 'Validation Error';
        errorMessage = error.response?.data?.message || 'The submitted data is invalid. Please check all fields and try again.';
      } else if (error.response?.status === 401) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorTitle = 'Permission Error';
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.response?.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'The server is experiencing issues. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorAlert(errorTitle, errorMessage);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image,
      quantity: item.quantity ? item.quantity.toString() : '',
      type: item.type || 'veg',
      preparation_time: item.preparation_time ? item.preparation_time.toString() : '',
      calories: item.calories ? item.calories.toString() : '',
      totalOrders: item.totalOrders || 0,
      weeklyOrders: item.weeklyOrders || 0,
      discount_price: item.discount_price ? item.discount_price.toString() : '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      sort_order: item.sort_order ? item.sort_order.toString() : '',
      is_available: item.is_available !== undefined ? item.is_available : true
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async () => {
    // Enhanced validation with specific error messages
    if (!newItem.name?.trim()) {
      showErrorAlert('Validation Error', 'Please enter the item name');
      return;
    }

    if (!newItem.price || isNaN(parseFloat(newItem.price)) || parseFloat(newItem.price) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid price greater than 0');
      return;
    }

    if (!newItem.quantity || isNaN(parseInt(newItem.quantity)) || parseInt(newItem.quantity) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (!newItem.category) {
      showErrorAlert('Validation Error', 'Please select a category');
      return;
    }

    if (!newItem.description?.trim()) {
      showErrorAlert('Validation Error', 'Please enter a description for the item');
      return;
    }

    // Validate discount price if provided
    if (newItem.discount_price && (isNaN(parseFloat(newItem.discount_price)) || parseFloat(newItem.discount_price) < 0)) {
      showErrorAlert('Validation Error', 'Please enter a valid discount price');
      return;
    }

    // Validate preparation time if provided
    if (newItem.preparation_time && (isNaN(parseInt(newItem.preparation_time)) || parseInt(newItem.preparation_time) < 0)) {
      showErrorAlert('Validation Error', 'Please enter a valid preparation time in minutes');
      return;
    }

    try {
      // Find the category object to get the category_id
      const selectedCategoryObj = categoryObjects.find(cat => 
        (cat.name || cat.category_name) === newItem.category
      );

      if (!selectedCategoryObj || !selectedCategoryObj.id) {
        showErrorAlert('Error', `Category "${newItem.category}" not found. Please select a valid category.`);
        return;
      }

      // Pass the image file object directly (not URL)
      const itemData = {
        menu_category_id: selectedCategoryObj ? selectedCategoryObj.id.toString() : null, // API expects string ID
        name: newItem.name,
        description: newItem.description || '',
        price: parseFloat(newItem.price).toFixed(2), // API expects decimal format
        discount_price: newItem.discount_price ? parseFloat(newItem.discount_price).toFixed(2) : parseFloat(newItem.price).toFixed(2), // Use discount price or fallback to price
        is_available: newItem.is_available,
        type: newItem.type || 'veg', // Use form value or default to veg
        tags: Array.isArray(newItem.tags) ? newItem.tags : (typeof newItem.tags === 'string' ? newItem.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []), // Handle both array and string formats
        preparation_time: newItem.preparation_time || '15', // Use form value or default
        calories: newItem.calories || '0', // Use form value or default to 0
        sort_order: newItem.sort_order || '1', // Use form value or default sort order
        stock: parseInt(newItem.quantity).toString(), // API expects string
        in_stock: parseInt(newItem.quantity) > 0
      };

      // Only include image file if a new image was uploaded
      if (newItem.image) {
        itemData.image = newItem.image;
        console.log('🖼️ Image file object for update:', newItem.image);
      }

      console.log('🔄 Updating menu item:', editingItem.id, itemData);
      const response = await updateMenuItem(editingItem.id, itemData);
      
      // Reload menu items to get the updated list from server
      await loadMenuItems();
      
      setNewItem({ name: '', category: getDefaultCategory(), price: '', discount_price: '', description: '', image: null, quantity: '', type: 'veg', preparation_time: '15', calories: '', tags: [], sort_order: '1', is_available: true });
      setEditingItem(null);
      setShowEditModal(false);
      showSuccessAlert('Success', 'Food item updated successfully!');
    } catch (error) {
      console.error('❌ Error updating food item:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Please try again.';
      
      // Check if it's a server error (HTML response)
      if (error.message?.includes('Server error') || error.message?.includes('HTML')) {
        errorMessage = 'Server error detected. Please check your internet connection and try again. If the problem persists, contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorAlert('Error', `Failed to update food item: ${errorMessage}`);
    }
  };



  const toggleStock = async (id) => {
    try {
      // Find the current item to get its current stock status
      const currentItem = foodItems.find(item => item.id === id);
      if (!currentItem) {
        console.error('Item not found for stock toggle');
        setAlertConfig({
          title: 'Error',
          message: 'Item not found. Please refresh and try again.',
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
        });
        setShowAlert(true);
        return;
      }
      
      // Call the toggle stock API
      const response = await toggleMenuItemStock(id);
      
      // Check for successful response and extract the new stock status
      if (response && response.data) {
        // Try multiple possible field names for stock status
        const newStockStatus = response.data.is_available ?? 
                              response.data.inStock ?? 
                              response.data.in_stock ?? 
                              response.data.stock ?? 
                              response.data.available;
        const message = response.data.message;
        
        // If stock status is still undefined, toggle the current state as fallback
        const currentStatus = currentItem.is_available !== undefined ? currentItem.is_available : currentItem.inStock;
        const finalStockStatus = newStockStatus !== undefined ? newStockStatus : !currentStatus;
        
        // Update local state with the new stock status from the API
        setFoodItems(prevItems => prevItems.map(item => 
          item.id === id ? { 
            ...item, 
            is_available: finalStockStatus,
            inStock: finalStockStatus // Keep both for compatibility
          } : item
        ));
        
        // Show success message from the API
        setAlertConfig({
          title: 'Success',
          message: message || `Item marked as ${finalStockStatus ? 'in stock' : 'out of stock'}`,
          type: 'success',
          buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
        });
        setShowAlert(true);
        
        console.info(`✅ Stock status updated successfully for item ${id}: ${finalStockStatus}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error toggling stock status:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to update stock status. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertConfig({
        title: 'Error',
        message: errorMessage,
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    }
  };

  // Helper function to get image URI from either file object or URL string
  const getImageUri = (image) => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && image.uri) return image.uri;
    return null;
  };

  const pickImage = () => {
    showImagePickerOptions(
      (imageFile) => {
        console.log('📸 Selected image file:', imageFile);
        setNewItem({ ...newItem, image: imageFile });
      },
      {
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      },
      'camera'
    );
  };

  const FoodItemCard = ({ item }) => {
    // Helper function to get image URL from different possible field names
    const getImageUrl = (item) => {
      // Priority order: asset_url (new API response), then fallback to other fields
      const possibleImageFields = ['asset_url', 'image_url', 'image', 'photo', 'picture', 'thumbnail'];
      for (const field of possibleImageFields) {
        if (item[field] && typeof item[field] === 'string' && item[field].trim() !== '') {
          return item[field].trim();
        }
      }
      return null;
    };

    const imageUrl = getImageUrl(item);
    console.log(`🖼️ Image URL for ${item.name}:`, imageUrl);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemImageContainer}>
            {imageUrl ? (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.itemImage}
                onError={(error) => {
                  console.log(`❌ Failed to load image for ${item.name}:`, error.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log(`✅ Successfully loaded image for ${item.name}`);
                }}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
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
            <View style={[styles.stockIndicator, { backgroundColor: (item.is_available !== undefined ? item.is_available : item.inStock) ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.stockText}>
              {(item.is_available !== undefined ? item.is_available : item.inStock) ? `Stock: ${item.quantity || 'Available'}` : 'Out of Stock'}
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: (item.is_available !== undefined ? item.is_available : item.inStock) ? '#EF4444' : '#10B981' }]}
            onPress={() => toggleStock(item.id)}
          >
            <Ionicons 
              name={(item.is_available !== undefined ? item.is_available : item.inStock) ? 'remove-circle' : 'add-circle'} 
              size={16} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleEditItem(item)}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          

        </View>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryId ? `Category ${categoryId} Items` : 'Food Items'}
        </Text>
        <View style={styles.headerActions}>
          {/* Connectivity test button removed */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
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
            key={category.id || category.name}
            style={[
              styles.categoryButton,
              selectedCategory === category.name && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.name && styles.selectedCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Food Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading menu items...</Text>
            <Text style={styles.emptyStateSubtext}>Please wait while we fetch your food items</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))
        ) : (
          <View style={styles.emptyState}>
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
              {getImageUri(newItem.image) ? (
                <Image source={{ uri: getImageUri(newItem.image) }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Add Photo *</Text>
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
                      key={category.id || category.name}
                      style={[
                        styles.categorySelectorButton,
                        newItem.category === category.name && styles.selectedCategorySelectorButton
                      ]}
                      onPress={() => setNewItem({ ...newItem, category: category.name })}
                    >
                      <Text style={[
                        styles.categorySelectorText,
                        newItem.category === category.name && styles.selectedCategorySelectorText
                      ]}>
                        {category.name}
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
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const numericText = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = numericText.split('.');
                    const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                    setNewItem({ ...newItem, price: validText });
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Discount Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={newItem.discount_price}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const numericText = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = numericText.split('.');
                    const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                    setNewItem({ ...newItem, discount_price: validText });
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.quantity}
                  onChangeText={(text) => {
                    // Only allow whole numbers
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, quantity: numericText });
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Sort Order</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={newItem.sort_order}
                  onChangeText={(text) => {
                    // Only allow whole numbers
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, sort_order: numericText });
                  }}
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



            <View style={styles.formGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. spicy, best-seller"
                value={Array.isArray(newItem.tags) ? newItem.tags.join(', ') : ''}
                onChangeText={(text) => {
                  const tagsArray = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                  setNewItem({ ...newItem, tags: tagsArray });
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Availability</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.is_available === true && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, is_available: true })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.is_available === true && styles.selectedCategorySelectorText
                    ]}>
                      Available
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.is_available === false && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, is_available: false })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.is_available === false && styles.selectedCategorySelectorText
                    ]}>
                      Unavailable
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Food Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.type === 'veg' && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, type: 'veg' })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.type === 'veg' && styles.selectedCategorySelectorText
                    ]}>
                      Vegetarian
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.type === 'non-veg' && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, type: 'non-veg' })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.type === 'non-veg' && styles.selectedCategorySelectorText
                    ]}>
                      Non-Vegetarian
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Prep Time (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  value={newItem.preparation_time}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, preparation_time: numericText });
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={newItem.calories}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, calories: numericText });
                  }}
                  keyboardType="numeric"
                />
              </View>
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
              {getImageUri(newItem.image) ? (
                <Image source={{ uri: getImageUri(newItem.image) }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Add Photo *</Text>
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
                      key={category.id || category.name}
                      style={[
                        styles.categorySelectorButton,
                        newItem.category === category.name && styles.selectedCategorySelectorButton
                      ]}
                      onPress={() => setNewItem({ ...newItem, category: category.name })}
                    >
                      <Text style={[
                        styles.categorySelectorText,
                        newItem.category === category.name && styles.selectedCategorySelectorText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Food Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.type === 'veg' && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, type: 'veg' })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.type === 'veg' && styles.selectedCategorySelectorText
                    ]}>
                      Vegetarian
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.type === 'non-veg' && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, type: 'non-veg' })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.type === 'non-veg' && styles.selectedCategorySelectorText
                    ]}>
                      Non-Vegetarian
                    </Text>
                  </TouchableOpacity>
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
                <Text style={styles.label}>Discount Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={newItem.discount_price}
                  onChangeText={(text) => setNewItem({ ...newItem, discount_price: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Sort Order</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={newItem.sort_order}
                  onChangeText={(text) => setNewItem({ ...newItem, sort_order: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Prep Time (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  value={newItem.preparation_time}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, preparation_time: numericText });
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={newItem.calories}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewItem({ ...newItem, calories: numericText });
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. spicy, best-seller"
                value={Array.isArray(newItem.tags) ? newItem.tags.join(', ') : ''}
                onChangeText={(text) => {
                  const tagsArray = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                  setNewItem({ ...newItem, tags: tagsArray });
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Availability</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.is_available === true && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, is_available: true })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.is_available === true && styles.selectedCategorySelectorText
                    ]}>
                      Available
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorButton,
                      newItem.is_available === false && styles.selectedCategorySelectorButton
                    ]}
                    onPress={() => setNewItem({ ...newItem, is_available: false })}
                  >
                    <Text style={[
                      styles.categorySelectorText,
                      newItem.is_available === false && styles.selectedCategorySelectorText
                    ]}>
                      Unavailable
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    maxHeight: 50,
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
    paddingTop: 30,
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
  backButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#020A66',
  },
  addButtonText: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 10,
    fontFamily: 'MyFont-Medium',
    color: '#FFFFFF',
  },
  placeholderText: {
    fontSize: 10,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
});

export default FoodItemsManagement;