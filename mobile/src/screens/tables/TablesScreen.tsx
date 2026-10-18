import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { apiFetch } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Utensils,
  Bell,
  FileText,
  CheckCircle2,
  Users,
  Clock,
  CheckCheck,
} from 'lucide-react-native';

export interface TableItem {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity?: number;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export interface TableEvent {
  id: string;
  tableId: string;
  type: 'CALL_WAITER' | 'REQUEST_BILL';
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  table?: {
    tableNumber: string;
  };
}

const TABLE_FILTERS = ['ALL', 'AVAILABLE', 'OCCUPIED', 'ALERTS'];

export function TablesScreen() {
  const { activeStore } = useAuthStore();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [events, setEvents] = useState<TableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const fetchTableData = async () => {
    try {
      const [tablesData, eventsData] = await Promise.all([
        apiFetch<TableItem[]>('/api/tables', { tenantSlug: activeStore?.slug }),
        apiFetch<TableEvent[]>('/api/tables/events', { tenantSlug: activeStore?.slug }).catch(() => []),
      ]);
      const tablesList = Array.isArray(tablesData) ? tablesData : (tablesData as any)?.tables || [];
      const eventsList = Array.isArray(eventsData) ? eventsData : (eventsData as any)?.events || [];
      setTables(tablesList);
      setEvents(eventsList);
    } catch (err: any) {
      console.warn('Error fetching tables:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTableData();
    const interval = setInterval(fetchTableData, 8000);
    return () => clearInterval(interval);
  }, [activeStore?.slug]);

  const handleResolveEvent = async (eventId: string) => {
    try {
      await apiFetch(`/api/tables/events/${eventId}/resolve`, {
        method: 'PATCH',
        tenantSlug: activeStore?.slug,
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      console.error('Failed to resolve event:', err.message);
    }
  };

  // 1-Tap "Bill & Settle Table"
  const handleSettleTable = async (table: TableItem) => {
    Alert.alert(
      `Settle Table T-${table.tableNumber}`,
      `Mark bill as paid and vacate Table T-${table.tableNumber} for new guests?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle & Free Table',
          style: 'default',
          onPress: async () => {
            try {
              // 1. Update table status to AVAILABLE
              await apiFetch(`/api/tables/${table.id}`, {
                method: 'PATCH',
                tenantSlug: activeStore?.slug,
                body: JSON.stringify({ status: 'AVAILABLE' }),
              });

              // 2. Resolve any pending events for this table
              const tableEvents = events.filter(
                (e) => (e.tableId === table.id || e.table?.tableNumber === table.tableNumber) && e.status === 'PENDING'
              );
              for (const ev of tableEvents) {
                await apiFetch(`/api/tables/events/${ev.id}/resolve`, {
                  method: 'PATCH',
                  tenantSlug: activeStore?.slug,
                }).catch(() => {});
              }

              // 3. Local optimistic update
              setTables((prev) =>
                prev.map((t) => (t.id === table.id ? { ...t, status: 'AVAILABLE' } : t))
              );
              setEvents((prev) =>
                prev.filter(
                  (e) => !(e.tableId === table.id || e.table?.tableNumber === table.tableNumber)
                )
              );

              Alert.alert('Table Settled!', `Table T-${table.tableNumber} is now Available.`);
            } catch (err: any) {
              Alert.alert('Failed to Settle Table', err.message || 'Error updating table status');
            }
          },
        },
      ]
    );
  };

  // Stats calculation
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const availableCount = tables.filter((t) => t.status !== 'OCCUPIED').length;
  const alertsCount = events.filter((e) => e.status === 'PENDING').length;

  const filteredTables = useMemo(() => {
    return tables.filter((item) => {
      const tableEvents = events.filter(
        (e) => (e.tableId === item.id || e.table?.tableNumber === item.tableNumber) && e.status === 'PENDING'
      );
      const hasAlert = tableEvents.length > 0;
      const isOccupied = item.status === 'OCCUPIED';

      if (selectedFilter === 'AVAILABLE') return !isOccupied && !hasAlert;
      if (selectedFilter === 'OCCUPIED') return isOccupied;
      if (selectedFilter === 'ALERTS') return hasAlert;
      return true;
    });
  }, [tables, events, selectedFilter]);

  const renderTable = ({ item }: { item: TableItem }) => {
    const tableEvents = events.filter(
      (e) => (e.tableId === item.id || e.table?.tableNumber === item.tableNumber) && e.status === 'PENDING'
    );
    const hasWaiterCall = tableEvents.some((e) => e.type === 'CALL_WAITER');
    const hasBillRequest = tableEvents.some((e) => e.type === 'REQUEST_BILL');
    const hasAlert = hasWaiterCall || hasBillRequest;
    const isOccupied = item.status === 'OCCUPIED';

    return (
      <View
        style={[
          styles.tableCard,
          hasAlert && styles.tableCardAlert,
          isOccupied && !hasAlert && styles.tableCardOccupied,
          !isOccupied && !hasAlert && styles.tableCardAvailable,
        ]}
      >
        {/* Table Number & Capacity */}
        <View style={styles.tableTop}>
          <View
            style={[
              styles.numberBadge,
              hasAlert && styles.numBadgeAlert,
              isOccupied && !hasAlert && styles.numBadgeOccupied,
              !isOccupied && !hasAlert && styles.numBadgeAvailable,
            ]}
          >
            <Text
              style={[
                styles.tableNumText,
                hasAlert && styles.textAlert,
                isOccupied && !hasAlert && styles.textOccupied,
                !isOccupied && !hasAlert && styles.textAvailable,
              ]}
            >
              {item.tableNumber.startsWith('T') ? item.tableNumber : `T-${item.tableNumber}`}
            </Text>
          </View>

          <View style={styles.seatsBadge}>
            <Users size={12} color="#64748b" />
            <Text style={styles.capacityText}>{item.capacity || 4}</Text>
          </View>
        </View>

        {/* Live Service Alerts (Waiter Call or Bill Request) */}
        {hasWaiterCall ? (
          <View style={[styles.eventBadge, { backgroundColor: '#fee2e2' }]}>
            <Bell size={13} color="#dc2626" />
            <Text style={[styles.eventText, { color: '#dc2626' }]}>Waitress Called</Text>
          </View>
        ) : null}

        {hasBillRequest ? (
          <View style={[styles.eventBadge, { backgroundColor: '#eff6ff' }]}>
            <FileText size={13} color="#2563eb" />
            <Text style={[styles.eventText, { color: '#2563eb' }]}>Bill Requested</Text>
          </View>
        ) : null}

        {/* Action Button or Status Pill */}
        {hasAlert ? (
          <TouchableOpacity
            style={styles.resolveBtn}
            onPress={() => handleResolveEvent(tableEvents[0].id)}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={14} color="#ffffff" />
            <Text style={styles.resolveText}>Acknowledge</Text>
          </TouchableOpacity>
        ) : isOccupied ? (
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={() => handleSettleTable(item)}
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color="#ffffff" />
            <Text style={styles.settleBtnText}>Bill & Settle</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.vacantPill}>
            <View style={styles.vacantDot} />
            <Text style={styles.vacantText}>Available</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Utensils size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>Dine-in Tables & Service</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Live Table Occupancy Map & Waiter Call System
        </Text>

        {/* Table Occupancy Metrics Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalTables}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxAvailable]}>
            <Text style={[styles.statNum, { color: '#16a34a' }]}>{availableCount}</Text>
            <Text style={[styles.statLabel, { color: '#16a34a' }]}>Available</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxOccupied]}>
            <Text style={[styles.statNum, { color: '#d97706' }]}>{occupiedCount}</Text>
            <Text style={[styles.statLabel, { color: '#d97706' }]}>Occupied</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxAlert]}>
            <Text style={[styles.statNum, { color: '#dc2626' }]}>{alertsCount}</Text>
            <Text style={[styles.statLabel, { color: '#dc2626' }]}>Calls</Text>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {TABLE_FILTERS.map((f) => {
          const isSelected = selectedFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          keyExtractor={(item) => item.id}
          renderItem={renderTable}
          numColumns={2}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTableData();
              }}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No tables match this filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBoxAvailable: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statBoxOccupied: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statBoxAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  grid: {
    padding: 12,
    gap: 12,
  },
  tableCard: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  tableCardAvailable: {
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  tableCardOccupied: {
    borderColor: '#fde68a',
    backgroundColor: '#fffdfa',
  },
  tableCardAlert: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  tableTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  numBadgeAvailable: {
    backgroundColor: '#dcfce7',
  },
  numBadgeOccupied: {
    backgroundColor: '#fef3c7',
  },
  numBadgeAlert: {
    backgroundColor: '#fee2e2',
  },
  tableNumText: {
    fontSize: 15,
    fontWeight: '900',
  },
  textAvailable: {
    color: '#16a34a',
  },
  textOccupied: {
    color: '#d97706',
  },
  textAlert: {
    color: '#dc2626',
  },
  seatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 6,
  },
  eventText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vacantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  vacantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  vacantText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  resolveText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
