import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, UtensilsCrossed, Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCustomerStore } from '../store/useCustomerStore';

const POPULAR_RESTAURANTS = [
  { name: 'Bamboho', slug: 'bamboho' },
  { name: 'Singpho Shat Gawk', slug: 'singpho' },
  { name: 'Eat Street', slug: 'eat-street' },
  { name: 'Demo Restaurant', slug: 'demo-restaurant' },
];

export const DineInScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const setTableNumber = useCustomerStore((s) => s.setTableNumber);

  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState('bamboho');
  const [tableInput, setTableInput] = useState('');
  const [qrRawInput, setQrRawInput] = useState('');

  const handleOpenTableMenu = () => {
    const table = tableInput.trim() || 'T-01';
    setTableNumber(table);
    navigation.navigate('RestaurantDetail', { slug: selectedRestaurantSlug });
  };

  const handleSimulateQrScan = () => {
    // Parse simulated QR string or URL
    // e.g. "https://bamboho.restobuddy.in/table/T-04" or "bamboho/T-04"
    const raw = qrRawInput.trim();
    if (!raw) {
      // Default sample table scan
      setTableNumber('T-04');
      navigation.navigate('RestaurantDetail', { slug: 'bamboho' });
      return;
    }

    try {
      let slug = 'bamboho';
      let table = 'T-01';

      if (raw.includes('/table/')) {
        const parts = raw.split('/table/');
        table = decodeURIComponent(parts[1]);
        const domain = parts[0].replace('https://', '').replace('http://', '');
        slug = domain.split('.')[0];
      } else if (raw.includes('/')) {
        const parts = raw.split('/');
        slug = parts[0];
        table = parts[1];
      } else {
        slug = raw;
      }

      setTableNumber(table);
      navigation.navigate('RestaurantDetail', { slug });
    } catch {
      Alert.alert('Invalid QR Code', 'Please enter a valid table QR URL or select below.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <UtensilsCrossed size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Contactless Dine-In</Text>
        </View>
        <View style={styles.headerTag}>
          <Sparkles size={11} color="#b45309" />
          <Text style={styles.headerTagText}>Instant Kitchen</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* QR Visual Box */}
        <View style={styles.qrHeroBox}>
          <View style={styles.qrFrame}>
            <QrCode size={90} color={colors.primary} />
          </View>
          <Text style={styles.qrHeroTitle}>Scan QR Code on Table</Text>
          <Text style={styles.qrHeroSubtitle}>
            Point your camera at the QR code standee on your restaurant table to instantly order.
          </Text>

          {/* Simulate Scan Button */}
          <TouchableOpacity
            style={styles.scanSimulateBtn}
            onPress={handleSimulateQrScan}
            activeOpacity={0.85}
          >
            <QrCode size={18} color="#ffffff" />
            <Text style={styles.scanSimulateBtnText}>Scan Table QR (Auto-Detect)</Text>
          </TouchableOpacity>
        </View>

        {/* Manual Table Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Or Select Your Table Manually</Text>

          {/* Select Restaurant */}
          <Text style={styles.fieldLabel}>Select Restaurant:</Text>
          <View style={styles.restaurantRow}>
            {POPULAR_RESTAURANTS.map((r) => {
              const isSelected = selectedRestaurantSlug === r.slug;
              return (
                <TouchableOpacity
                  key={r.slug}
                  style={[styles.restaurantPill, isSelected && styles.restaurantPillActive]}
                  onPress={() => setSelectedRestaurantSlug(r.slug)}
                >
                  <Text style={[styles.restaurantPillText, isSelected && styles.restaurantPillTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Table Number Input */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Enter Table Number:</Text>
          <TextInput
            style={styles.textInput}
            value={tableInput}
            onChangeText={setTableInput}
            placeholder="e.g. Table 04, T-12, Outdoor 3"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={styles.openMenuBtn}
            onPress={handleOpenTableMenu}
            activeOpacity={0.85}
          >
            <Text style={styles.openMenuBtnText}>View Menu & Order</Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Benefits Row */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why Dine-In with RestoBuddy?</Text>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconCircle}>
              <Zap size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Zero Waiting Time</Text>
              <Text style={styles.benefitDesc}>Orders are beamed straight to the kitchen display / KOT printer.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconCircle}>
              <ShieldCheck size={18} color="#15803d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>Contactless & Safe</Text>
              <Text style={styles.benefitDesc}>Browse complete dish ingredients, customizations, and dietary tags.</Text>
            </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  qrHeroBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  qrFrame: {
    width: 130,
    height: 130,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  qrHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  qrHeroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  scanSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanSimulateBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  restaurantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restaurantPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restaurantPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  restaurantPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  restaurantPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  openMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  openMenuBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 12,
  },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
