import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { handleAuthError } from '../services/errorService';

const EmailVerificationScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const { signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found. Please try registering again.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        await handleAuthError(error, {
          context: 'resend_verification',
          email,
          action: 'resendVerification'
        });
        Alert.alert('Error', 'Failed to resend verification email. Please try again.');
      } else {
        Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
        setCountdown(60);
        setCanResend(false);
      }
    } catch (error) {
      await handleAuthError(error, {
        context: 'resend_verification_catch',
        email,
        action: 'resendVerification'
      });
      Alert.alert('Error', 'Failed to send email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    setIsCheckingVerification(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        await handleAuthError(error, {
          context: 'check_verification',
          email,
          action: 'checkVerificationStatus'
        });
        Alert.alert('Error', 'Unable to check verification status. Please try again.');
        return;
      }

      // If there's a session and the user is verified, navigate to main app
      if (session?.user?.email_confirmed_at) {
        Alert.alert(
          'Verification Complete!', 
          'Your email address has been successfully verified. You can now access your account.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Email Not Verified',
          'Your email address has not been verified yet. Please check your inbox and click the verification link.',
          [
            { text: 'OK' },
            { 
              text: 'Resend Email', 
              onPress: () => canResend && handleResendEmail() 
            }
          ]
        );
      }
    } catch (error) {
      await handleAuthError(error, {
        context: 'check_verification_catch',
        email,
        action: 'checkVerificationStatus'
      });
      Alert.alert('Error', 'Unable to check verification status. Please try again.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleDifferentEmail = () => {
    Alert.alert(
      'Use Different Email',
      'Would you like to register with a different email address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Register Again',
          onPress: () => navigation.navigate('Register')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/connectlist-beta-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.emailIconContainer}>
          <Text style={styles.emailIcon}>📧</Text>
        </View>

        <Text style={styles.title}>Email Verification</Text>
        
        <Text style={styles.description}>
          We've sent a verification link to {email ? `${email}` : 'your email address'}. 
          Please check your inbox and click the link to verify your account.
        </Text>

        <Text style={styles.note}>
          Don't forget to check your spam folder if you don't see the email.
        </Text>

        {/* Resend Button */}
        <TouchableOpacity
          style={[
            styles.resendButton, 
            (!canResend || isResending) && styles.resendButtonDisabled
          ]}
          onPress={handleResendEmail}
          disabled={!canResend || isResending}
        >
          <Text style={[
            styles.resendButtonText,
            (!canResend || isResending) && styles.resendButtonTextDisabled
          ]}>
            {isResending 
              ? 'Sending...' 
              : canResend 
                ? 'Resend Email'
                : `Resend in (${countdown}s)`
            }
          </Text>
        </TouchableOpacity>

        {/* Check Verification Button */}
        <TouchableOpacity
          style={[styles.checkButton, isCheckingVerification && styles.checkButtonDisabled]}
          onPress={checkVerificationStatus}
          disabled={isCheckingVerification}
        >
          <Text style={styles.checkButtonText}>
            {isCheckingVerification ? 'Checking...' : 'I\'ve Verified My Email'}
          </Text>
        </TouchableOpacity>

        {/* Different Email Button */}
        <TouchableOpacity
          style={styles.differentEmailButton}
          onPress={handleDifferentEmail}
        >
          <Text style={styles.differentEmailButtonText}>
            Use Different Email
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity 
          style={styles.backContainer}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backText}>← Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: 110,
    height: 110,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f9ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emailIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  resendButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  resendButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  checkButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  checkButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  differentEmailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  differentEmailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
});

export default EmailVerificationScreen;