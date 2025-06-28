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

const EmailVerificationScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
    setIsResending(true);
    try {
      // Burada resend verification email logic olacak
      console.log('Resending verification email to:', email);
      Alert.alert('Email Sent', 'Verification email has been resent');
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerificationComplete = () => {
    Alert.alert(
      'Verification Complete', 
      'Your email address has been successfully verified!',
      [
        {
          text: 'Sign In',
          onPress: () => navigation.navigate('Login')
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

        {/* Demo Button - Gerçek uygulamada bu olmayacak */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleVerificationComplete}
        >
          <Text style={styles.demoButtonText}>
            Demo: Complete Verification
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
  demoButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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