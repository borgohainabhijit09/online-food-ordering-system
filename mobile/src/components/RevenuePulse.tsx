import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import {
  TimeframeFilter,
  RevenueMetrics,
  OperationalAlerts,
  computeRevenueMetrics,
  computeOperationalAlerts,
  Order,
} from '../store/useOrdersStore';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bell,
  CheckCircle,
} from 'lucide-react-native';

interface RevenuePulseProps {
  orders: Order[];
  timeframe: TimeframeFilter;
  onSelectTimeframe: (tf: TimeframeFilter) => void;
  onAlertFilterPress?: (filter: string) => void;
}

const TIMEFRAMES: { key: TimeframeFilter; label: string }[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7_DAYS', label: 'Last 7D' },
  { key: '30_DAYS', label: 'Last 30D' },
  { key: 'ALL_TIME', label: 'All Time' },
];

export function RevenuePulse({
  orders,
  timeframe,
  onSelectTimeframe,
  onAlertFilterPress,
}: RevenuePulseProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const metrics: RevenueMetrics = computeRevenueMetrics(orders, timeframe);
  const alerts: OperationalAlerts = computeOperationalAlerts(orders);

  return (
    <View style={styles.container}>
      {/* Timeframe Filter Tabs */}
      <View style={styles.timeframeRow}>
        <View style={styles.tabsContainer}>
          {TIMEFRAMES.map((tf) => {
            const isSelected = tf.key === timeframe;
            return (
              <TouchableOpacity
                key={tf.key}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => onSelectTimeframe(tf.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.collapseToggle}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          {isExpanded ? (
            <ChevronUp size={16} color={Colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main KPI Card */}
      {isExpanded ? (
        <View style={styles.kpiCard}>
          {/* Top Row: Total Sales & Order Count */}
          <View style={styles.topKpiRow}>
            <View>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={styles.revenueAmount}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.orderCountBadge}>
              <TrendingUp size={14} color={Colors.primary} />
              <Text style={styles.orderCountText}>{metrics.ordersCount} Orders</Text>
            </View>
          </View>

          {/* Breakdown Pills: Cash vs Online & AOV */}
          <View style={styles.breakdownRow}>
            {/* Cash in Drawer */}
            <View style={styles.pillItem}>
              <View style={[styles.pillIcon, { backgroundColor: '#ecfdf5' }]}>
                <Banknote size={13} color="#059669" />
              </View>
              <View>
                <Text style={styles.pillLabel}>Cash in Till</Text>
                <Text style={[styles.pillValue, { color: '#059669' }]}>
                  ₹{metrics.cashRevenue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Online / UPI */}
            <View style={styles.pillItem}>
              <View style={[styles.pillIcon, { backgroundColor: '#eff6ff' }]}>
                <CreditCard size={13} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.pillLabel}>Online / UPI</Text>
                <Text style={[styles.pillValue, { color: '#2563eb' }]}>
                  ₹{metrics.onlineRevenue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Average Order Value */}
            <View style={styles.pillItem}>
              <View style={[styles.pillIcon, { backgroundColor: '#faf5ff' }]}>
                <Clock size={13} color="#7c3aed" />
              </View>
              <View>
                <Text style={styles.pillLabel}>Avg Order</Text>
                <Text style={[styles.pillValue, { color: '#7c3aed' }]}>
                  ₹{metrics.avgOrderValue}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Compact Single Row when Collapsed */
        <View style={styles.compactRow}>
          <Text style={styles.compactRevenue}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</Text>
          <Text style={styles.compactSub}>
            • {metrics.ordersCount} orders • Cash: ₹{metrics.cashRevenue} • Online: ₹{metrics.onlineRevenue}
          </Text>
        </View>
      )}

      {/* Live Operational Alerts Strip */}
      <View style={styles.alertsContainer}>
        {alerts.delayedCount > 0 ? (
          <TouchableOpacity
            style={[styles.alertChip, styles.alertChipDelayed]}
            onPress={() => onAlertFilterPress?.('DELAYED')}
            activeOpacity={0.8}
          >
            <AlertTriangle size={13} color="#b91c1c" />
            <Text style={styles.alertChipTextDelayed}>
              {alerts.delayedCount} Delayed (&gt;20m)
            </Text>
          </TouchableOpacity>
        ) : null}

        {alerts.pendingCount > 0 ? (
          <TouchableOpacity
            style={[styles.alertChip, styles.alertChipPending]}
            onPress={() => onAlertFilterPress?.('PENDING')}
            activeOpacity={0.8}
          >
            <Bell size={13} color="#c2410c" />
            <Text style={styles.alertChipTextPending}>
              {alerts.pendingCount} Pending Accept
            </Text>
          </TouchableOpacity>
        ) : null}

        {alerts.readyCount > 0 ? (
          <TouchableOpacity
            style={[styles.alertChip, styles.alertChipReady]}
            onPress={() => onAlertFilterPress?.('READY')}
            activeOpacity={0.8}
          >
            <CheckCircle size={13} color="#15803d" />
            <Text style={styles.alertChipTextReady}>
              {alerts.readyCount} Food Ready
            </Text>
          </TouchableOpacity>
        ) : null}

        {alerts.delayedCount === 0 && alerts.pendingCount === 0 && alerts.readyCount === 0 ? (
          <View style={styles.allClearChip}>
            <CheckCircle size={12} color="#16a34a" />
            <Text style={styles.allClearText}>Kitchen & Orders Running Smoothly</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    flex: 1,
    marginRight: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  collapseToggle: {
    padding: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  topKpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9a3412',
    letterSpacing: 0.5,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 2,
  },
  orderCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 4,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  pillItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  pillValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  compactRevenue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  compactSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  alertsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  alertChipDelayed: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertChipTextDelayed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  alertChipPending: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  alertChipTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c2410c',
  },
  alertChipReady: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  alertChipTextReady: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  allClearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  allClearText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
});
