/**
 * Vendor Menu and Category Management
 * Functions for managing vendor menus and menu categories
 */

import api from './api';
import { handleAPIError } from './errorHandler';
import { logRequestDetails, logResponseDetails } from './vendorUtils';

/**
 * Get vendor's menu categories
 * @returns {Promise} API response with categories data
 */
export const getMenuCategories = async () => {
  try {
    logRequestDetails('Fetching menu categories', '/vendor/menu-categories');
    const response = await api.get('/vendor/menu-categories');
    logResponseDetails('Menu categories fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    throw handleAPIError(error);
  }
};

/**
 * Create a new menu category
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.description - Category description
 * @param {boolean} categoryData.is_active - Category active status
 * @returns {Promise} API response with created category data
 */
export const createMenuCategory = async (categoryData) => {
  try {
    logRequestDetails('Creating menu category', '/vendor/menu-categories', categoryData);
    const response = await api.post('/vendor/menu-categories', categoryData);
    logResponseDetails('Menu category creation', response);
    return response.data;
  } catch (error) {
    console.error('Error creating menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update an existing menu category
 * @param {number} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.description - Category description
 * @param {boolean} categoryData.is_active - Category active status
 * @returns {Promise} API response with updated category data
 */
export const updateMenuCategory = async (categoryId, categoryData) => {
  try {
    logRequestDetails('Updating menu category', `/vendor/menu-categories/${categoryId}`, categoryData);
    const response = await api.put(`/vendor/menu-categories/${categoryId}`, categoryData);
    logResponseDetails('Menu category update', response);
    return response.data;
  } catch (error) {
    console.error('Error updating menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Delete a menu category
 * @param {number} categoryId - Category ID
 * @returns {Promise} API response
 */
export const deleteMenuCategory = async (categoryId) => {
  try {
    logRequestDetails('Deleting menu category', `/vendor/menu-categories/${categoryId}`);
    const response = await api.delete(`/vendor/menu-categories/${categoryId}`);
    logResponseDetails('Menu category deletion', response);
    return response.data;
  } catch (error) {
    console.error('Error deleting menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor's menu data
 * @returns {Promise} API response with menu data
 */
export const getVendorMenu = async () => {
  try {
    logRequestDetails('Fetching vendor menu', '/vendor/menu');
    const response = await api.get('/vendor/menu');
    logResponseDetails('Vendor menu fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor menu:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update vendor's menu data
 * @param {Object} menuData - The menu data to update
 * @param {string} menuData.name - Menu name (optional)
 * @param {string} menuData.description - Menu description (required)
 * @param {boolean} menuData.is_active - Menu active status (optional)
 * @returns {Promise} API response with updated menu data
 */
export const updateVendorMenu = async (menuData) => {
  try {
    logRequestDetails('Updating vendor menu', '/vendor/menu', menuData);
    const response = await api.put('/vendor/menu', menuData);
    logResponseDetails('Vendor menu update', response);
    return response.data;
  } catch (error) {
    console.error('Error updating vendor menu:', error);
    throw handleAPIError(error);
  }
};