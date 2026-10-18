import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Search, ShoppingBag, Sparkles, SlidersHorizontal, ChevronDown, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { RestaurantCard } from '../components/RestaurantCard';
import { AddressModal } from '../components/AddressModal';
import { getRestaurants } from '../services/api';
import { useCustomerStore } from '../store/useCustomerStore';
import { captureCurrentLocation } from '../services/location';

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'biryani', name: 'Biryani 🍛' },
  { id: 'burgers', name: 'Burgers 🍔' },
  { id: 'pizza', name: 'Pizza 🍕' },
  { id: 'momos', name: 'Momos 🥟' },
  { id: 'thali', name: 'Thali 🍱' },
  { id: 'rolls', name: 'Rolls 🌯' },
  { id: 'desserts', name: 'Desserts 🍨' },
];

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const deliveryAddress = useCustomerStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCustomerStore((s) => s.setDeliveryAddress);
  const loadStoredAddresses = useCustomerStore((s) => s.loadStoredAddresses);
  const loadStoredProfile = useCustomerStore((s) => s.loadStoredProfile);
  const itemCount = useCustomerStore((s) => s.getItemCount());
  const grandTotal = useCustomerStore((s) => s.getGrandTotal());

  useEffect(() => {
    loadStoredAddresses();
    loadStoredProfile();
    // If no delivery address set yet, attempt background location detection
    if (!deliveryAddress) {
      captureCurrentLocation()
        .then((res) => {
          if (res.success && res.address) {
            setDeliveryAddress(res.address);
          }
        })
        .catch(() => {});
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getRestaurants(searchQuery);
      setRestaurants(data);
    } catch (err) {
      console.warn('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter restaurants by category or veg if needed
  const filteredRestaurants = restaurants.filter((r) => {
    if (activeCategory === 'all') return true;
    const catName = activeCategory.toLowerCase();
    const cuisines = (r.cuisines || []).map((c: string) => c.toLowerCase());
    const isMultiCuisine = cuisines.some((c: string) => c.includes('multi-cuisine'));

    // Direct match against cuisines or restaurant name
    const matchesCuisine = cuisines.some((c: string) => c.includes(catName));
    const matchesName = r.name.toLowerCase().includes(catName);

    // Multi-cuisine partner restaurants serve all popular staples (biryani, burgers, pizza, momos, rolls)
    const matchesMulti = isMultiCuisine && ['biryani', 'burgers', 'pizza', 'momos', 'rolls', 'thali', 'fast food', 'desserts'].includes(catName);

    return matchesCuisine || matchesName || matchesMulti;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.locationBlock}
          onPress={() => setAddressModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.locationTitleRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.locationLabel}>DELIVERING TO</Text>
            <ChevronDown size={14} color={colors.primary} style={{ marginLeft: 3 }} />
          </View>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {deliveryAddress || 'Detecting location... Tap to select'}
          </Text>
        </TouchableOpacity>

        <View style={styles.zeroCommissionBadge}>
          <Sparkles size={11} color="#b45309" />
          <Text style={styles.zeroCommissionText}>0% Fee</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, dishes, cuisines..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Scroller */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Restaurant List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding nearby restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listSectionTitle}>
                  {filteredRestaurants.length} Restaurant{filteredRestaurants.length === 1 ? '' : 's'} Delivering Now
                </Text>
                {activeCategory !== 'all' && (
                  <TouchableOpacity
                    style={styles.activeFilterPill}
                    onPress={() => setActiveCategory('all')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activeFilterText}>
                      {CATEGORIES.find((c) => c.id === activeCategory)?.name || activeCategory} ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetail', { slug: item.slug })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {activeCategory !== 'all'
                  ? `No restaurants found under "${CATEGORIES.find((c) => c.id === activeCategory)?.name || activeCategory}"`
                  : searchQuery
                  ? `No restaurants found for "${searchQuery}"`
                  : 'No Restaurants Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeCategory !== 'all'
                  ? 'All our partner restaurants deliver to your address. Tap below to browse all available options.'
                  : searchQuery
                  ? 'Try searching by dish name (e.g. Momo, Noodles, Burger, Thali) or tap Clear Search.'
                  : 'Could not connect to server. Check your connection or tap retry below.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => {
                  if (activeCategory !== 'all') {
                    setActiveCategory('all');
                  } else if (searchQuery) {
                    setSearchQuery('');
                  } else {
                    loadData();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionBtnText}>
                  {activeCategory !== 'all' ? 'View All Restaurants' : searchQuery ? 'Clear Search' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Cart Bar if cart has items */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: 12 }]}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartCountPill}>
              <Text style={styles.cartCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartTotal}>₹{grandTotal}</Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartAction}>View Cart</Text>
            <ShoppingBag size={18} color="#ffffff" style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Address / Location Picker Modal */}
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
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  locationBlock: {
    flex: 1,
    marginRight: 10,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  zeroCommissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  zeroCommissionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  searchWrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  categoriesSection: {
    backgroundColor: colors.white,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFilterPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingCart: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  cartCountText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  floatingCartTotal: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartAction: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
