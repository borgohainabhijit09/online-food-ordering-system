import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { useOrdersStore, Order } from '../../store/useOrdersStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Printer,
  PlayCircle,
  RotateCw,
  Utensils,
  ShoppingBag,
  Bike,
  AlertCircle,
} from 'lucide-react-native';

// Only active cooking statuses in kitchen queue (matches backend /api/orders?status=KOT)
const ACTIVE_KOT_STATUSES = ['NEW', 'PENDING', 'ACCEPTED', 'CONFIRMED', 'PREPARING'];

export function KotScreen() {
  const { orders, fetchOrders, updateOrderStatus, isRefreshing, isLoading } = useOrdersStore();
  const { activeStore } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'READY'>('ALL');

  useEffect(() => {
    fetchOrders(activeStore?.slug);
    const interval = setInterval(() => {
      fetchOrders(activeStore?.slug);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeStore?.slug]);

  // Active cooking kitchen orders (matches backend KOT definition, sorted FIFO)
  const activeKitchenOrders = useMemo(() => {
    return orders
      .filter((o) => ACTIVE_KOT_STATUSES.includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  // Dine-In active cooking orders
  const dineInOrders = useMemo(
    () => activeKitchenOrders.filter((o) => o.orderType === 'DINE_IN'),
    [activeKitchenOrders]
  );

  // Takeaway & Delivery active cooking orders
  const takeawayOrders = useMemo(
    () => activeKitchenOrders.filter((o) => o.orderType === 'TAKEAWAY' || o.orderType === 'DELIVERY'),
    [activeKitchenOrders]
  );

  // Ready food (completed cooking, at pickup/dispatch station)
  const readyOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'READY')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return activeKitchenOrders;
    if (activeFilter === 'DINE_IN') return dineInOrders;
    if (activeFilter === 'TAKEAWAY') return takeawayOrders;
    if (activeFilter === 'READY') return readyOrders;
    return activeKitchenOrders;
  }, [activeFilter, activeKitchenOrders, dineInOrders, takeawayOrders, readyOrders]);

  const handlePrintKOT = (order: Order) => {
    const tableStr =
      order.orderType === 'DINE_IN'
        ? `TABLE ${order.table?.tableNumber || 'N/A'}`
        : order.orderType;
    const itemsStr = order.items
      .map(
        (it) =>
          `${it.quantity}x ${it.product?.name || 'Item'}${
            it.addons && it.addons.length > 0
              ? ' (' + it.addons.map((a: any) => a.addonName || a.name || '').join(', ') + ')'
              : ''
          }`
      )
      .join('\n');

    Alert.alert(
      'KOT Thermal Printed',
      `[ESC/POS KITCHEN TICKET]\n================================\nKITCHEN ORDER TICKET (KOT)\n${tableStr}\nOrder: #${order.id.slice(0, 4).toUpperCase()}\nTime: ${new Date(
        order.createdAt
      ).toLocaleTimeString()}\n--------------------------------\n${itemsStr}\n${
        order.remarks || order.notes ? `\nNOTE: ${order.remarks || order.notes}\n` : ''
      }================================`,
      [{ text: 'OK' }]
    );
  };

  const renderKitchenCard = ({ item }: { item: Order }) => {
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / 60000
    );
    const isNew = item.status === 'NEW' || item.status === 'PENDING';
    const isAccepted = item.status === 'ACCEPTED' || item.status === 'CONFIRMED';
    const isPreparing = item.status === 'PREPARING';
    const isReady = item.status === 'READY';
    const noteText = item.remarks || item.notes;

    return (
      <View
        style={[
          styles.kotCard,
          isNew && styles.kotCardNew,
          isPreparing && styles.kotCardPrep,
          isReady && styles.kotCardReady,
        ]}
      >
        {/* Card Header */}
        <View style={styles.kotHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.typeBadge,
                item.orderType === 'DINE_IN' ? styles.typeDineIn : styles.typeTakeaway,
              ]}
            >
              {item.orderType === 'DINE_IN' ? (
                <Utensils size={13} color="#ffffff" />
              ) : item.orderType === 'DELIVERY' ? (
                <Bike size={13} color="#ffffff" />
              ) : (
                <ShoppingBag size={13} color="#ffffff" />
              )}
              <Text style={styles.typeBadgeText}>
                {item.orderType === 'DINE_IN'
                  ? `TABLE ${item.table?.tableNumber || 'N/A'}`
                  : item.orderType}
              </Text>
            </View>
            <Text style={styles.kotId}>#{item.id.slice(0, 4).toUpperCase()}</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                isNew && styles.statusBadgeNew,
                isAccepted && styles.statusBadgeAccepted,
                isPreparing && styles.statusBadgePrep,
                isReady && styles.statusBadgeReady,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isNew && styles.statusTextNew,
                  isAccepted && styles.statusTextAccepted,
                  isPreparing && styles.statusTextPrep,
                  isReady && styles.statusTextReady,
                ]}
              >
                {isNew ? 'NEW ORDER' : isAccepted ? 'ACCEPTED' : isPreparing ? 'COOKING' : 'FOOD READY'}
              </Text>
            </View>

            {/* Elapsed Time */}
            <View
              style={[
                styles.timeBadge,
                elapsedMinutes > 15 && styles.timeBadgeDelayed,
              ]}
            >
              <Clock
                size={11}
                color={elapsedMinutes > 15 ? '#ef4444' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.timeText,
                  elapsedMinutes > 15 && styles.timeTextDelayed,
                ]}
              >
                {elapsedMinutes}m
              </Text>
            </View>
          </View>
        </View>

        {/* Customer / Table Info */}
        <View style={styles.metaRow}>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customerName || 'Walk-in Guest'}
          </Text>
          <Text style={styles.timePlaced}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Kitchen Notes */}
        {noteText ? (
          <View style={styles.kitchenNotes}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={12} color={Colors.warning} />
              <Text style={styles.notesTitle}>KITCHEN NOTE</Text>
            </View>
            <Text style={styles.notesBody}>{noteText}</Text>
          </View>
        ) : null}

        {/* Items List */}
        <View style={styles.itemsBox}>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyText}>{it.quantity}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {it.product?.name || (it as any).productName || 'Menu Item'}
                </Text>
                {it.addons && it.addons.length > 0 ? (
                  <Text style={styles.itemAddon}>
                    +{' '}
                    {it.addons
                      .map((a: any) => a.addonName || a.name || '')
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Action Controls */}
        <View style={styles.actionRow}>
          {/* Print KOT Button */}
          <TouchableOpacity
            style={styles.printBtn}
            onPress={() => handlePrintKOT(item)}
            activeOpacity={0.7}
          >
            <Printer size={16} color="#cbd5e1" />
            <Text style={styles.printBtnText}>KOT</Text>
          </TouchableOpacity>

          {/* Next Kitchen Step Button */}
          {(isNew || isAccepted) && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.startBtn]}
              onPress={() => updateOrderStatus(item.id, 'PREPARING', activeStore?.slug)}
              activeOpacity={0.8}
            >
              <PlayCircle size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Start Preparing</Text>
            </TouchableOpacity>
          )}

          {isPreparing && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.readyBtn]}
              onPress={() => updateOrderStatus(item.id, 'READY', activeStore?.slug)}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Mark Food Ready</Text>
            </TouchableOpacity>
          )}

          {isReady && (
            <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.recallBtn]}
                onPress={() => updateOrderStatus(item.id, 'PREPARING', activeStore?.slug)}
                activeOpacity={0.8}
              >
                <RotateCw size={14} color="#ffffff" />
                <Text style={styles.actionBtnText}>Recall</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.servedBtn]}
                onPress={() => updateOrderStatus(item.id, 'SERVED', activeStore?.slug)}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={16} color="#ffffff" />
                <Text style={styles.actionBtnText}>Mark Served</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <ChefHat size={22} color={Colors.primary} />
            <Text style={styles.screenTitle}>Kitchen Display (KOT)</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchOrders(activeStore?.slug)}
          >
            <RotateCw size={15} color={isLoading ? Colors.primary : '#94a3b8'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.screenSubtitle}>
          {activeKitchenOrders.length} active ticket{activeKitchenOrders.length === 1 ? '' : 's'} in kitchen • FIFO sorted
        </Text>
      </View>

      {/* Kitchen Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
            All Active ({activeKitchenOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'DINE_IN' && styles.filterTabActive]}
          onPress={() => setActiveFilter('DINE_IN')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'DINE_IN' && styles.filterTabTextActive]}>
            Dine-In ({dineInOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'TAKEAWAY' && styles.filterTabActive]}
          onPress={() => setActiveFilter('TAKEAWAY')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'TAKEAWAY' && styles.filterTabTextActive]}>
            Takeaway ({takeawayOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'READY' && styles.filterTabActive]}
          onPress={() => setActiveFilter('READY')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'READY' && styles.filterTabTextActive]}>
            Food Ready ({readyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderKitchenCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchOrders(activeStore?.slug)}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ChefHat size={48} color="#475569" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'READY' ? 'No Food Ready' : 'Kitchen Queue is Empty'}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeKitchenOrders.length === 0 && activeFilter !== 'READY'
                ? 'All kitchen tickets are served! New orders will pop up here automatically.'
                : activeFilter === 'READY'
                ? 'No orders are currently waiting at the food pass / dispatch station.'
                : `No active tickets under ${activeFilter === 'DINE_IN' ? 'Dine-In' : 'Takeaway'}.`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark theme for kitchen display systems
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 14,
    paddingBottom: 40,
  },
  kotCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  kotCardNew: {
    borderColor: '#38bdf8',
  },
  kotCardPrep: {
    borderColor: '#f59e0b',
  },
  kotCardReady: {
    borderColor: '#10b981',
  },
  kotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeDineIn: {
    backgroundColor: Colors.primary,
  },
  typeTakeaway: {
    backgroundColor: '#0284c7',
  },
  typeBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  kotId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeNew: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  statusBadgeAccepted: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  statusBadgePrep: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusBadgeReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statusTextNew: {
    color: '#38bdf8',
  },
  statusTextAccepted: {
    color: '#60a5fa',
  },
  statusTextPrep: {
    color: '#f59e0b',
  },
  statusTextReady: {
    color: '#10b981',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  timeBadgeDelayed: {
    backgroundColor: '#451a1a',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  timeTextDelayed: {
    color: '#f87171',
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
  },
  timePlaced: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  kitchenNotes: {
    backgroundColor: '#422006',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginBottom: 10,
  },
  notesTitle: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900',
  },
  notesBody: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  itemsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  qtyBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  itemName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  itemAddon: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  printBtnText: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 12,
  },
  primaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startBtn: {
    backgroundColor: '#eab308',
  },
  readyBtn: {
    backgroundColor: '#10b981',
  },
  servedBtn: {
    backgroundColor: '#3b82f6',
  },
  recallBtn: {
    backgroundColor: '#475569',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyDesc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
