import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

const API_URL = 'http://172.51.137.206:5000/api';

const districts = [
  'Bagalkote',
  'Ballari',
  'Belagavi',
  'Bengaluru Rural',
  'Bengaluru Urban',
  'Bidar',
  'Chamarajanagara',
  'Chikkaballapura',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppala',
  'Mandya',
  'Mysuru',
  'Raichur',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayapura',
  'Vijayanagara',
  'Yadgir',
];

const cropOptions = [
  'Rice',
  'Ragi',
  'Maize',
  'Wheat',
  'Sugarcane',
  'Cotton',
  'Groundnut',
  'Coconut',
  'Arecanut',
  'Coffee',
  'Pepper',
  'Turmeric',
  'Tomato',
  'Onion',
  'Other',
];

export default function ProfileScreen() {
    const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string | string[];
  }>();

  const phone = Array.isArray(params.phone)
    ? params.phone[0]
    : params.phone ?? '';

  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [districtModal, setDistrictModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search districts
  const filteredDistricts = districts.filter((item) =>
    item.toLowerCase().includes(districtSearch.trim().toLowerCase())
  );

  // Select or deselect crops
  const toggleCrop = (crop: string) => {
    setSelectedCrops((previous) =>
      previous.includes(crop)
        ? previous.filter((item) => item !== crop)
        : [...previous, crop]
    );

    setMessage('');
  };

  // Open district dropdown
  const openDistrictModal = () => {
    setDistrictSearch('');
    setDistrictModal(true);
  };

  // Select district
  const selectDistrict = (item: string) => {
    setDistrict(item);
    setDistrictModal(false);
    setDistrictSearch('');
    setMessage('');
  };

  // Complete profile
  const handleCompleteProfile = async () => {
  if (!name.trim()) {
    setMessage('Please enter your full name.');
    return;
  }

  if (!district) {
    setMessage('Please select your district.');
    return;
  }

  if (!village.trim()) {
    setMessage('Please enter your village.');
    return;
  }

  if (selectedCrops.length === 0) {
    setMessage('Please select at least one crop.');
    return;
  }

  if (!phone) {
    setMessage('Phone number is missing. Please login again.');
    return;
  }

  try {
    setIsSubmitting(true);
    setMessage('Saving your profile...');

    // Get JWT token saved during OTP verification
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      setMessage('Authentication expired. Please login again.');
      router.replace('/');
      return;
    }

    // Send profile information to backend
    const response = await fetch(
      `${API_URL}/auth/complete-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          district,
          crops: selectedCrops,
          profileImage: '',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || 'Unable to complete profile.');
      return;
    }

    // Save profile locally for frontend use
    const farmerProfile = {
      name: name.trim(),
      phone,
      district,
      village: village.trim(),
      crops: selectedCrops,
    };

    await AsyncStorage.setItem(
      'farmerProfile',
      JSON.stringify(farmerProfile)
    );

    setMessage('Profile created successfully!');

    // Navigate to home screen
    router.replace('/');

  } catch (error) {
    console.error('Profile completion error:', error);
    setMessage('Unable to connect to the server.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🌱</Text>
          </View>

          <Text style={styles.appName}>Krushika Dhara</Text>

          <Text style={styles.tagline}>
            Connecting Farmers, Growing Together
          </Text>
        </View>

        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>
            Create Your Farmer Profile
          </Text>

          <Text style={styles.description}>
            Tell us about yourself and your farming activities.
          </Text>
        </View>

        {/* Profile Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          {/* Verified Phone */}
          <Text style={styles.label}>
            Verified Mobile Number
          </Text>

          <View style={styles.phoneContainer}>
            <Text style={styles.phoneText}>
              +91 {phone}
            </Text>

            <Text style={styles.verifiedText}>
              ✓ Verified
            </Text>
          </View>

          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#999999"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setMessage('');
            }}
          />

          {/* District */}
          <Text style={styles.label}>District *</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={openDistrictModal}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownText,
                !district && styles.placeholder,
              ]}
            >
              {district || 'Select your district'}
            </Text>

            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {/* Village */}
          <Text style={styles.label}>Village Name *</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your village name"
            placeholderTextColor="#999999"
            value={village}
            onChangeText={(text) => {
              setVillage(text);
              setMessage('');
            }}
          />

          {/* Farming Information */}
          <Text style={styles.sectionTitle}>
            Farming Information
          </Text>

          <Text style={styles.label}>
            Select Crops You Grow *
          </Text>

          <Text style={styles.helperText}>
            You can select multiple crops.
          </Text>

          {/* Crop Selection */}
          <View style={styles.cropContainer}>
            {cropOptions.map((crop) => {
              const selected = selectedCrops.includes(crop);

              return (
                <TouchableOpacity
                  key={crop}
                  style={[
                    styles.cropChip,
                    selected && styles.selectedCrop,
                  ]}
                  onPress={() => toggleCrop(crop)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cropText,
                      selected && styles.selectedCropText,
                    ]}
                  >
                    {selected ? '✓ ' : '+ '}
                    {crop}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Validation Message */}
          {message !== '' && (
            <Text style={styles.message}>
              {message}
            </Text>
          )}

          {/* Complete Profile */}
          <TouchableOpacity
  style={[
    styles.completeButton,
    isSubmitting && { opacity: 0.6 },
  ]}
  onPress={handleCompleteProfile}
  disabled={isSubmitting}
  activeOpacity={0.8}
>
  <Text style={styles.buttonText}>
    {isSubmitting ? 'Saving Profile...' : 'Complete Profile'}
  </Text>
</TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Made for Farmers ❤️
        </Text>
      </ScrollView>

      {/* District Selection Modal */}
      <Modal
        visible={districtModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDistrictModal(false);
          setDistrictSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Select Your District
            </Text>

            {/* District Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search district..."
              placeholderTextColor="#999999"
              value={districtSearch}
              onChangeText={setDistrictSearch}
              autoCorrect={false}
            />

            {/* Filtered District List */}
            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No district found.
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.districtItem}
                  onPress={() => selectDistrict(item)}
                >
                  <Text style={styles.districtText}>
                    {item}
                  </Text>

                  {district === item && (
                    <Text style={styles.selectedMark}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setDistrictModal(false);
                setDistrictSearch('');
              }}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F1',
  },

  content: {
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logoCircle: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#DFF0D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  logo: {
    fontSize: 40,
  },

  appName: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#246B35',
  },

  tagline: {
    fontSize: 13,
    color: '#6B806D',
    marginTop: 6,
  },

  headingContainer: {
    marginBottom: 22,
    alignItems: 'center',
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#243B29',
    textAlign: 'center',
  },

  description: {
    fontSize: 14,
    color: '#68776A',
    marginTop: 9,
    textAlign: 'center',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#246B35',
    marginBottom: 20,
    marginTop: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#465B49',
    marginBottom: 9,
    marginTop: 15,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#243B29',
    backgroundColor: '#FAFCF9',
  },

  phoneContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F8F1',
  },

  phoneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#287A3D',
    writingDirection: 'ltr',
  },

  verifiedText: {
    fontSize: 12,
    color: '#287A3D',
    fontWeight: 'bold',
  },

  dropdown: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFCF9',
  },

  dropdownText: {
    fontSize: 15,
    color: '#243B29',
  },

  placeholder: {
    color: '#999999',
  },

  arrow: {
    color: '#287A3D',
    fontSize: 13,
  },

  helperText: {
    fontSize: 12,
    color: '#89948A',
    marginBottom: 12,
  },

  cropContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  cropChip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 20,
    backgroundColor: '#FAFCF9',
  },

  selectedCrop: {
    backgroundColor: '#287A3D',
    borderColor: '#287A3D',
  },

  cropText: {
    fontSize: 13,
    color: '#465B49',
  },

  selectedCropText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  message: {
    color: '#287A3D',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },

  completeButton: {
    height: 54,
    backgroundColor: '#287A3D',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  footerText: {
    textAlign: 'center',
    color: '#758776',
    fontSize: 13,
    marginTop: 28,
    marginBottom: 15,
  },

  // District Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 15,
  },

  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#243B29',
    backgroundColor: '#FAFCF9',
    marginBottom: 12,
  },

  districtItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  districtText: {
    fontSize: 15,
    color: '#344B38',
  },

  selectedMark: {
    color: '#287A3D',
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    color: '#89948A',
    paddingVertical: 25,
    fontSize: 14,
  },

  closeButton: {
    backgroundColor: '#287A3D',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});