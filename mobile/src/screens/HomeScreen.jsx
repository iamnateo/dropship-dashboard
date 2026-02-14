import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { ordersAPI, cjAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total_orders: 0, pending: 0 });
  const [cjConnected, setCjConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [ordersRes, cjRes] = await Promise.all([
        ordersAPI.getStats().catch(() => ({ data: { stats: {} } })),
        cjAPI.getStatus().catch(() => ({ data: { connected: false } }))
      ]);
      
      setStats(ordersRes.data.stats || { total_orders: 0, pending: 0 });
      setCjConnected(cjRes.data.connected || false);
    } catch (error) {
      console.error('Failed to load dashboard');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const menuItems = [
    { name: 'Products', icon: '📦', route: 'Products', color: '#2563eb' },
    { name: 'Orders', icon: '🛒', route: 'Orders', color: '#10b981' },
    { name: 'Trends', icon: '📈', route: 'Trends', color: '#f59e0b' },
    { name: 'Settings', icon: '⚙️', route: 'Settings', color: '#64748b' }
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚀 DropshipHub</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.welcome}>Welcome back!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {/* CJ Status */}
      {!cjConnected && (
        <TouchableOpacity style={styles.alert} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.alertText}>⚠️ Connect CJ Account to get started</Text>
        </TouchableOpacity>
      )}

      {cjConnected && (
        <View style={styles.successAlert}>
          <Text style={styles.successText}>✅ CJ Account Connected</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total_orders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  logout: {
    color: '#ef4444',
    fontSize: 14
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4
  },
  email: {
    color: '#64748b',
    marginBottom: 20
  },
  alert: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  alertText: {
    color: '#92400e',
    fontWeight: '500'
  },
  successAlert: {
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  successText: {
    color: '#065f46',
    fontWeight: '500'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    color: '#64748b',
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  menuGrid: {
    gap: 12
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12
  },
  menuName: {
    fontSize: 16,
    fontWeight: '500'
  }
});
