# Test Image Upload Feature

## 📱 **Feature Added**

A dedicated **Test Image Upload** screen has been added to help you debug and verify image upload functionality on Android.

## 🎯 **Purpose**

This screen allows you to test the basic image upload API (`/store-img`) independently to:
- Verify the server is receiving images correctly
- Debug FormData transmission issues
- Test MIME type handling
- Validate Android-specific image upload fixes

## 📍 **How to Access**

1. Open the app and go to the **Dashboard**
2. Scroll down to the "Manage Your Business" section
3. Look for the **"🧪 Test Upload"** card with a **DEBUG** badge
4. Tap it to open the test upload screen

## 🧪 **How to Use**

### Step 1: Select an Image
- Tap the image placeholder
- Choose "Gallery" or "Camera"
- Select an image from your device

### Step 2: Review Image Details
The screen will show:
- **File Name**: e.g., `image_1234567890.jpg`
- **MIME Type**: e.g., `image/jpeg` (should NOT be just `"image"`)
- **File Size**: in KB
- **URI Path**: file location

### Step 3: Upload to Test API
- Tap the **"Upload to Test Endpoint"** button
- Wait for the upload to complete
- Review the results

## ✅ **Success Indicators**

If the upload works correctly, you'll see:

```
✅ Upload Successful

Upload successful!

Response Data:
{
  "success": true,
  "message": "Image uploaded successfully",
  ...
}
```

**Key things to verify:**
- ✅ MIME type shows `image/jpeg` or `image/png` (NOT just `"image"`)
- ✅ Upload completes without `ERR_NETWORK` error
- ✅ Success message appears
- ✅ Response data is displayed

## ❌ **Error Indicators**

If upload fails, you'll see:

```
❌ Upload Failed

Error: Network Error / Invalid MIME type / etc.

Error Details:
{...}
```

**Common issues:**
- ❌ MIME type is `"image"` instead of `"image/jpeg"` → Image picker issue
- ❌ `ERR_NETWORK` → Network/FormData configuration issue
- ❌ `Content-Type: application/x-www-form-urlencoded` → FormData not detected

## 🔍 **Debug Information Shown**

The screen displays technical details:
- **API Endpoint**: `/store-img`
- **HTTP Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Field Name**: `asset` (as per your API spec)
- **Platform**: `android` or `ios`

## 📝 **Console Logs to Watch**

When you upload, check the console for:

### **Success Flow:**
```
📸 Selected image for test upload: { type: "image/jpeg", ... }
🧪 Testing image upload...
🧪 Image file object: { uri: "file://...", type: "image/jpeg", ... }
📦 FormData created with asset field
📦 FormData detected - removing Content-Type header
🗑️ Removing header: Content-Type
🔄 TransformRequest called for FormData
✅ FormData configuration complete
✅ Upload test successful: { success: true, ... }
```

### **Error Flow:**
```
❌ Upload test failed: Network Error
❌ Error details: { message: "...", status: undefined }
```

## 🎨 **UI Features**

- **Clean Interface**: Simple, focused design for testing
- **Image Preview**: See the selected image before upload
- **Loading State**: Shows spinner during upload
- **Result Display**: Clear success/error messages
- **Debug Info**: Technical details for troubleshooting
- **Badge**: "DEBUG" badge to identify it as a test tool

## 🔧 **Implementation Details**

### File Location:
```
/Users/rohit/Desktop/Softwares/Bells/vendor/app/business/test-upload.jsx
```

### API Integration:
- Uses the same `api` instance from `lib/api/api.js`
- Benefits from all FormData fixes and interceptors
- Uses `showImagePickerOptions` for consistency
- Sends image with field name `asset` as per your API spec

### Dashboard Integration:
- Added as a menu item with special styling
- Has a "DEBUG" badge for easy identification
- Colored differently (`#FF6B35`) to stand out

## 🚀 **Next Steps**

1. **Open the Test Upload screen** from the dashboard
2. **Select a NEW image** (don't reuse cached ones)
3. **Watch the console logs** for FormData detection
4. **Verify the upload succeeds** with proper MIME type
5. **If successful**, the same fix should work for regular menu item uploads

## 🎯 **What This Proves**

If the test upload works:
- ✅ Image picker returns valid file objects
- ✅ MIME types are correct
- ✅ FormData is properly constructed
- ✅ Network configuration is correct
- ✅ Server accepts the upload

Then the regular food item upload should also work!

## 🗑️ **Removing the Feature**

Once testing is complete, you can remove it by:

1. **Delete the file:**
   ```
   app/business/test-upload.jsx
   ```

2. **Remove from Dashboard:**
   - Open `app/components/business/Dashboard.jsx`
   - Remove the "test-upload" item from `menuItems` array
   - Remove the badge styles if not needed elsewhere

## 📊 **Comparison with Regular Upload**

| Aspect | Test Upload | Regular Menu Item Upload |
|--------|------------|--------------------------|
| Endpoint | `/store-img` | `/vendor/menu-items` |
| Field Name | `asset` | `image` |
| Additional Data | None | name, price, description, etc. |
| Purpose | Testing only | Production use |
| Complexity | Simple | Complex with validation |

The test upload is simpler, making it easier to isolate and fix image upload issues!

---

**Happy Testing!** 🎉
