import { useState, useEffect, useCallback, useRef } from 'react';
import PersistentStorage from '../lib/storage/persistentStorage';
import { ToastManager } from '../app/components/NotificationToast';

/**
 * Custom hook for auto-saving form data
 * @param {object} formData - Current form data
 * @param {string} formId - Unique identifier for the form
 * @param {object} options - Configuration options
 * @returns {object} - Auto-save utilities
 */
const useAutoSave = (formData, formId, options = {}) => {
  const {
    interval = 3000, // Auto-save every 3 seconds
    enabled = true,
    onSave = null,
    onError = null,
    debounceDelay = 1000 // Debounce user input
  } = options;

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Save form data to persistent storage
   */
  const saveData = useCallback(async (forceImmediate = false) => {
    if (!enabled || !formData || !formId) return;

    try {
      // Don't save if data hasn't changed
      const currentDataString = JSON.stringify(formData);
      if (lastSavedDataRef.current === currentDataString) {
        return;
      }

      await PersistentStorage.saveFormDraft(formId, formData);
      lastSavedDataRef.current = currentDataString;
      
      // Show success notification for manual saves
      if (forceImmediate) {
        ToastManager.success('Data saved successfully', 2000);
      }
      
      console.log(`[AutoSave] Saved data for form: ${formId}`);
      onSave?.(formData);
    } catch (error) {
      console.error(`[AutoSave] Error saving form data:`, error);
      
      // Show error notification
      ToastManager.error('Save failed, please try again', 3000);
      
      onError?.(error);
    }
  }, [formData, formId, enabled, onSave, onError]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveData();
    }, debounceDelay);
  }, [saveData, debounceDelay]);

  /**
   * Force save immediately
   */
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveData();
  }, [saveData]);

  /**
   * Load saved data
   */
  const loadSavedData = useCallback(async () => {
    if (!formId) return null;

    try {
      const savedData = await PersistentStorage.getData(formId);
      if (savedData) {
        console.log(`[AutoSave] Loaded saved data for form: ${formId}`, savedData);
        ToastManager.info('Previous data restored successfully', 2500);
        return savedData;
      }
      return null;
    } catch (error) {
      console.error(`[AutoSave] Error loading saved data:`, error);
      ToastManager.error('Data recovery failed', 3000);
      onError?.(error);
      return null;
    }
  }, [formId, onError]);

  /**
   * Clear saved data
   */
  const clearSavedData = useCallback(async () => {
    try {
      await PersistentStorage.removeFormDraft(formId);
      lastSavedDataRef.current = null;
      console.log(`[AutoSave] Cleared saved data for form: ${formId}`);
    } catch (error) {
      console.error(`[AutoSave] Error clearing saved data:`, error);
    }
  }, [formId]);

  // Set up auto-save on form data changes (debounced)
  useEffect(() => {
    if (!enabled || isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    debouncedSave();
  }, [formData, debouncedSave, enabled]);

  // Set up periodic auto-save
  useEffect(() => {
    if (!enabled || !interval) return;

    intervalRef.current = setInterval(() => {
      saveData();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [saveData, interval, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    saveData: forceSave,
    loadSavedData,
    clearSavedData,
    isAutoSaveEnabled: enabled
  };
};

export default useAutoSave;