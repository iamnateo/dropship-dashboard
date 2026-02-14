import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { trendsAPI } from '../services/api';

export default function TrendsScreen({ navigation }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const res = await trendsAPI.getAll();
      const allTrends = [
        ...(res.data.google || []).map(t => ({ ...t, source: 'Google' })),
        ...(res.data.shopee || []).map(t => ({ ...t, source: 'Shopee' })),
        ...(res.data.lazada || []).map(t => ({ ...t, source: 'Lazada' }))
      ].sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0));
      setTrends(allTrends);
    } catch (error) {
      console.error('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
  };

  const getSourceColor = (source) => {
    const colors = {
      Google: '#4285f4',
      Shopee: '#ff5722',
      Lazada: '#0f9d58'
    };
    return colors[source] || '#64748b';
  };

  const renderTrend = ({ item, index }) => (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <Text style={styles.rank}>#{index + 1}</Text>
        <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.source) }]}>
          <Text style={styles.sourceText}>{item.source}</Text>
        </View>
      </View>
      <Text style={styles.trendName} numberOfLines={2}>{item.product_name}</Text>
      <View style={styles.trendFooter}>
        <Text style={styles.volume}>📊 {parseInt(item.search_volume || 0).toLocaleString()}</Text>
        <Text style={styles.category}>📁 {item.category || 'General'}</Text>
      </View>
      <Text style={styles.price}>💰 {item.price_range || 'Varies'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Market Trends</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : trends.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>No trends available</Text>
        </View>
      ) : (
        <FlatList
          data={trends}
          renderItem={renderTrend}
          keyExtractor={(item, index) => `${item.source}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
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
  list: {
    padding: 16
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  rank: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb'
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  trendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  trendFooter: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4
  },
  volume: {
    color: '#64748b',
    fontSize: 12
  },
  category: {
    color: '#64748b',
    fontSize: 12
  },
  price: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600'
  }
});
