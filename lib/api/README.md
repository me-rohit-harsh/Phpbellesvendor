# PHPBells Vendor API

This directory contains the API configuration and functions for the PHPBells Vendor application.

## Structure

```
lib/api/
├── api.js              # Main axios instance with interceptors
├── auth.js             # Authentication API functions
├── vendor.js           # Vendor-related API functions
├── errorHandler.js     # Error handling utilities
├── index.js            # Main exports
├── test.js             # Test examples and usage
└── README.md           # This file
```

## Configuration

The API is configured to work with the PHPBells backend at `https://phpadmin.phpbells.com/api`. The base URL can be overridden using the `API_BASE_URL` environment variable in your Expo configuration.

### Features

- **Automatic Authentication**: JWT tokens are automatically attached to requests
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **File Uploads**: Support for multipart/form-data file uploads
- **Request/Response Interceptors**: Automatic token injection and error processing

## Usage

### Import the API functions

```javascript
import { 
  registerVendor, 
  requestOTP, 
  verifyOTP,
  APIError,
  isValidationError,
  formatValidationErrors 
} from '../lib/api';
```

### Authentication

#### Request OTP
```javascript
try {
  const response = await requestOTP({
    phone: '+1234567890', // or email: 'user@example.com'
  });
  console.log('OTP sent:', response);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### Verify OTP
```javascript
try {
  const response = await verifyOTP('+1234567890', '123456');
  // Store the token
  await AsyncStorage.setItem('auth_token', response.token);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Vendor Registration

The vendor registration API matches the curl command structure provided:

```javascript
const vendorData = {
  name: "John Doe",
  restaurant_name: "John's Cafe",
  vendor_type_id: "1",
  food_types: ["1", "2"], // Array of food type IDs
  description: "A cozy cafe serving delicious food.",
  gst_no: "GST1234567890",
  fassai_license_no: "FSSAI12345",
  
  // File objects from image picker
  id_proof: {
    uri: 'file://path/to/id_proof.jpg',
    type: 'image/jpeg',
    name: 'id_proof.jpg'
  },
  profile_photo: {
    uri: 'file://path/to/profile_photo.jpg',
    type: 'image/jpeg',
    name: 'profile_photo.jpg'
  },
  logo: {
    uri: 'file://path/to/logo.jpg',
    type: 'image/jpeg',
    name: 'logo.jpg'
  },
  banner_image: {
    uri: 'file://path/to/banner_image.jpg',
    type: 'image/jpeg',
    name: 'banner_image.jpg'
  },
  gst_certificate: {
    uri: 'file://path/to/gst_certificate.jpg',
    type: 'image/jpeg',
    name: 'gst_certificate.jpg'
  },
  shop_license: {
    uri: 'file://path/to/shop_license.jpg',
    type: 'image/jpeg',
    name: 'shop_license.jpg'
  }
};

try {
  const response = await registerVendor(vendorData);
  console.log('Registration successful:', response);
} catch (error) {
  if (error instanceof APIError) {
    if (isValidationError(error)) {
      const validationErrors = formatValidationErrors(error.data);
      console.error('Validation errors:', validationErrors);
    } else {
      console.error('API Error:', error.message);
    }
  }
}
```

### Error Handling

The API includes comprehensive error handling:

```javascript
import { 
  APIError, 
  isNetworkError, 
  isAuthError, 
  isValidationError,
  formatValidationErrors,
  getErrorMessage 
} from '../lib/api';

try {
  const response = await someAPICall();
} catch (error) {
  if (error instanceof APIError) {
    if (isNetworkError(error)) {
      Alert.alert('Network Error', 'Please check your internet connection');
    } else if (isAuthError(error)) {
      Alert.alert('Authentication Error', 'Please login again');
      // Redirect to login
    } else if (isValidationError(error)) {
      const validationErrors = formatValidationErrors(error.data);
      Alert.alert('Validation Error', Object.values(validationErrors).join('\\n'));
    } else {
      Alert.alert('Error', getErrorMessage(error.status));
    }
  }
}
```

## API Endpoints

### Authentication
- `POST /request-otp` - Request OTP for phone/email
- `POST /verify-otp` - Verify OTP and get auth token

### Vendor
- `POST /vendor/register` - Register new vendor (requires auth)
- `GET /vendor/profile` - Get vendor profile (requires auth)
- `PUT /vendor/profile` - Update vendor profile (requires auth)

## File Upload Requirements

When uploading files, ensure they are in the correct format:

```javascript
{
  uri: 'file://path/to/file.jpg',    // Local file URI
  type: 'image/jpeg',                // MIME type
  name: 'filename.jpg'               // File name
}
```

## Environment Configuration

Add to your `app.json` or environment configuration:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "https://phpadmin.phpbells.com/api"
    }
  }
}
```

## Dependencies

Make sure these packages are installed:

```bash
npm install axios @react-native-async-storage/async-storage expo-constants
```

## Testing

See `test.js` for example usage and testing scenarios.

## Curl Command Equivalent

The vendor registration API implements the following curl command:

```bash
curl --location 'https://phpadmin.phpbells.com/api/vendor/register' \\
--header 'Authorization: Bearer YOUR_TOKEN' \\
--form 'name="John Doe"' \\
--form 'restaurant_name="John'\''s Cafe"' \\
--form 'vendor_type_id="1"' \\
--form 'food_types[]="1"' \\
--form 'food_types[]="2"' \\
--form 'id_proof=@"/path/to/id_proof.png"' \\
--form 'profile_photo=@"/path/to/profile_photo.png"' \\
--form 'logo=@"/path/to/logo.png"' \\
--form 'banner_image=@"/path/to/banner_image.png"' \\
--form 'description="A cozy cafe serving delicious food."' \\
--form 'gst_no="GST1234567890"' \\
--form 'gst_certificate=@"/path/to/gst_certificate.png"' \\
--form 'fassai_license_no="FSSAI12345"' \\
--form 'shop_license=@"/path/to/shop_license.png"'
```