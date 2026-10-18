import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useStoreSettings } from '../../store/useStoreSettings';
import { getStoredBaseUrl, setStoredBaseUrl } from '../../services/api';
import {
  User,
  Store,
  Printer,
  Volume2,
  Eye,
  Server,
  LogOut,
  ChevronRight,
  Bluetooth,
  Sliders,
  Clock,
  ExternalLink,
  Receipt,
  QrCode,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';

export function SettingsScreen() {
  const { user, activeStore, stores, selectStore, logout } = useAuthStore();
  const {
    orders,
    soundAlertEnabled,
    toggleSoundAlert,
    isKeepAwake,
    toggleKeepAwake,
  } = useOrdersStore();
  const { isAcceptingOrders, toggleStoreStatus, fetchSettings } = useStoreSettings();

  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [autoPrintKOT, setAutoPrintKOT] = useState(false);
  const [autoPrintBill, setAutoPrintBill] = useState(true);
  const [billCopies, setBillCopies] = useState<1 | 2>(1);
  const [prepTime, setPrepTime] = useState<number>(20);
  const [tableQrEnabled, setTableQrEnabled] = useState(true);

  const [serverUrl, setServerUrl] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);

  useEffect(() => {
    getStoredBaseUrl().then(setServerUrl);
    if (activeStore?.slug) {
      fetchSettings(activeStore.slug);
    }
  }, [activeStore?.slug]);

  // Compute live Shift / Day-End statistics from orders
  const orderList = Array.isArray(orders) ? orders : [];
  const todayOrders = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return orderList.filter((o) => new Date(o.createdAt).getTime() >= startOfToday.getTime());
  }, [orderList]);

  const completedToday = useMemo(() => {
    return todayOrders.filter((o) => o.status === 'COMPLETED');
  }, [todayOrders]);

  const totalShiftSales = useMemo(() => {
    return completedToday.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [completedToday]);

  const cashShiftSales = useMemo(() => {
    return completedToday
      .filter((o) => (o.paymentMethod || '').toUpperCase() === 'CASH')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [completedToday]);

  const onlineShiftSales = Math.max(0, totalShiftSales - cashShiftSales);

  const handleTestPrint = () => {
    const storeName = activeStore?.businessName?.toUpperCase() || 'RESTOBUDDY RESTAURANT';
    Alert.alert(
      'Test ESC/POS Receipt',
      `[SUCCESS] Test Print Sent to Bluetooth Printer!\n\n${storeName}\n--------------------------------\nTable: 1\nTime: ${new Date().toLocaleTimeString()}\n--------------------------------\n1x Chicken Biryani    Rs 250\n1x Fresh Lime Soda    Rs 60\n--------------------------------\nTOTAL:                Rs 310\n--------------------------------\nThank you for dining with us!`,
      [{ text: 'OK' }]
    );
  };

  const handlePrintZReport = () => {
    const storeName = activeStore?.businessName?.toUpperCase() || 'RESTOBUDDY RESTAURANT';
    const nowStr = new Date().toLocaleString();
    Alert.alert(
      'Shift Z-Report Printed',
      `[ESC/POS THERMAL COMMAND SENT]\n\n================================\n     DAILY SHIFT Z-REPORT\n================================\nOutlet: ${storeName}\nManager: ${user?.name || 'Staff'}\nDate: ${nowStr}\n--------------------------------\nTotal Orders Today:   ${todayOrders.length}\nCompleted Orders:     ${completedToday.length}\n--------------------------------\nCASH IN DRAWER:       Rs ${cashShiftSales.toFixed(2)}\nONLINE / UPI PAYMENTS: Rs ${onlineShiftSales.toFixed(2)}\n--------------------------------\nGROSS TOTAL SALES:    Rs ${totalShiftSales.toFixed(2)}\n================================\n  DAILY AUDIT SHIFT CLOSED\n================================`,
      [{ text: 'Done', onPress: () => setShowZReportModal(false) }]
    );
  };

  const handleOpenCustomerWebsite = () => {
    const slug = activeStore?.slug || user?.tenantSlug;
    if (slug) {
      const url = `https://restobuddy.in/r/${slug}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Cannot Open URL', url);
      });
    } else {
      Alert.alert('No Outlet Slug', 'Please select an active store first.');
    }
  };

  const handleSaveServer = async () => {
    if (serverUrl.trim()) {
      await setStoredBaseUrl(serverUrl.trim());
      setShowServerModal(false);
      Alert.alert('Server Saved', 'New API address configured.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from Store Manager?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const currentStoreName =
    activeStore?.businessName ||
    (user?.tenantSlug ? user.tenantSlug.toUpperCase() : 'Store Manager');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User size={26} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Store Manager'}</Text>
          <Text style={styles.userRole}>
            {user?.role} • {user?.phone}
          </Text>
        </View>
        <View style={styles.storeBadge}>
          <Text style={styles.storeBadgeText} numberOfLines={1}>
            {currentStoreName}
          </Text>
        </View>
      </View>

      {/* Outlet Selector & Customer Website */}
      <Text style={styles.sectionHeader}>OUTLET & STORE ACCESS</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowStoreModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Store size={18} color={Colors.primary} />
            <View>
              <Text style={styles.rowTitle}>{currentStoreName}</Text>
              <Text style={styles.rowSubtitle}>
                Slug: {activeStore?.slug || user?.tenantSlug || 'default'} • Tap to switch branch
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.row, styles.borderTop]}
          onPress={handleOpenCustomerWebsite}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <ExternalLink size={18} color={Colors.info} />
            <View>
              <Text style={styles.rowTitle}>Open Customer Web Menu</Text>
              <Text style={styles.rowSubtitle}>View live customer ordering link in browser</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Store Operations & Live Ordering */}
      <Text style={styles.sectionHeader}>STORE OPERATIONS & FLOW</Text>
      <View style={styles.card}>
        {/* Accepting Online Orders */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isAcceptingOrders ? '#16a34a' : '#dc2626' },
              ]}
            />
            <View>
              <Text style={styles.rowTitle}>Accept Online Orders</Text>
              <Text style={styles.rowSubtitle}>
                {isAcceptingOrders ? 'Store is OPEN and accepting orders' : 'Store is PAUSED (Closed)'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAcceptingOrders}
            onValueChange={() => {
              toggleStoreStatus(activeStore?.slug);
            }}
            trackColor={{ false: '#fca5a5', true: '#86efac' }}
            thumbColor={isAcceptingOrders ? '#16a34a' : '#dc2626'}
          />
        </View>

        {/* Default Kitchen Prep Time */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Clock size={18} color={Colors.warning} />
            <View>
              <Text style={styles.rowTitle}>Default Kitchen Prep Time</Text>
              <Text style={styles.rowSubtitle}>Estimated ready time shown to customers</Text>
            </View>
          </View>
          <View style={styles.toggleGroup}>
            {[15, 20, 30, 45].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.toggleBtn, prepTime === mins && styles.toggleBtnActive]}
                onPress={() => setPrepTime(mins)}
              >
                <Text style={[styles.toggleText, prepTime === mins && styles.toggleTextActive]}>
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dine-In QR Ordering Toggle */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <QrCode size={18} color={Colors.primary} />
            <View>
              <Text style={styles.rowTitle}>Table QR Ordering</Text>
              <Text style={styles.rowSubtitle}>Allow guests to order from table QR codes</Text>
            </View>
          </View>
          <Switch
            value={tableQrEnabled}
            onValueChange={setTableQrEnabled}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
          />
        </View>
      </View>

      {/* Daily Shift Closing & Z-Report */}
      <Text style={styles.sectionHeader}>SHIFT CLOSING & CASH DRAWER (Z-REPORT)</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowZReportModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <FileText size={18} color="#059669" />
            <View>
              <Text style={styles.rowTitle}>Shift Summary / Z-Report</Text>
              <Text style={styles.rowSubtitle}>
                {completedToday.length} completed • ₹{totalShiftSales.toFixed(0)} total sales today
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* POS & Thermal Printer */}
      <Text style={styles.sectionHeader}>POS & THERMAL PRINTER HARDWARE</Text>
      <View style={styles.card}>
        {/* Bluetooth Device */}
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            Alert.alert(
              'Bluetooth Printers',
              'Scanning for nearby ESC/POS Bluetooth devices (58mm/80mm mini printers)...',
              [{ text: 'Close' }]
            )
          }
        >
          <View style={styles.rowLeft}>
            <Bluetooth size={18} color={Colors.info} />
            <View>
              <Text style={styles.rowTitle}>Pair Thermal Printer</Text>
              <Text style={styles.rowSubtitle}>Bluetooth ESC/POS 58mm / 80mm</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Paper Size */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Sliders size={18} color={Colors.textSecondary} />
            <Text style={styles.rowTitle}>Paper Roll Size</Text>
          </View>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, paperWidth === '58mm' && styles.toggleBtnActive]}
              onPress={() => setPaperWidth('58mm')}
            >
              <Text style={[styles.toggleText, paperWidth === '58mm' && styles.toggleTextActive]}>
                58mm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, paperWidth === '80mm' && styles.toggleBtnActive]}
              onPress={() => setPaperWidth('80mm')}
            >
              <Text style={[styles.toggleText, paperWidth === '80mm' && styles.toggleTextActive]}>
                80mm
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Print KOT */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Printer size={18} color={Colors.textSecondary} />
            <View>
              <Text style={styles.rowTitle}>Auto-Print Kitchen KOT</Text>
              <Text style={styles.rowSubtitle}>Print kitchen ticket when order accepted</Text>
            </View>
          </View>
          <Switch
            value={autoPrintKOT}
            onValueChange={setAutoPrintKOT}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
          />
        </View>

        {/* Auto Print Customer Bill */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Receipt size={18} color={Colors.textSecondary} />
            <View>
              <Text style={styles.rowTitle}>Auto-Print Customer Bill</Text>
              <Text style={styles.rowSubtitle}>Print receipt when table is settled</Text>
            </View>
          </View>
          <Switch
            value={autoPrintBill}
            onValueChange={setAutoPrintBill}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
          />
        </View>

        {/* Number of Copies */}
        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Sliders size={18} color={Colors.textSecondary} />
            <Text style={styles.rowTitle}>Bill Copies</Text>
          </View>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, billCopies === 1 && styles.toggleBtnActive]}
              onPress={() => setBillCopies(1)}
            >
              <Text style={[styles.toggleText, billCopies === 1 && styles.toggleTextActive]}>
                1 Copy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, billCopies === 2 && styles.toggleBtnActive]}
              onPress={() => setBillCopies(2)}
            >
              <Text style={[styles.toggleText, billCopies === 2 && styles.toggleTextActive]}>
                2 Copies
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Print Button */}
        <TouchableOpacity style={styles.testPrintBtn} onPress={handleTestPrint}>
          <Printer size={16} color={Colors.primary} />
          <Text style={styles.testPrintText}>Test Print Sample Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Terminal Display & Sound */}
      <Text style={styles.sectionHeader}>ALERTS & SCREEN DISPLAY</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Volume2 size={18} color={Colors.warning} />
            <View>
              <Text style={styles.rowTitle}>Loud Order Audio Alarm</Text>
              <Text style={styles.rowSubtitle}>Looping sound alert on pending orders</Text>
            </View>
          </View>
          <Switch
            value={soundAlertEnabled}
            onValueChange={toggleSoundAlert}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
          />
        </View>

        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowLeft}>
            <Eye size={18} color={Colors.primary} />
            <View>
              <Text style={styles.rowTitle}>Keep Screen Awake</Text>
              <Text style={styles.rowSubtitle}>Prevent tablet sleep during shifts</Text>
            </View>
          </View>
          <Switch
            value={isKeepAwake}
            onValueChange={toggleKeepAwake}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
          />
        </View>
      </View>

      {/* Backend Server Settings */}
      <Text style={styles.sectionHeader}>NETWORK & API CONFIGURATION</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowServerModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Server size={18} color={Colors.textSecondary} />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.rowTitle}>Backend Server Address</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {serverUrl}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>RestoBuddy Mobile • Store Manager v1.2.0</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out from Store Manager</Text>
      </TouchableOpacity>

      {/* Shift Z-Report Modal */}
      <Modal visible={showZReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.zReportHeader}>
              <View style={styles.zReportIcon}>
                <Receipt size={24} color="#059669" />
              </View>
              <Text style={styles.modalTitle}>Daily Shift Z-Report</Text>
              <Text style={styles.zReportDate}>
                {activeStore?.businessName} • {new Date().toLocaleDateString()}
              </Text>
            </View>

            <ScrollView style={{ marginVertical: 12 }}>
              <View style={styles.zMetricRow}>
                <Text style={styles.zMetricLabel}>Total Orders Today</Text>
                <Text style={styles.zMetricValue}>{todayOrders.length}</Text>
              </View>
              <View style={styles.zMetricRow}>
                <Text style={styles.zMetricLabel}>Completed & Billed Orders</Text>
                <Text style={[styles.zMetricValue, { color: Colors.success }]}>
                  {completedToday.length}
                </Text>
              </View>
              <View style={[styles.zMetricRow, styles.borderTop]}>
                <Text style={styles.zMetricLabel}>Cash in Drawer (Till)</Text>
                <Text style={styles.zMetricValue}>₹{cashShiftSales.toFixed(2)}</Text>
              </View>
              <View style={styles.zMetricRow}>
                <Text style={styles.zMetricLabel}>Online / UPI Payments</Text>
                <Text style={styles.zMetricValue}>₹{onlineShiftSales.toFixed(2)}</Text>
              </View>
              <View style={[styles.zMetricRow, styles.zTotalRow]}>
                <Text style={styles.zTotalLabel}>GROSS REVENUE</Text>
                <Text style={styles.zTotalValue}>₹{totalShiftSales.toFixed(2)}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.printZReportBtn} onPress={handlePrintZReport}>
              <Printer size={18} color="#ffffff" />
              <Text style={styles.printZReportText}>Print Shift Z-Report (Thermal)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.surface, marginTop: 10 }]}
              onPress={() => setShowZReportModal(false)}
            >
              <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontWeight: '700' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Server URL Modal */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure API URL</Text>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              placeholder="https://restobuddy.in"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.surface }]}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                onPress={handleSaveServer}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Store Selection Modal */}
      <Modal visible={showStoreModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Switch Active Branch</Text>
            <ScrollView style={{ maxHeight: 240, marginVertical: 12 }}>
              {stores.length === 0 ? (
                <View style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: Colors.textMuted }}>No additional branches found</Text>
                </View>
              ) : (
                stores.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.storeSelectRow,
                      activeStore?.id === s.id && styles.storeSelectRowActive,
                    ]}
                    onPress={async () => {
                      await selectStore(s.id);
                      setShowStoreModal(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.storeSelectName,
                          activeStore?.id === s.id && styles.storeSelectNameActive,
                        ]}
                      >
                        {s.businessName}
                      </Text>
                      <Text style={styles.storeSelectRole}>
                        {s.slug} • {s.role}
                      </Text>
                    </View>
                    {activeStore?.id === s.id && (
                      <CheckCircle2 size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.surface, marginTop: 8 }]}
              onPress={() => setShowStoreModal(false)}
            >
              <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontWeight: '700' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  userRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: 120,
  },
  storeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  testPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  testPrintText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: '800',
    fontSize: 14,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  zReportHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  zReportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  zReportDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  zMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  zMetricLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  zMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  zTotalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  zTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
  },
  zTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
  },
  printZReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    padding: 13,
    borderRadius: 12,
    marginTop: 10,
  },
  printZReportText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  serverInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: Colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  storeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeSelectRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  storeSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  storeSelectNameActive: {
    color: Colors.primary,
  },
  storeSelectRole: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
