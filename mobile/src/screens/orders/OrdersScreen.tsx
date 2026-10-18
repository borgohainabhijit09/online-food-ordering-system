import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { useOrdersStore, Order, TimeframeFilter } from '../../store/useOrdersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStoreSettings } from '../../store/useStoreSettings';
import { RevenuePulse } from '../../components/RevenuePulse';
import { Item86Modal } from '../../components/Item86Modal';
import { QuickBillModal } from '../../components/QuickBillModal';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  BellRing,
  RotateCw,
  Utensils,
  ShoppingBag,
  Bike,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  PhoneCall,
  MessageSquare,
  UtensilsCrossed,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react-native';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'DELAYED'];

export function OrdersScreen() {
  const {
    orders,
    filterStatus,
    setFilterStatus,
    timeframe,
    setTimeframe,
    isLoading,
    isRefreshing,
    fetchOrders,
    updateOrderStatus,
    soundAlertEnabled,
    toggleSoundAlert,
    isKeepAwake,
    toggleKeepAwake,
    hasPendingAlarm,
    dismissAlarm,
  } = useOrdersStore();

  const { activeStore } = useAuthStore();
  const { isAcceptingOrders, fetchSettings, toggleStoreStatus } = useStoreSettings();

  const [showItem86Modal, setShowItem86Modal] = useState(false);
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);

  // Initial fetch and 10-second polling
  useEffect(() => {
    fetchOrders(activeStore?.slug);
    fetchSettings(activeStore?.slug);
    const interval = setInterval(() => {
      fetchOrders(activeStore?.slug);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeStore?.slug]);

  const orderList = Array.isArray(orders) ? orders : [];
  const now = Date.now();

  const filteredOrders = orderList.filter((o) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'DELAYED') {
      const isPendingOrPrep = ['PENDING', 'NEW', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status);
      const isOlderThan20m = now - new Date(o.createdAt).getTime() > 20 * 60 * 1000;
      return isPendingOrPrep && isOlderThan20m;
    }
    if (filterStatus === 'PENDING') return o.status === 'PENDING' || o.status === 'NEW';
    if (filterStatus === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'ACCEPTED';
    if (filterStatus === 'COMPLETED') return o.status === 'COMPLETED' || o.status === 'SERVED' || o.status === 'DELIVERED';
    return o.status === filterStatus;
  });

  const handlePrint = (order: Order) => {
    Alert.alert(
      'Print Receipt',
      `Printing Bill for Order #${order.id.slice(0, 4).toUpperCase()} (Table: ${order.table?.tableNumber || 'N/A'}).\n\nEnsure Bluetooth printer is paired in Settings.`,
      [{ text: 'OK' }]
    );
  };

  const handleToggleStore = () => {
    const action = isAcceptingOrders ? 'Close / Pause Orders' : 'Open Store';
    Alert.alert(
      action,
      `Are you sure you want to ${isAcceptingOrders ? 'pause incoming online orders' : 're-open online ordering'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAcceptingOrders ? 'Pause Store' : 'Open Store',
          style: isAcceptingOrders ? 'destructive' : 'default',
          onPress: () => toggleStoreStatus(activeStore?.slug),
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING':
        return { bg: Colors.warningLight, text: Colors.warning, label: 'Pending' };
      case 'ACCEPTED':
      case 'CONFIRMED':
        return { bg: Colors.infoLight, text: Colors.info, label: 'Confirmed' };
      case 'PREPARING':
        return { bg: '#f3e8ff', text: '#9333ea', label: 'Preparing' };
      case 'READY':
        return { bg: Colors.successLight, text: Colors.success, label: 'Ready' };
      case 'SERVED':
      case 'DELIVERED':
      case 'COMPLETED':
        return { bg: Colors.surface, text: Colors.textSecondary, label: 'Completed' };
      default:
        return { bg: Colors.dangerLight, text: Colors.danger, label: status };
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.status);
    const dateFormatted = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isOrderDelayed =
      ['PENDING', 'NEW', 'CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(item.status) &&
      now - new Date(item.createdAt).getTime() > 20 * 60 * 1000;

    const customerPhone = item.phone || item.customerPhone;

    return (
      <View style={[styles.card, isOrderDelayed && styles.cardDelayed]}>
        {/* Delayed Alert Banner */}
        {isOrderDelayed && (
          <View style={styles.delayedBanner}>
            <AlertTriangle size={13} color="#b91c1c" />
            <Text style={styles.delayedBannerText}>DELAYED: Placed over 20 mins ago</Text>
          </View>
        )}

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdGroup}>
            <Text style={styles.orderNumber}>#{item.id.slice(0, 4).toUpperCase()}</Text>
            <View style={styles.orderTypeBadge}>
              {item.orderType === 'DINE_IN' ? (
                <>
                  <Utensils size={13} color={Colors.primary} />
                  <Text style={styles.orderTypeText}>
                    Table {item.table?.tableNumber || 'N/A'}
                  </Text>
                </>
              ) : item.orderType === 'TAKEAWAY' ? (
                <>
                  <ShoppingBag size={13} color={Colors.info} />
                  <Text style={[styles.orderTypeText, { color: Colors.info }]}>Takeaway</Text>
                </>
              ) : (
                <>
                  <Bike size={13} color={Colors.success} />
                  <Text style={[styles.orderTypeText, { color: Colors.success }]}>Delivery</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Time and Customer */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{dateFormatted}</Text>
          </View>
          {item.customerName ? (
            <Text style={styles.metaText}>Customer: {item.customerName}</Text>
          ) : null}
        </View>

        {/* 1-Tap Call / WhatsApp Customer Buttons */}
        {customerPhone ? (
          <View style={styles.customerPhoneRow}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${customerPhone}`)}
              activeOpacity={0.7}
            >
              <PhoneCall size={13} color="#059669" />
              <Text style={styles.callBtnText}>Call {customerPhone}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waBtn}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=Hello%20from%20${encodeURIComponent(
                    activeStore?.businessName || 'the restaurant'
                  )}%20regarding%20your%20order%20%23${item.id.slice(0, 4).toUpperCase()}`
                )
              }
              activeOpacity={0.7}
            >
              <MessageSquare size={13} color="#2563eb" />
              <Text style={styles.waBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Item List */}
        <View style={styles.itemsList}>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{it.quantity}x</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.product?.name || 'Item'}</Text>
                {it.addons && it.addons.length > 0 ? (
                  <Text style={styles.itemAddons}>
                    +{' '}
                    {it.addons
                      .map((a: any) => a.addonName || a.name || a.addon?.name || '')
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>₹{it.price * it.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Notes if present */}
        {item.notes || item.remarks ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>Note: {item.notes || item.remarks}</Text>
          </View>
        ) : null}

        {/* Total & Payment */}
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total Bill</Text>
            <Text style={styles.totalAmount}>₹{item.total}</Text>
          </View>
          <View style={styles.paymentPill}>
            <Text style={styles.paymentPillText}>
              {item.paymentMethod} • {item.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={() => handlePrint(item)}
            activeOpacity={0.7}
          >
            <Printer size={16} color={Colors.text} />
          </TouchableOpacity>

          {(item.status === 'PENDING' || item.status === 'NEW') && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => updateOrderStatus(item.id, 'CANCELLED', activeStore?.slug)}
              >
                <XCircle size={15} color={Colors.danger} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => updateOrderStatus(item.id, 'ACCEPTED', activeStore?.slug)}
              >
                <CheckCircle size={15} color="#fff" />
                <Text style={styles.acceptBtnText}>Accept Order</Text>
              </TouchableOpacity>
            </>
          )}

          {(item.status === 'CONFIRMED' || item.status === 'ACCEPTED') && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryActionBtn]}
              onPress={() => updateOrderStatus(item.id, 'PREPARING', activeStore?.slug)}
            >
              <Text style={styles.primaryActionBtnText}>Send to Kitchen (Preparing)</Text>
            </TouchableOpacity>
          )}

          {item.status === 'PREPARING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.readyBtn]}
              onPress={() => updateOrderStatus(item.id, 'READY', activeStore?.slug)}
            >
              <Text style={styles.readyBtnText}>Mark Order Ready</Text>
            </TouchableOpacity>
          )}

          {item.status === 'READY' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => updateOrderStatus(item.id, 'SERVED', activeStore?.slug)}
            >
              <Text style={styles.completeBtnText}>Settle & Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar Controls */}
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.storeTitle}>{activeStore?.businessName || 'Store Manager'}</Text>
          {/* Store Open / Closed Toggle Pill */}
          <TouchableOpacity
            style={[styles.storeStatusPill, isAcceptingOrders ? styles.storeOpen : styles.storeClosed]}
            onPress={handleToggleStore}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.storeStatusDot,
                { backgroundColor: isAcceptingOrders ? '#16a34a' : '#dc2626' },
              ]}
            />
            <Text
              style={[
                styles.storeStatusText,
                { color: isAcceptingOrders ? '#16a34a' : '#dc2626' },
              ]}
            >
              {isAcceptingOrders ? 'OPEN (Accepting)' : 'PAUSED (Closed)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons Group */}
        <View style={styles.controlsGroup}>
          {/* Menu Stock Out of Stock Quick Button */}
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => setShowItem86Modal(true)}
            activeOpacity={0.7}
          >
            <UtensilsCrossed size={14} color="#ea580c" />
            <Text style={styles.actionPillText}>Menu Stock</Text>
          </TouchableOpacity>

          {/* 10-Second Quick Bill Button */}
          <TouchableOpacity
            style={[styles.actionPillBtn, styles.quickBillBtn]}
            onPress={() => setShowQuickBillModal(true)}
            activeOpacity={0.7}
          >
            <PlusCircle size={14} color="#ffffff" />
            <Text style={styles.quickBillText}>+ Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, soundAlertEnabled && styles.iconButtonActive]}
            onPress={toggleSoundAlert}
          >
            {soundAlertEnabled ? (
              <Volume2 size={16} color={Colors.primary} />
            ) : (
              <VolumeX size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isKeepAwake && styles.iconButtonActive]}
            onPress={toggleKeepAwake}
          >
            {isKeepAwake ? (
              <Eye size={16} color={Colors.primary} />
            ) : (
              <EyeOff size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => fetchOrders(activeStore?.slug)}
          >
            <RotateCw size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alarm Flashing Alert Bar */}
      {hasPendingAlarm && (
        <View style={styles.alarmBanner}>
          <BellRing size={20} color="#fff" />
          <Text style={styles.alarmText}>NEW ORDER WAITING!</Text>
          <TouchableOpacity style={styles.alarmDismissBtn} onPress={dismissAlarm}>
            <Text style={styles.alarmDismissText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Revenue Pulse & Operational Alerts Header */}
      <RevenuePulse
        orders={orderList}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        onAlertFilterPress={(filter) => setFilterStatus(filter)}
      />

      {/* Horizontal Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = filterStatus === item;
            const isDelayedTab = item === 'DELAYED';
            return (
              <TouchableOpacity
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                  isDelayedTab && styles.delayedTab,
                  isDelayedTab && isActive && styles.delayedTabActive,
                ]}
                onPress={() => setFilterStatus(item)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                    isDelayedTab && styles.delayedTabText,
                    isDelayedTab && isActive && styles.delayedTabTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Order List */}
      {isLoading && orders.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchOrders(activeStore?.slug)}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No orders in "{filterStatus}"</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <Item86Modal
        visible={showItem86Modal}
        onClose={() => setShowItem86Modal(false)}
        tenantSlug={activeStore?.slug}
      />

      <QuickBillModal
        visible={showQuickBillModal}
        onClose={() => setShowQuickBillModal(false)}
        tenantSlug={activeStore?.slug}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleGroup: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  storeOpen: {
    backgroundColor: '#dcfce7',
  },
  storeClosed: {
    backgroundColor: '#fee2e2',
  },
  storeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  storeStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  quickBillBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickBillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#ffedd5',
    borderColor: '#fed7aa',
  },
  alarmBanner: {
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  alarmText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  alarmDismissBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alarmDismissText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  tabsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  delayedTab: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  delayedTabActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  delayedTabText: {
    color: '#dc2626',
  },
  delayedTabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDelayed: {
    borderColor: '#fca5a5',
    borderWidth: 1.5,
  },
  delayedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 6,
  },
  delayedBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  orderTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  orderTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  customerPhoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    width: 26,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemAddons: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  notesBox: {
    backgroundColor: Colors.warningLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  paymentPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  printBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: Colors.dangerLight,
  },
  rejectBtnText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  primaryActionBtn: {
    backgroundColor: Colors.info,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  readyBtn: {
    backgroundColor: Colors.success,
  },
  readyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  completeBtn: {
    backgroundColor: Colors.text,
  },
  completeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
