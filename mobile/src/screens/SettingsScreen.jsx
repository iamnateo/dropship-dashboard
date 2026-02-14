import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { cjAPI, authAPI } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const [cjConnected, setCjConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCjStatus();
  }, []);

  const checkCjStatus = async () => {
    try {
      const res = await cjAPI.getStatus();
      setCjConnected(res.data.connected || false);
    } catch (error) {
      setCjConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connectCj = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter your CJ API key');
      return;
    }

    setConnecting(true);
    try {
      await cjAPI.connect({ apiKey });
      Alert.alert('Success', 'CJ account connected successfully!');
      setCjConnected(true);
      setApiKey('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.content}>
          {/* CJ Integration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CJDropShipping Integration</Text>
            
            {cjConnected ? (
              <View style={styles.connectedBox}>
                <Text style={styles.connectedIcon}>✅</Text>
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <View style={styles.notConnectedBox}>
                <Text style={styles.notConnectedIcon}>⚠️</Text>
                <Text style={styles.notConnectedText}>Not Connected</Text>
              </View>
            )}
            
            {!cjConnected && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter CJ API Key"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={connectCj}
                  disabled={connecting}
                >
                  <Text style={styles.buttonText}>
                    {connecting ? 'Connecting...' : 'Connect CJ Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Get CJ API Key</Text>
            <View style={styles.instructions}>
              <Text style={styles.step}>1. Log in to cjdropshipping.com</Text>
              <Text style={styles.step}>2. Go to "Developer" → "API"</Text>
              <Text style={styles.step}>3. Click "Generate API Key"</Text>
              <Text style={styles.step}>4. Copy and paste the key above</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  back: {
    color: '#2563eb',
    fontSize: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600'
  },
  content: {
    padding: 16
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  connectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8
  },
  connectedIcon: {
    fontSize: 20,
    marginRight: 8
  },
  connectedText: {
    color: '#065f46',
    fontWeight: '600'
  },
  notConnectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  notConnectedIcon: {
    fontSize: 20,
    marginRight: 8
  },
  notConnectedText: {
    color: '#92400e',
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  instructions: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8
  },
  step: {
    color: '#64748b',
    marginBottom: 8,
    fontSize: 14
  }
});
