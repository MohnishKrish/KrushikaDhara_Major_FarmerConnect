import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://172.51.137.206:5000/api';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string | string[] }>();

const phone = Array.isArray(params.phone)
  ? params.phone[0]
  : params.phone ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(30);
  const [message, setMessage] = useState('');

  const inputRefs = useRef<Array<React.ElementRef<typeof TextInput> | null>>([]);

  // Countdown timer
  useEffect(() => {
    if (seconds === 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;

    setOtp(updatedOtp);
    setMessage('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerify = async () => {
  const enteredOtp = otp.join('');

  if (enteredOtp.length !== 6) {
    setMessage('Please enter the complete 6-digit OTP.');
    return;
  }

  try {
    setMessage('Verifying OTP...');

    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        otp: enteredOtp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || 'OTP verification failed.');
      return;
    }

    // Save authentication token
    await AsyncStorage.setItem('authToken', data.token);

    if (data.isNewUser) {

      // New user goes to profile creation
      router.replace({
        pathname: '/profile',
        params: { phone },
      });

    } else {

      // Existing user: save profile locally
      if (!data.user) {
        setMessage('Unable to load your profile. Please try again.');
        return;
      }

      const farmerProfile = {
        _id: data.user._id,  
        name: data.user.name,
        phone: data.user.phone,
        district: data.user.district,
        village: data.user.village || '',
        crops: data.user.crops || [],
      };

      await AsyncStorage.setItem(
        'farmerProfile',
        JSON.stringify(farmerProfile)
      );

      setMessage('Login successful!');

      // Navigate to home
      router.replace('/');
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    setMessage(
      error instanceof Error
        ? error.message
        : 'Unable to connect to the server.'
    );
  }
};

  // Resend OTP
  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setSeconds(30);
    setMessage('A new OTP will be sent when Firebase is integrated.');
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>

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

        {/* OTP Card */}
        <View style={styles.otpCard}>

          <Text style={styles.title}>Verify Your Number</Text>

          <Text style={styles.description}>
            We've sent a verification code to
          </Text>

          <Text style={styles.phoneNumber}>
            +91 {phone}
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?
            </Text>

            {seconds > 0 ? (
              <Text style={styles.timer}>
                Resend in {seconds}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendButton}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Message */}
          {message !== '' && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>

          {/* Change Number */}
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.changeText}>
              ← Change Mobile Number
            </Text>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made for Farmers ❤️
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F1',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },

  logoCircle: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: '#DFF0D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  logo: {
    fontSize: 43,
  },

  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#246B35',
  },

  tagline: {
    fontSize: 13,
    color: '#6B806D',
    marginTop: 7,
  },

  otpCard: {
    backgroundColor: '#FFFFFF',
    padding: 23,
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

  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#243B29',
    textAlign: 'center',
    marginBottom: 15,
  },

  description: {
    fontSize: 14,
    color: '#68776A',
    textAlign: 'center',
  },

  phoneNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#287A3D',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
    writingDirection: 'ltr',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  otpInput: {
    width: 43,
    height: 52,
    borderWidth: 1,
    borderColor: '#D5DFD3',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: 'bold',
    color: '#246B35',
    backgroundColor: '#FAFCF9',
  },

  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  resendText: {
    fontSize: 13,
    color: '#68776A',
  },

  timer: {
    fontSize: 14,
    color: '#287A3D',
    fontWeight: '600',
    marginTop: 8,
  },

  resendButton: {
    fontSize: 14,
    color: '#287A3D',
    fontWeight: 'bold',
    marginTop: 8,
  },

  message: {
    fontSize: 12,
    color: '#287A3D',
    textAlign: 'center',
    marginBottom: 15,
  },

  verifyButton: {
    backgroundColor: '#287A3D',
    height: 53,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  changeButton: {
    alignItems: 'center',
    marginTop: 22,
  },

  changeText: {
    fontSize: 14,
    color: '#287A3D',
    fontWeight: '600',
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerText: {
    fontSize: 13,
    color: '#758776',
  },
});