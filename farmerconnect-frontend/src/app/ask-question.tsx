import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';

import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = 'http://172.51.137.206:5000/api';

// ---------------- AVAILABLE CROPS ----------------

const crops = [
  'Rice',
  'Ragi',
  'Tomato',
  'Coconut',
  'Sugarcane',
  'Maize',
  'Other',
];

// ---------------- MAIN SCREEN ----------------

export default function AskQuestionScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------- IMAGE PICKER ----------------

  const pickImages = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert(
        'Image Limit',
        'You can upload a maximum of 3 images.'
      );
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow gallery access to upload crop images.'
        );
        return;
      }

      const remainingImages = 3 - selectedImages.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingImages,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);

        setSelectedImages(previous =>
          [...previous, ...newImages].slice(0, 3)
        );
      }
    } catch (error) {
      console.log('Image picker error:', error);

      Alert.alert(
        'Error',
        'Unable to select images. Please try again.'
      );
    }
  };

  // ---------------- REMOVE IMAGE ----------------

  const removeImage = (index: number) => {
    setSelectedImages(previous =>
      previous.filter((_, i) => i !== index)
    );
  };

  // ---------------- SUBMIT QUESTION ----------------

  const handleSubmit = async () => {
  if (!title.trim()) {
    Alert.alert('Missing Details', 'Please enter a question title.');
    return;
  }

  if (!description.trim()) {
    Alert.alert('Missing Details', 'Please describe your farming problem.');
    return;
  }

  if (!selectedCrop) {
    Alert.alert('Missing Details', 'Please select a crop.');
    return;
  }

  try {
    setIsSubmitting(true);

    // Get authentication token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      Alert.alert('Session Expired', 'Please login again.');
      router.replace('/');
      return;
    }

    // Create multipart form data
    const formData = new FormData();

    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('crop', selectedCrop);

    // Attach selected images
    for (let i = 0; i < selectedImages.length; i++) {
      const uri = selectedImages[i];

      const filename = uri.split('/').pop() || `image_${i}.jpg`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();

        formData.append('images', blob, filename);
      } else {
        formData.append(
          'images',
          {
            uri,
            name: filename,
            type: 'image/jpeg',
          } as any
        );
      }
    }

    // Send question to backend
    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to submit question.');
    }

    Alert.alert(
      'Success',
      'Your question has been posted successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );

    // Clear form
    setTitle('');
    setDescription('');
    setSelectedCrop('');
    setSelectedImages([]);

  } catch (error: any) {
    console.log('Submit question error:', error);

    Alert.alert(
      'Submission Failed',
      error.message || 'Something went wrong. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};
  // ---------------- UI ----------------

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text style={styles.heading}>
            Ask a Question
          </Text>

          <Text style={styles.subtitle}>
            Get advice from fellow farmers and farming experts.
          </Text>

        </View>

        {/* FORM */}

        <View style={styles.form}>

          {/* QUESTION TITLE */}

          <Text style={styles.label}>
            Question Title *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Why are my tomato leaves turning yellow?"
            placeholderTextColor="#929D92"
            value={title}
            onChangeText={setTitle}
            maxLength={150}
          />

          {/* DESCRIPTION */}

          <Text style={styles.label}>
            Describe Your Problem *
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain your farming problem in detail..."
            placeholderTextColor="#929D92"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            maxLength={2000}
          />

          {/* CROP SELECTION */}

          <Text style={styles.label}>
            Select Crop *
          </Text>

          <View style={styles.cropContainer}>

            {crops.map(crop => (
              <TouchableOpacity
                key={crop}
                style={[
                  styles.cropButton,
                  selectedCrop === crop && styles.selectedCrop,
                ]}
                onPress={() => setSelectedCrop(crop)}
              >

                <Text
                  style={[
                    styles.cropText,
                    selectedCrop === crop &&
                      styles.selectedCropText,
                  ]}
                >
                  {crop}
                </Text>

              </TouchableOpacity>
            ))}

          </View>

          {/* IMAGE UPLOAD */}

          <View style={styles.sectionHeader}>

            <Text style={styles.label}>
              Add Photos
            </Text>

            <Text style={styles.imageCount}>
              {selectedImages.length}/3
            </Text>

          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImages}
          >

            <Text style={styles.uploadIcon}>
              ＋
            </Text>

            <Text style={styles.uploadText}>
              Add Crop Images
            </Text>

          </TouchableOpacity>

          {/* IMAGE PREVIEWS */}

          {selectedImages.length > 0 && (

            <View style={styles.imagePreviewContainer}>

              {selectedImages.map((uri, index) => (

                <View
                  key={`${uri}-${index}`}
                  style={styles.imagePreviewWrapper}
                >

                  <Image
                    source={{ uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >

                    <Text style={styles.removeImageText}>
                      ✕
                    </Text>

                  </TouchableOpacity>

                </View>

              ))}

            </View>

          )}

          {/* VOICE NOTE */}

          <Text style={styles.label}>
            Voice Note
          </Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Voice recording will be implemented next.'
              )
            }
          >

            <Text style={styles.uploadText}>
              🎤 Record Voice Note
            </Text>

          </TouchableOpacity>

          {/* SUBMIT BUTTON */}

         <TouchableOpacity
  style={[
    styles.submitButton,
    isSubmitting && { opacity: 0.6 },
  ]}
  onPress={handleSubmit}
  disabled={isSubmitting}
>
  <Text style={styles.submitText}>
    {isSubmitting ? 'Submitting...' : 'Submit Question →'}
  </Text>
</TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F8F2',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // HEADER

  header: {
    backgroundColor: '#246B45',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#E1F0E5',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },

  // FORM

  form: {
    width: '100%',
    maxWidth: 850,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263B2D',
    marginTop: 20,
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DC',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    color: '#263B2D',
  },

  textArea: {
    height: 130,
    textAlignVertical: 'top',
  },

  // CROP SELECTION

  cropContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  cropButton: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C9D8CA',
    backgroundColor: '#FFFFFF',
  },

  selectedCrop: {
    backgroundColor: '#246B45',
    borderColor: '#246B45',
  },

  cropText: {
    color: '#344B39',
    fontSize: 13,
  },

  selectedCropText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // IMAGE UPLOAD

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  imageCount: {
    color: '#66816A',
    fontSize: 13,
  },

  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B8CEBC',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  uploadIcon: {
    fontSize: 20,
    color: '#246B45',
    fontWeight: 'bold',
  },

  uploadText: {
    color: '#246B45',
    fontWeight: '600',
    fontSize: 14,
  },

  // IMAGE PREVIEW

  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 15,
  },

  imagePreviewWrapper: {
    position: 'relative',
  },

  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5EBE1',
  },

  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#D32F2F',
    width: 25,
    height: 25,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeImageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // SUBMIT BUTTON

  submitButton: {
    backgroundColor: '#246B45',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 35,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

});