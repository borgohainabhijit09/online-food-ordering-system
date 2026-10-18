import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Package,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useCustomerStore } from '../store/useCustomerStore';
import { getOrderHistoryByPhone } from '../services/api';
import { PhoneAuthModal } from '../components/PhoneAuthModal';

export const OrdersHistoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const profile = useCustomerStore((s) => s.profile);
  const isLoggedIn = useCustomerStore((s) => s.isLoggedIn);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!profile.phone || !isLoggedIn) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getOrderHistoryByPhone(profile.phone);
      setOrders(data);
    } catch (err) {
      console.warn('Failed to load order history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.phone, isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Package size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        {isLoggedIn && profile.phone ? (
          <View style={styles.phoneBadge}>
            <ShieldCheck size={12} color="#15803d" />
            <Text style={styles.phoneBadgeText}>+91 {profile.phone}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInHeaderBtn}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.8}
          >
            <Smartphone size={13} color={colors.primary} />
            <Text style={styles.signInHeaderText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isLoggedIn ? (
        /* GUEST STATE */
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Package size={44} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Track & View Your Orders</Text>
          <Text style={styles.guestSubtitle}>
            Sign in with your 10-digit mobile number to view live order status, track deliveries in real time, and reorder past meals with 1 tap.
          </Text>

          <View style={styles.perksCard}>
            <View style={styles.perkRow}>
              <View style={styles.perkBullet}>
                <Clock size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkHeading}>Real-Time Tracking</Text>
                <Text style={styles.perkSub}>Live status from kitchen preparation to doorstep arrival</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkBullet}>
                <Sparkles size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkHeading}>All Restaurants in One Place</Text>
                <Text style={styles.perkSub}>Unified history across all partner outlets</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkBullet}>
                <RotateCcw size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkHeading}>1-Tap Reorder</Text>
                <Text style={styles.perkSub}>Instantly re-add your favorite dishes to cart</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.guestPrimaryBtn}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.88}
          >
            <Smartphone size={18} color="#ffffff" />
            <Text style={styles.guestPrimaryBtnText}>Sign In with Mobile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestSecondaryBtn}
            onPress={() => navigation.navigate('Explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestSecondaryBtnText}>Browse Restaurants First</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        /* LOADING STATE */
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your past orders...</Text>
        </View>
      ) : (
        /* ORDERS LIST */
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const isDelivered = item.status === 'DELIVERED' || item.status === 'SERVED';
            const isCancelled = item.status === 'CANCELLED';

            return (
              <View style={styles.orderCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.restaurantName}>{item.restaurantName}</Text>
                    <View style={styles.timeRow}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                      {item.tableNumber && (
                        <Text style={styles.tableBadge}>Table: {item.tableNumber}</Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isDelivered ? styles.statusSuccess : isCancelled ? styles.statusDanger : styles.statusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isDelivered ? styles.statusTextSuccess : isCancelled ? styles.statusTextDanger : styles.statusTextActive,
                      ]}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                {/* Items Summary */}
                <Text style={styles.itemsSummary} numberOfLines={2}>
                  {item.itemsSummary}
                </Text>

                {/* Footer with Amount & Track */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Paid</Text>
                    <Text style={styles.totalAmount}>₹{item.total}</Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => navigation.navigate('RestaurantDetail', { slug: item.restaurantSlug })}
                    >
                      <RotateCcw size={13} color={colors.textSecondary} />
                      <Text style={styles.reorderText}>Menu</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                    >
                      <Text style={styles.trackBtnText}>Track</Text>
                      <ArrowRight size={13} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                You haven't placed any orders with phone +91 {profile.phone}. Order from your favorite restaurant now!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.exploreBtnText}>Browse Restaurants</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Slide-Up Phone Login Modal */}
      <PhoneAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          setAuthModalVisible(false);
          loadOrders();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  phoneBadgeText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
  },
  signInHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  signInHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  guestContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  perksCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  perkBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  perkHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  perkSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guestPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  guestSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tableBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: colors.primaryLight,
  },
  statusTextActive: {
    color: colors.primaryDark,
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusTextSuccess: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  statusDanger: {
    backgroundColor: '#fee2e2',
  },
  statusTextDanger: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  itemsSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    gap: 4,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  trackBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
