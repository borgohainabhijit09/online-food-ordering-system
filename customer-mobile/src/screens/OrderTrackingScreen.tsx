import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Utensils,
  ChefHat,
  Bike,
  Check,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { trackOrderById } from '../services/api';

const ORDER_STEPS = [
  { key: 'NEW', label: 'Order Placed', desc: 'Sent to restaurant', icon: Utensils },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed by kitchen', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Cooking in Kitchen', desc: 'Freshly preparing your food', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery / Ready', desc: 'Rider on the way or served', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order complete, enjoy!', icon: Check },
];

export const OrderTrackingScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await trackOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.warn('Failed to poll order status:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds for live status updates from kitchen
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCall = () => {
    if (order?.restaurant?.phone) {
      Linking.openURL(`tel:${order.restaurant.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (order?.restaurant?.phone) {
      const num = order.restaurant.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/91${num}?text=Hi,%20inquiring%20about%20Order%20#${orderId.slice(-4).toUpperCase()}`);
    }
  };

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'upcoming';
    const statusOrder = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(order.status);

    let stepIdx = 0;
    if (stepKey === 'NEW') stepIdx = 0;
    if (stepKey === 'ACCEPTED') stepIdx = 1;
    if (stepKey === 'PREPARING') stepIdx = 2;
    if (stepKey === 'OUT_FOR_DELIVERY') stepIdx = 4; // covers READY, SERVED, OUT_FOR_DELIVERY
    if (stepKey === 'DELIVERED') stepIdx = 6;

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching live order status...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered = order.status === 'DELIVERED' || order.status === 'SERVED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Navigation Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MyOrders');
            }
          }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Live Order Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.orderNumber}>
                Order #{order.id.slice(-6).toUpperCase()}
              </Text>
              <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
            </View>

            <View style={[styles.badge, isDelivered ? styles.badgeSuccess : isCancelled ? styles.badgeDanger : styles.badgeActive]}>
              <Text style={[styles.badgeText, isDelivered ? styles.badgeTextSuccess : isCancelled ? styles.badgeTextDanger : styles.badgeTextActive]}>
                {order.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* ETA Banner */}
          {!isDelivered && !isCancelled && (
            <View style={styles.etaBanner}>
              <Clock size={20} color="#b45309" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.etaTitle}>Estimated Time: {order.prepTimeMinutes} mins</Text>
                <Text style={styles.etaSubtitle}>
                  {order.status === 'PREPARING'
                    ? 'The chef is currently preparing your dishes.'
                    : 'Your order is being processed by the restaurant.'}
                </Text>
              </View>
            </View>
          )}

          {/* Contact Restaurant Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
              <Phone size={15} color={colors.primary} />
              <Text style={styles.actionBtnText}>Call Restaurant</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGreen]} onPress={handleWhatsApp} activeOpacity={0.8}>
              <MessageCircle size={15} color="#16a34a" />
              <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stepper Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          <View style={styles.stepperWrapper}>
            {ORDER_STEPS.map((step, index) => {
              const status = getStepStatus(step.key);
              const isLast = index === ORDER_STEPS.length - 1;
              const StepIcon = step.icon;

              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        status === 'completed' && styles.stepCircleCompleted,
                        status === 'current' && styles.stepCircleCurrent,
                      ]}
                    >
                      <StepIcon
                        size={14}
                        color={
                          status === 'completed' || status === 'current'
                            ? '#ffffff'
                            : colors.textMuted
                        }
                      />
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          status === 'completed' && styles.stepLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        styles.stepLabel,
                        status === 'current' && styles.stepLabelCurrent,
                        status === 'completed' && styles.stepLabelCompleted,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery / Table Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fulfillment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Type:</Text>
            <Text style={styles.detailValue}>{order.orderType}</Text>
          </View>
          {order.tableNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Table Number:</Text>
              <Text style={styles.detailValue}>{order.tableNumber}</Text>
            </View>
          )}
          {order.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Address:</Text>
              <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{order.address}</Text>
            </View>
          )}
          {order.remarks && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Instructions:</Text>
              <Text style={styles.detailValue}>{order.remarks}</Text>
            </View>
          )}
        </View>

        {/* Order Items Receipt */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt</Text>
          {order.items.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                {item.variantName && (
                  <Text style={styles.itemMeta}>Size: {item.variantName}</Text>
                )}
                {item.addons && item.addons.length > 0 && (
                  <Text style={styles.itemMeta}>
                    Extras: {item.addons.map((a: any) => a.name).join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  navIconBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  badgeActive: {
    backgroundColor: colors.primaryLight,
  },
  badgeTextActive: {
    color: colors.primaryDark,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  badgeTextSuccess: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
  },
  badgeTextDanger: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 12,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  etaSubtitle: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    gap: 6,
  },
  actionBtnGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  stepperWrapper: {
    paddingLeft: 6,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 30,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#16a34a',
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 2,
    height: 34,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepLineCompleted: {
    backgroundColor: '#16a34a',
  },
  stepTextCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 22,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepLabelCurrent: {
    fontWeight: '800',
    color: colors.primaryDark,
    fontSize: 14,
  },
  stepLabelCompleted: {
    fontWeight: '700',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
});
