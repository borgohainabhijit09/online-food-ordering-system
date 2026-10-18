import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  MapPin,
  Save,
  Server,
  Package,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Gift,
  LogOut,
  Sparkles,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCustomerStore } from '../store/useCustomerStore';
import { PhoneAuthModal } from '../components/PhoneAuthModal';
import { AddressModal } from '../components/AddressModal';
import {
  DEFAULT_API_URL,
  PROD_API_URL,
  LOCAL_API_URL,
  getStoredBaseUrl,
  setStoredBaseUrl,
  getRestaurants,
  saveCustomerProfile,
} from '../services/api';

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const profile = useCustomerStore((s) => s.profile);
  const isLoggedIn = useCustomerStore((s) => s.isLoggedIn);
  const loyaltyPasses = useCustomerStore((s) => s.loyaltyPasses);
  const totalPastOrders = useCustomerStore((s) => s.totalPastOrders);
  const savedAddresses = useCustomerStore((s) => s.savedAddresses);
  const deliveryAddress = useCustomerStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCustomerStore((s) => s.setDeliveryAddress);
  const removeSavedAddress = useCustomerStore((s) => s.removeSavedAddress);
  const setProfile = useCustomerStore((s) => s.setProfile);
  const logout = useCustomerStore((s) => s.logout);
  const refreshProfile = useCustomerStore((s) => s.refreshProfile);

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [name, setName] = useState(profile.name || '');
  const [savingName, setSavingName] = useState(false);

  // Server switcher
  const [currentBaseUrl, setCurrentBaseUrl] = useState(DEFAULT_API_URL);
  const [customUrl, setCustomUrl] = useState('');
  const [testingPing, setTestingPing] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);

  useEffect(() => {
    setName(profile.name || '');
  }, [profile.name]);

  useEffect(() => {
    getStoredBaseUrl().then((url) => {
      setCurrentBaseUrl(url);
      setCustomUrl(url);
    });
  }, []);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    setProfile({ name: name.trim() });
    if (profile.phone) {
      await saveCustomerProfile({ phone: profile.phone, name: name.trim() });
    }
    setSavingName(false);
    Alert.alert('Profile Saved', 'Your name has been updated.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out or switch mobile number?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleSwitchServer = async (targetUrl: string) => {
    await setStoredBaseUrl(targetUrl);
    setCurrentBaseUrl(targetUrl);
    setCustomUrl(targetUrl);
    setPingSuccess(null);
    Alert.alert('Server Updated', `API endpoint set to:\n${targetUrl}`);
  };

  const testConnection = async () => {
    setTestingPing(true);
    setPingSuccess(null);
    try {
      const res = await getRestaurants();
      if (!res || res.length === 0) {
        throw new Error('No active restaurants responded.');
      }
      setPingSuccess(true);
      Alert.alert('Connection Successful!', `Connected to RestoBuddy API (${res.length} restaurants online).`);
    } catch (err: any) {
      setPingSuccess(false);
      Alert.alert('Connection Failed', err.message || 'Could not connect to server.');
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <User size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Account & Profile</Text>
        </View>
        {isLoggedIn && (
          <TouchableOpacity onPress={() => refreshProfile()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RefreshCw size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          /* ================= GUEST STATE ================= */
          <View style={styles.guestCard}>
            <View style={styles.guestIconCircle}>
              <Sparkles size={32} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to RestoBuddy Food</Text>
            <Text style={styles.guestSubtitle}>
              Sign in with your mobile number to access your saved delivery addresses, past orders, and restaurant loyalty rewards.
            </Text>

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => setAuthModalVisible(true)}
              activeOpacity={0.85}
            >
              <Phone size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.signInBtnText}>Sign In with Mobile</Text>
            </TouchableOpacity>

            {/* Perks list */}
            <View style={styles.perksList}>
              <View style={styles.perkRow}>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text style={styles.perkRowText}>Faster 1-tap ordering (no retyping address)</Text>
              </View>
              <View style={styles.perkRow}>
                <Gift size={16} color="#f59e0b" />
                <Text style={styles.perkRowText}>Earn & redeem loyalty points at Bamboho & partners</Text>
              </View>
              <View style={styles.perkRow}>
                <Package size={16} color={colors.primary} />
                <Text style={styles.perkRowText}>Track live deliveries and view full order history</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ================= LOGGED IN STATE ================= */
          <>
            {/* User Profile Card */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.profileAvatarCircle}>
                <Text style={styles.profileAvatarText}>
                  {(profile.name || 'User').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.profileName}>{profile.name || 'Foodie'}</Text>
                <View style={styles.phoneBadgeRow}>
                  <Phone size={12} color={colors.textSecondary} />
                  <Text style={styles.profilePhone}>+91 {profile.phone}</Text>
                  <View style={styles.verifiedChip}>
                    <ShieldCheck size={11} color="#047857" />
                    <Text style={styles.verifiedChipText}>Verified</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stats Bar */}
            <View style={styles.statsBar}>
              <TouchableOpacity
                style={styles.statBox}
                onPress={() => navigation.navigate('MyOrders')}
                activeOpacity={0.7}
              >
                <Text style={styles.statNumber}>{totalPastOrders}</Text>
                <Text style={styles.statLabel}>Orders Placed</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{loyaltyPasses.length}</Text>
                <Text style={styles.statLabel}>Loyalty Passes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{savedAddresses.length}</Text>
                <Text style={styles.statLabel}>Saved Addresses</Text>
              </View>
            </View>

            {/* Loyalty & Rewards Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Gift size={18} color="#d97706" />
                  <Text style={styles.sectionTitle}>Restaurant Loyalty Rewards</Text>
                </View>
              </View>

              {loyaltyPasses.length > 0 ? (
                <View style={styles.loyaltyList}>
                  {loyaltyPasses.map((pass) => (
                    <View key={pass.tenantId} style={styles.loyaltyPassCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.loyaltyRestName}>{pass.restaurantName}</Text>
                        <Text style={styles.loyaltySubtext}>
                          Min. {pass.minimumPointsToRedeem} points to redeem • 1 pt = ₹{pass.pointValueInRupees}
                        </Text>
                      </View>
                      <View style={styles.loyaltyPointsBadge}>
                        <Text style={styles.loyaltyPointsNum}>{pass.points}</Text>
                        <Text style={styles.loyaltyPointsLabel}>Points</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyLoyaltyBox}>
                  <Text style={styles.emptyLoyaltyTitle}>No Loyalty Points Yet</Text>
                  <Text style={styles.emptyLoyaltySubtitle}>
                    Order from partner restaurants like Bamboho to automatically earn reward points on every order!
                  </Text>
                </View>
              )}
            </View>

            {/* Saved Delivery Addresses Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Saved Addresses</Text>
                </View>
                <TouchableOpacity
                  style={styles.addAddressChip}
                  onPress={() => setAddressModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color={colors.primary} />
                  <Text style={styles.addAddressChipText}>Add Address</Text>
                </TouchableOpacity>
              </View>

              {savedAddresses.length > 0 ? (
                <View style={styles.addressList}>
                  {savedAddresses.map((addr) => {
                    const isSelected = deliveryAddress === addr.address;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[styles.addressItem, isSelected && styles.addressItemActive]}
                        onPress={() => setDeliveryAddress(addr.address, addr.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.addressLabel}>{addr.label}</Text>
                            {isSelected && (
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>Delivering Here</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressText} numberOfLines={2}>
                            {addr.address}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeSavedAddress(addr.id)}
                          style={styles.removeAddrBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={15} color={colors.textMuted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyAddressBox}>
                  <Text style={styles.emptyAddressText}>
                    No saved addresses yet. Tap "+ Add Address" above or set your address on the Explore screen.
                  </Text>
                </View>
              )}
            </View>

            {/* Edit Name & Preferences */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.fieldLabel}>YOUR NAME</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveName}
                    disabled={savingName}
                  >
                    {savingName ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Logout / Switch Account */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={16} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Switch Account / Log Out</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Collapsible Developer Server Settings */}
        <View style={styles.devSection}>
          <TouchableOpacity
            style={styles.devHeader}
            onPress={() => setShowServerSettings(!showServerSettings)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Server size={14} color={colors.textMuted} />
              <Text style={styles.devTitle}>Developer Server Settings</Text>
            </View>
            <ChevronRight
              size={16}
              color={colors.textMuted}
              style={{ transform: [{ rotate: showServerSettings ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showServerSettings && (
            <View style={styles.devBody}>
              <Text style={styles.devSubtitle}>Active Endpoint: {currentBaseUrl}</Text>
              <View style={styles.serverBtnRow}>
                <TouchableOpacity
                  style={[styles.serverChip, currentBaseUrl === PROD_API_URL && styles.serverChipActive]}
                  onPress={() => handleSwitchServer(PROD_API_URL)}
                >
                  <Text style={[styles.serverChipText, currentBaseUrl === PROD_API_URL && styles.serverChipTextActive]}>
                    Production (restobuddy.in)
                  </Text>
                </TouchableOpacity>

                {Boolean(LOCAL_API_URL) && (
                  <TouchableOpacity
                    style={[styles.serverChip, currentBaseUrl === LOCAL_API_URL && styles.serverChipActive]}
                    onPress={() => handleSwitchServer(LOCAL_API_URL!)}
                  >
                    <Text style={[styles.serverChipText, currentBaseUrl === LOCAL_API_URL && styles.serverChipTextActive]}>
                      Local ({LOCAL_API_URL})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.pingBtn}
                onPress={testConnection}
                disabled={testingPing}
              >
                {testingPing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.pingBtnText}>Test Server Connection</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Frictionless Phone Auth Modal */}
      <PhoneAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          Alert.alert('Welcome!', 'Signed in successfully. Your orders and rewards are ready.');
        }}
      />

      {/* Address Picker Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  /* Guest State */
  guestCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 19,
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
    marginBottom: 20,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  perksList: {
    width: '100%',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkRowText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  /* Logged In State */
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profilePhone: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },

  /* Stats Bar */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },

  /* Sections */
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  addAddressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  addAddressChipText: {
    color: colors.primaryDark,
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Loyalty List */
  loyaltyList: {
    gap: 8,
  },
  loyaltyPassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  loyaltyRestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  loyaltySubtext: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  loyaltyPointsBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  loyaltyPointsNum: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  loyaltyPointsLabel: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  emptyLoyaltyBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  emptyLoyaltyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  emptyLoyaltySubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Address List */
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addressItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  activePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  removeAddrBtn: {
    padding: 6,
  },
  emptyAddressBox: {
    padding: 12,
    alignItems: 'center',
  },
  emptyAddressText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Edit Name */
  inputWrapper: {
    marginTop: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Dev Section */
  devSection: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  devSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 8,
  },
  devBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  serverBtnRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
  },
  serverChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  serverChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  serverChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pingBtn: {
    backgroundColor: colors.text,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  pingBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
