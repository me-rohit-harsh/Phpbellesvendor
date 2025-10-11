import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import useImagePicker from '../../hooks/useImagePicker';

export default function ImagePickerDemo() {
  const { pickImage, imageUri, resetImage } = useImagePicker();
  const [status, setStatus] = useState('Idle');

  const handlePick = async () => {
    setStatus('Opening picker...');
    const result = await pickImage();
    if (result?.canceled) {
      setStatus('Canceled');
    } else if (result?.uri) {
      setStatus('Selected');
    } else {
      setStatus('Idle');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Picker Demo</Text>
      <Text style={styles.subtitle}>Android 13+ uses native Photo Picker. Others use expo-image-picker.</Text>

      <View style={styles.previewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>No image selected</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handlePick}>
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={resetImage}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>Status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: '#020A66' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  previewBox: { width: 240, height: 240, borderRadius: 12, backgroundColor: '#f4f4f4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  placeholder: { color: '#999' },
  image: { width: '100%', height: '100%', borderRadius: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  primary: { backgroundColor: '#020A66' },
  secondary: { backgroundColor: '#999' },
  buttonText: { color: '#fff', fontWeight: '600' },
  status: { marginTop: 12, color: '#333' },
});