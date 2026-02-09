// Main vendor module - exports all vendor-related functions
// This file serves as the main entry point for all vendor operations

// Import utility functions
export {
  retryRequest,
  getAuthToken,
  createAuthHeaders,
  logRequestDetails,
  logResponseDetails,
  createFormDataForUpload,
  validateImageFile
} from './vendorUtils';

// Import vendor registration and profile functions
export {
  registerVendor,
  getVendorProfile,
  getCompleteProfile,
  updateCompleteProfile
} from './vendorRegistration';

// Import vendor status and type functions
export {
  getVendorTypes,
  getFoodTypes,
  toggleVendorStatus,
  getVendorStatus
} from './vendorStatus';

// Import vendor dashboard statistics functions
export {
  getDashboardStats,
  parseDashboardStats
} from './vendorDashboard';

// Import vendor menu and category functions
export {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getVendorMenu,
  updateVendorMenu
} from './vendorMenu';

// Import vendor menu item functions
export {
  getMenuItems,
  getMenuItemsByCategory,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStock
} from './vendorMenuItems';

// Re-export everything for backward compatibility
export * from './vendorUtils';
export * from './vendorRegistration';
export * from './vendorStatus';
export * from './vendorDashboard';
export * from './vendorMenu';
export * from './vendorMenuItems';
