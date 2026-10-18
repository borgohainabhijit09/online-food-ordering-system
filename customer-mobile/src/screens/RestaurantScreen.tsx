import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Clock, MapPin, ShoppingBag, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ProductCard } from '../components/ProductCard';
import { CustomizationModal } from '../components/CustomizationModal';
import { getRestaurantDetails } from '../services/api';
import { useCustomerStore, RestaurantMeta } from '../store/useCustomerStore';

export const RestaurantScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { slug } = route.params;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [vegOnly, setVegOnly] = useState(false);

  // Customization modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCustomProduct, setActiveCustomProduct] = useState<any>(null);

  // Store
  const items = useCustomerStore((s) => s.items);
  const cartRestaurant = useCustomerStore((s) => s.cartRestaurant);
  const addItem = useCustomerStore((s) => s.addItem);
  const updateItemQuantity = useCustomerStore((s) => s.updateItemQuantity);
  const clearCart = useCustomerStore((s) => s.clearCart);
  const itemCount = useCustomerStore((s) => s.getItemCount());
  const grandTotal = useCustomerStore((s) => s.getGrandTotal());

  const loadRestaurant = useCallback(async () => {
    try {
      const data = await getRestaurantDetails(slug);
      setRestaurant(data);
      // Keep ALL selected by default so users see full menu
    } catch (err) {
      console.warn('Failed to load restaurant details:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const handleProductAdd = (product: any) => {
    const hasCustomizations = (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0);
    if (hasCustomizations) {
      setActiveCustomProduct(product);
      setModalVisible(true);
    } else {
      performAddToCart(product, null, []);
    }
  };

  const performAddToCart = (product: any, variant: any, addons: any[]) => {
    if (!restaurant) return;

    const meta: RestaurantMeta = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      deliveryFee: restaurant.deliveryFee || 0,
      minOrder: restaurant.minOrder || 0,
      phone: restaurant.phone,
      logoUrl: restaurant.logoUrl,
    };

    const result = addItem(meta, product, variant, addons);

    if (!result.success) {
      // Cart conflict dialog
      Alert.alert(
        'Replace Cart Items?',
        `Your cart already contains dishes from "${result.conflictRestaurant}". Would you like to clear your cart and start a fresh order from "${restaurant.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace Cart',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(meta, product, variant, addons);
            },
          },
        ]
      );
    }
  };

  // Find quantity for a product in cart
  const getProductCartCount = (productId: string) => {
    return items
      .filter((i) => i.productId === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Unable to load restaurant</Text>
        <Text style={styles.errorSubtext}>Please check your connection and tap retry.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            loadRestaurant();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Tap to Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = restaurant.categories || [];

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
              navigation.navigate('HomeScreen');
            }
          }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{restaurant.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Header Card */}
        <View style={styles.restaurantHero}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{restaurant.name}</Text>
              <Text style={styles.heroSlug}>resto.food/{restaurant.slug}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingScore}>{restaurant.rating || 4.5}</Text>
              <Star size={12} color="#ffffff" fill="#ffffff" />
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Clock size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>{restaurant.prepTime || '25 min'}</Text>
            </View>
            <View style={styles.metaPill}>
              <MapPin size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>Direct Delivery</Text>
            </View>
            {restaurant.fssaiNumber && (
              <View style={styles.metaPill}>
                <ShieldCheck size={13} color="#15803d" />
                <Text style={[styles.metaText, { color: '#15803d' }]}>FSSAI Verified</Text>
              </View>
            )}
          </View>

          {/* Veg Only Switch */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.vegSwitch, vegOnly && styles.vegSwitchActive]}
              onPress={() => setVegOnly(!vegOnly)}
              activeOpacity={0.8}
            >
              <View style={[styles.vegDot, vegOnly && styles.vegDotActive]} />
              <Text style={[styles.vegSwitchText, vegOnly && styles.vegSwitchTextActive]}>
                Veg Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Scroller */}
        <View style={styles.categoryTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {/* All Category Pill */}
            <TouchableOpacity
              style={[styles.tabPill, selectedCategory === 'ALL' && styles.tabPillActive]}
              onPress={() => setSelectedCategory('ALL')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedCategory === 'ALL' && styles.tabTextActive]}>
                All ({categories.reduce((acc: number, c: any) => acc + (c.products?.length || 0), 0)})
              </Text>
            </TouchableOpacity>

            {categories.map((cat: any) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.products?.length || 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {cat.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Products List by Category */}
        <View style={styles.menuSection}>
          {categories
            .filter((cat: any) => (selectedCategory === 'ALL' ? true : cat.id === selectedCategory))
            .map((cat: any) => {
              const filteredProducts = (cat.products || []).filter((p: any) => {
                if (vegOnly) {
                  return p.dietaryPreference === 'VEG' || p.dietaryPreference === 'VEGAN';
                }
                return true;
              });

              if (filteredProducts.length === 0) return null;

              return (
                <View key={cat.id} style={styles.categoryBlock}>
                  <Text style={styles.categoryHeading}>{cat.name}</Text>
                  {filteredProducts.map((p: any) => {
                    const cartCount = getProductCartCount(p.id);
                    const matchingCartItem = items.find((i) => i.productId === p.id);

                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        quantityInCart={cartCount}
                        onAdd={() => handleProductAdd(p)}
                        onIncrement={() => {
                          if (matchingCartItem) updateItemQuantity(matchingCartItem.id, 1);
                        }}
                        onDecrement={() => {
                          if (matchingCartItem) updateItemQuantity(matchingCartItem.id, -1);
                        }}
                      />
                    );
                  })}
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Customization Modal */}
      <CustomizationModal
        visible={modalVisible}
        product={activeCustomProduct}
        onClose={() => setModalVisible(false)}
        onAddToCart={(variant, addons) => {
          performAddToCart(activeCustomProduct, variant, addons);
        }}
      />

      {/* Floating Cart Bar */}
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
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  backBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
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
    paddingBottom: 110,
  },
  restaurantHero: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  heroSlug: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  ratingScore: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  vegSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  vegSwitchActive: {
    backgroundColor: colors.vegLight,
    borderColor: colors.veg,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    marginRight: 6,
  },
  vegDotActive: {
    backgroundColor: colors.veg,
  },
  vegSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vegSwitchTextActive: {
    color: colors.veg,
    fontWeight: '700',
  },
  categoryTabs: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  menuSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  categoryBlock: {
    paddingVertical: 12,
  },
  categoryHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
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
