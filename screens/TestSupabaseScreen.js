import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase, auth, db } from '../lib/supabase';

const TestSupabaseScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not tested');
  const [tables, setTables] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { user } = await auth.getCurrentUser();
    setCurrentUser(user);
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          setConnectionStatus('✅ Connected (No migrations table found - normal)');
        } else {
          throw error;
        }
      } else {
        setConnectionStatus('✅ Connected successfully');
      }

      // Try to get table information using SQL
      await getTableInfo();
      
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTableInfo = async () => {
    try {
      // Get table information from information_schema
      const { data, error } = await supabase
        .rpc('get_table_info');

      if (error) {
        console.log('RPC error (expected):', error.message);
        // If RPC doesn't exist, try direct query
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');

        if (schemaError) {
          console.log('Schema query error:', schemaError.message);
          setTables(['Unable to fetch tables - Limited permissions']);
        } else {
          setTables(schemaData?.map(table => table.table_name) || []);
        }
      } else {
        setTables(data || []);
      }
    } catch (error) {
      console.error('Table info error:', error);
      setTables(['Error fetching tables']);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    try {
      // Test auth with a dummy email
      const testEmail = 'test@example.com';
      const testPassword = 'testpassword123';

      Alert.alert(
        'Auth Test',
        'This will attempt to sign up with test credentials. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Test',
            onPress: async () => {
              const { data, error } = await auth.signUp(testEmail, testPassword, {
                full_name: 'Test User',
                username: 'testuser'
              });

              if (error) {
                Alert.alert('Auth Test Result', `Error: ${error.message}`);
              } else {
                Alert.alert('Auth Test Result', 'Sign up successful! Check your email for verification.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Auth Test Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async () => {
    try {
      // Try to create a user profile table if it doesn't exist
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        Alert.alert(
          'Table Not Found',
          'user_profiles table does not exist. Would you like to create it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create',
              onPress: () => {
                Alert.alert(
                  'SQL Commands',
                  `To create the user_profiles table, run this SQL in your Supabase dashboard:

CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);`
                );
              }
            }
          ]
        );
      } else if (error) {
        Alert.alert('Database Error', error.message);
      } else {
        Alert.alert('Success', 'user_profiles table exists and is accessible!');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <Text style={styles.status}>{connectionStatus}</Text>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          <Text style={styles.info}>
            {currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in'}
          </Text>
        </View>

        {/* Database Tables */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Tables</Text>
          {tables.length > 0 ? (
            tables.map((table, index) => (
              <Text key={index} style={styles.tableItem}>• {table}</Text>
            ))
          ) : (
            <Text style={styles.info}>No tables found or not fetched yet</Text>
          )}
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={testAuth}
          >
            <Text style={styles.buttonText}>Test Auth (Sign Up)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={createUserProfile}
          >
            <Text style={styles.buttonText}>Check User Profiles Table</Text>
          </TouchableOpacity>
        </View>

        {/* Environment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment</Text>
          <Text style={styles.info}>
            URL: {process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set'}
          </Text>
          <Text style={styles.info}>
            Anon Key: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Not set ❌'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tableItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TestSupabaseScreen;