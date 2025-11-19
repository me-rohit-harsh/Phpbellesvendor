import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionHistory } from '../../../lib/api/vendorWallet';
import { ToastManager } from '../../components/NotificationToast';

const TransactionsScreen = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const res = await getTransactionHistory(pageNum, 20);

      if (res?.success && res?.data) {
        const newTransactions = res.data;
        if (pageNum === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions((prev) => [...prev, ...newTransactions]);
        }
        setPage(pageNum);
        setHasMore(res?.pagination?.current_page < res?.pagination?.total_pages);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load transactions');
      ToastManager.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1);
    }, [fetchTransactions])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions(1);
    setRefreshing(false);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchTransactions(page + 1);
    }
  }, [hasMore, loading, page, fetchTransactions]);

  const renderTransaction = ({ item }) => {
    const isCredit = item.type === 'credit';
    const typeIcon = isCredit ? 'arrow-down-circle' : 'arrow-up-circle';
    const typeColor = isCredit ? '#28A745' : '#DC3545';
    const amountSign = isCredit ? '+' : '-';

    return (
      <View style={styles.transactionItem}>
        <View style={[styles.iconContainer, { backgroundColor: isCredit ? '#F1F8F4' : '#FCE4E6' }]}>
          <Ionicons name={typeIcon} size={24} color={typeColor} />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description || 'Transaction'}</Text>
          <Text style={styles.transactionSource}>{item.source}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: typeColor }]}>
            {amountSign}₹{Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#020A66" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerActions} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTransaction}
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#020A66" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 60,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'MyFont-Bold',
    marginBottom: 4,
  },
  transactionSource: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'MyFont-Regular',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
  },
  amountContainer: {
    marginLeft: 12,
  },
  amount: {
    fontSize: 14,
    fontFamily: 'MyFont-Bold',
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Regular',
    marginTop: 8,
  },
});

export default TransactionsScreen;
