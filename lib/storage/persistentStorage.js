import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent Storage Utility for managing temporary app data
 * Handles auto-save, data recovery, and cleanup for better UX
 */

const STORAGE_KEYS = {
  REGISTRATION_DATA: 'temp_registration_data',
  REGISTRATION_PROGRESS: 'temp_registration_progress',
  FORM_DRAFTS: 'temp_form_drafts',
  SESSION_DATA: 'temp_session_data',
  LAST_ACTIVITY: 'temp_last_activity'
};

const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class PersistentStorage {
  /**
   * Save data with automatic expiry and metadata
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {number} expiryHours - Hours until expiry (default: 24)
   */
  static async saveData(key, data, expiryHours = 24) {
    try {
      const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
      const storageData = {
        data,
        timestamp: Date.now(),
        expiryTime,
        version: '1.0'
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(storageData));
      console.info(`[PersistentStorage] Saved data for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`[PersistentStorage] Error saving data for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve data with automatic expiry check
   * @param {string} key - Storage key
   * @returns {any|null} - Retrieved data or null if expired/not found
   */
  static async getData(key) {
    try {
      const storedData = await AsyncStorage.getItem(key);
      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(storedData);
      
      // Check if data has expired
      if (Date.now() > parsedData.expiryTime) {
        console.info(`[PersistentStorage] Data expired for key: ${key}, removing...`);
        await this.removeData(key);
        return null;
      }

      console.info(`[PersistentStorage] Retrieved data for key: ${key}`);
      return parsedData.data;
    } catch (error) {
      console.error(`[PersistentStorage] Error retrieving data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove specific data
   * @param {string} key - Storage key
   */
  static async removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.info(`[PersistentStorage] Removed data for key: ${key}`);
    } catch (error) {
      console.error(`[PersistentStorage] Error removing data for key ${key}:`, error);
    }
  }

  /**
   * Save registration form data with step tracking
   * @param {object} formData - Form data to save
   * @param {number} currentStep - Current step number
   * @param {number} totalSteps - Total number of steps
   */
  static async saveRegistrationData(formData, currentStep, totalSteps) {
    const registrationData = {
      formData,
      currentStep,
      totalSteps,
      lastUpdated: Date.now()
    };

    await this.saveData(STORAGE_KEYS.REGISTRATION_DATA, registrationData);
    await this.saveData(STORAGE_KEYS.REGISTRATION_PROGRESS, {
      currentStep,
      totalSteps,
      percentage: Math.round((currentStep / totalSteps) * 100)
    });
  }

  /**
   * Get saved registration data
   * @returns {object|null} - Registration data with progress info
   */
  static async getRegistrationData() {
    return await this.getData(STORAGE_KEYS.REGISTRATION_DATA);
  }

  /**
   * Get registration progress
   * @returns {object|null} - Progress information
   */
  static async getRegistrationProgress() {
    return await this.getData(STORAGE_KEYS.REGISTRATION_PROGRESS);
  }

  /**
   * Save form draft for any form
   * @param {string} formId - Unique form identifier
   * @param {object} formData - Form data to save
   */
  static async saveFormDraft(formId, formData) {
    try {
      const existingDrafts = await this.getData(STORAGE_KEYS.FORM_DRAFTS) || {};
      existingDrafts[formId] = {
        data: formData,
        lastUpdated: Date.now()
      };
      
      await this.saveData(STORAGE_KEYS.FORM_DRAFTS, existingDrafts);
      console.info(`[PersistentStorage] Saved draft for form: ${formId}`);
    } catch (error) {
      console.error(`[PersistentStorage] Error saving form draft:`, error);
    }
  }

  /**
   * Get form draft
   * @param {string} formId - Unique form identifier
   * @returns {object|null} - Form draft data
   */
  static async getFormDraft(formId) {
    try {
      const drafts = await this.getData(STORAGE_KEYS.FORM_DRAFTS) || {};
      return drafts[formId]?.data || null;
    } catch (error) {
      console.error(`[PersistentStorage] Error getting form draft:`, error);
      return null;
    }
  }

  /**
   * Remove form draft
   * @param {string} formId - Unique form identifier
   */
  static async removeFormDraft(formId) {
    try {
      const drafts = await this.getData(STORAGE_KEYS.FORM_DRAFTS) || {};
      delete drafts[formId];
      await this.saveData(STORAGE_KEYS.FORM_DRAFTS, drafts);
      console.info(`[PersistentStorage] Removed draft for form: ${formId}`);
    } catch (error) {
      console.error(`[PersistentStorage] Error removing form draft:`, error);
    }
  }

  /**
   * Update last activity timestamp
   */
  static async updateLastActivity() {
    await this.saveData(STORAGE_KEYS.LAST_ACTIVITY, Date.now(), 1); // 1 hour expiry
  }

  /**
   * Check if there's recoverable data
   * @returns {object} - Information about recoverable data
   */
  static async checkRecoverableData() {
    const registrationData = await this.getRegistrationData();
    const formDrafts = await this.getData(STORAGE_KEYS.FORM_DRAFTS) || {};
    const lastActivity = await this.getData(STORAGE_KEYS.LAST_ACTIVITY);

    return {
      hasRegistrationData: !!registrationData,
      registrationProgress: registrationData ? {
        currentStep: registrationData.currentStep,
        totalSteps: registrationData.totalSteps,
        percentage: Math.round((registrationData.currentStep / registrationData.totalSteps) * 100)
      } : null,
      formDrafts: Object.keys(formDrafts),
      lastActivity: lastActivity ? new Date(lastActivity).toLocaleString() : null,
      canRecover: !!(registrationData || Object.keys(formDrafts).length > 0)
    };
  }

  /**
   * Clear all temporary data
   */
  static async clearAllTempData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.info('[PersistentStorage] Cleared all temporary data');
    } catch (error) {
      console.error('[PersistentStorage] Error clearing temporary data:', error);
    }
  }

  /**
   * Clear expired data (run periodically)
   */
  static async cleanupExpiredData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        await this.getData(key); // This will auto-remove expired data
      }
      console.info('[PersistentStorage] Cleanup completed');
    } catch (error) {
      console.error('[PersistentStorage] Error during cleanup:', error);
    }
  }

  /**
   * Get storage statistics
   * @returns {object} - Storage usage information
   */
  static async getStorageStats() {
    try {
      const stats = {
        totalKeys: 0,
        totalSize: 0,
        keyDetails: {}
      };

      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          stats.totalKeys++;
          stats.totalSize += data.length;
          stats.keyDetails[key] = {
            size: data.length,
            lastModified: JSON.parse(data).timestamp || 'Unknown'
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('[PersistentStorage] Error getting storage stats:', error);
      return null;
    }
  }
}

export default PersistentStorage;
export { STORAGE_KEYS };