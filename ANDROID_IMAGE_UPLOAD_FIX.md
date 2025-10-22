# Android Image Upload Fix

## Problem
Images were not being uploaded to the server on Android devices, while the same code worked correctly on iOS devices.

## Root Causes

### 1. **Content URI Handling**
- Android uses `content://` URIs from the Photo Picker and DocumentPicker
- These URIs cannot be directly sent to the server via FormData
- iOS uses `file://` URIs which work directly with FormData

### 2. **Incomplete File Metadata**
- Android's image picker sometimes returns incomplete file information
- Missing or incorrect MIME types, file names, and extensions
- Server requires proper MIME types to accept the file upload

### 3. **FormData Serialization**
- React Native's FormData implementation on Android needs specific file object structure
- Must include: `uri`, `type`, and `name` properties
- Content-Type header must not be set manually (let axios handle it)

## Solutions Implemented

### 1. **Enhanced Content URI Conversion** (`vendorMenuItems.js`)
```javascript
// Converts Android content:// URIs to file:// URIs
const convertAndroidContentUri = async (imageFile) => {
  // Copy content:// file to cache directory with file:// URI
  // Extract proper file extension and MIME type
  // Return complete file object with all metadata
}
```

**Key improvements:**
- Better file extension detection from multiple sources (name, fileName, URI)
- Proper MIME type mapping based on file extension
- Enhanced logging for debugging
- Fallback handling if conversion fails

### 2. **Improved File Object Structure** (`vendorMenuItems.js`)
```javascript
// Android-specific file object for FormData
const fileObj = {
  uri: processedImageFile.uri,        // file:// URI (converted from content://)
  type: mimeType,                      // Proper MIME type (image/jpeg, image/png, etc.)
  name: fileName,                      // Descriptive filename with timestamp
};
```

**Key improvements:**
- Always use timestamped filenames to avoid conflicts
- Proper MIME type detection and fallback
- Consistent naming convention across create and update operations
- Added comprehensive logging for debugging

### 3. **Enhanced Image Picker** (`permissions.js`)
```javascript
// safeImagePicker now returns complete file metadata
return {
  uri: asset.uri,
  type: fileType,        // Proper MIME type instead of generic 'image/*'
  name: fileName,        // Descriptive filename
  size: asset.size || 0,
};
```

**Key improvements:**
- Better MIME type detection from URI and file extension
- Consistent file naming across all picker methods
- Added logging for debugging
- Handles Android Photo Picker (API 33+) and DocumentPicker (older versions)

### 4. **FormData Configuration**
```javascript
const config = {
  timeout: 180000,
  headers: {
    'Accept': 'application/json',
    // DO NOT set Content-Type - let axios handle multipart/form-data boundary
  },
  transformRequest: [(data, headers) => data], // Let native handle serialization
};
```

**Key improvements:**
- Removed manual Content-Type header setting
- Added explicit transformRequest to prevent axios from modifying FormData
- Increased timeout for large file uploads
- Added request logging for debugging

## Files Modified

1. **`/lib/api/vendorMenuItems.js`**
   - Enhanced `convertAndroidContentUri()` function
   - Improved file object structure for both create and update operations
   - Added comprehensive logging
   - Better error handling

2. **`/lib/utils/permissions.js`**
   - Enhanced `safeImagePicker()` function
   - Better MIME type detection
   - Improved file metadata extraction
   - Added logging for debugging

## Testing Instructions

### On Android Device:

1. **Test Image Upload (Create)**
   ```
   1. Go to Food Items screen
   2. Tap "Add Item" button
   3. Tap on image placeholder
   4. Select "Gallery" or "Camera"
   5. Pick/capture an image
   6. Fill in other required fields
   7. Tap "Save"
   8. Check console logs for:
      - "🖼️ Preparing image for upload..."
      - "🤖 Android file object for FormData:"
      - "✅ Image appended to FormData"
      - "📡 Sending create menu item request..."
   ```

2. **Test Image Upload (Update)**
   ```
   1. Go to Food Items screen
   2. Tap on an existing item to edit
   3. Tap on the image to change it
   4. Select a new image
   5. Tap "Update"
   6. Check console logs for similar messages
   ```

3. **Verify on Server**
   ```
   - Check that the image appears in the menu item list
   - Verify the image URL is valid and accessible
   - Confirm the image displays correctly
   ```

## Debug Logs to Monitor

### Successful Upload Flow:
```
🖼️ Preparing image for upload...
🤖 Converting Android content:// URI to file:// URI
🤖 Original URI: content://...
🤖 Converted to file:// URI: file://...
🤖 File extension: jpg
🤖 MIME type: image/jpeg
🤖 File size: 123456
🖼️ Processed image file: { uri: "file://...", type: "image/jpeg", name: "menu_item_...", size: 123456 }
🤖 Android file object for FormData: { uri: "file://...", type: "image/jpeg", name: "menu_item_..." }
✅ Image appended to FormData
📡 Sending create menu item request...
📡 Request URL: /vendor/menu-items
📡 Platform: android
✅ Menu item created successfully
```

### Error Indicators:
```
❌ Error converting Android content URI: ...
❌ Error creating menu item: ...
```

## Common Issues and Solutions

### Issue 1: Still Getting "Image Required" Error
**Solution:** Check that the image picker is returning a valid file object with `uri`, `type`, and `name` properties.

### Issue 2: Server Returns 500 Error
**Solution:** Check server logs for file upload errors. Ensure server accepts `multipart/form-data` with proper MIME types.

### Issue 3: Image Appears Corrupted
**Solution:** Verify the file copy operation in `convertAndroidContentUri()` is successful. Check cache directory permissions.

### Issue 4: Timeout Errors
**Solution:** Increase timeout in config or reduce image quality in picker options.

## Additional Notes

1. **Cache Directory:** Android temporary files are stored in `expo-file-system` cache directory and are automatically cleaned up by the system.

2. **File Naming:** Using timestamp-based naming (`menu_item_${Date.now()}.jpg`) prevents filename conflicts.

3. **MIME Types:** Proper MIME type detection is critical - the server may reject files with incorrect or generic MIME types.

4. **Content-Type Header:** Never set Content-Type header manually for FormData - axios must auto-detect and set the multipart boundary.

5. **Logging:** All debug logs are prefixed with emojis for easy identification:
   - 🤖 = Android-specific operations
   - 🖼️ = Image processing
   - 📡 = Network requests
   - ✅ = Success
   - ❌ = Error

## Verification Checklist

- [ ] Android device can pick images from gallery
- [ ] Android device can capture images from camera
- [ ] Images upload successfully on create operation
- [ ] Images upload successfully on update operation
- [ ] Server receives and stores images correctly
- [ ] Images display correctly in the app
- [ ] iOS functionality still works (regression test)
- [ ] Console logs show proper file metadata
- [ ] No timeout errors on slow connections

## Support

If issues persist after applying this fix:

1. Check console logs for detailed error messages
2. Verify Android version and API level
3. Test on multiple Android devices
4. Check server-side file upload configuration
5. Ensure network connectivity is stable
6. Verify file size limits on server
