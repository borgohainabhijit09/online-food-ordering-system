import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingBag,
  Plus,
  Minus,
  Bike,
  Package,
  UtensilsCrossed,
  Tag,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCustomerStore, OrderType } from '../store/useCustomerStore';
import { submitOrder } from '../services/api';
import { PhoneAuthModal } from '../components/PhoneAuthModal';

export const CartScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const cartRestaurant = useCustomerStore((s) => s.cartRestaurant);
  const items = useCustomerStore((s) => s.items);
  const orderType = useCustomerStore((s) => s.orderType);
  const setOrderType = useCustomerStore((s) => s.setOrderType);
  const tableNumber = useCustomerStore((s) => s.tableNumber);
  const setTableNumber = useCustomerStore((s) => s.setTableNumber);
  const deliveryAddress = useCustomerStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useCustomerStore((s) => s.setDeliveryAddress);
  const savedAddresses = useCustomerStore((s) => s.savedAddresses);
  const cookingInstructions = useCustomerStore((s) => s.cookingInstructions);
  const setCookingInstructions = useCustomerStore((s) => s.setCookingInstructions);

  const profile = useCustomerStore((s) => s.profile);
  const setProfile = useCustomerStore((s) => s.setProfile);
  const isLoggedIn = useCustomerStore((s) => s.isLoggedIn);
  const loginWithPhone = useCustomerStore((s) => s.loginWithPhone);
  const loyaltyPasses = useCustomerStore((s) => s.loyaltyPasses);

  const couponCode = useCustomerStore((s) => s.couponCode);
  const discountAmount = useCustomerStore((s) => s.discountAmount);
  const applyCoupon = useCustomerStore((s) => s.applyCoupon);
  const removeCoupon = useCustomerStore((s) => s.removeCoupon);

  const isLoyaltyRedeemed = useCustomerStore((s) => s.isLoyaltyRedeemed);
  const loyaltyDiscountAmount = useCustomerStore((s) => s.loyaltyDiscountAmount);
  const redeemedLoyaltyPoints = useCustomerStore((s) => s.redeemedLoyaltyPoints);
  const setLoyaltyRedemption = useCustomerStore((s) => s.setLoyaltyRedemption);

  const updateItemQuantity = useCustomerStore((s) => s.updateItemQuantity);
  const clearCart = useCustomerStore((s) => s.clearCart);
  const getItemsSubtotal = useCustomerStore((s) => s.getItemsSubtotal);
  const getDeliveryFee = useCustomerStore((s) => s.getDeliveryFee);
  const getGrandTotal = useCustomerStore((s) => s.getGrandTotal);
  const addTrackedOrder = useCustomerStore((s) => s.addTrackedOrder);

  const [inputCoupon, setInputCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Customer contact state
  const [custName, setCustName] = useState(profile.name || '');
  const [custPhone, setCustPhone] = useState(profile.phone || '');

  // Keep custName & custPhone in sync when profile updates (e.g. login)
  useEffect(() => {
    if (profile.name && !custName) {
      setCustName(profile.name);
    }
    if (profile.phone) {
      setCustPhone(profile.phone);
    }
  }, [profile.name, profile.phone]);

  const subtotal = getItemsSubtotal();
  const deliveryFee = getDeliveryFee();
  const grandTotal = getGrandTotal();

  // Find if current restaurant has a loyalty pass
  const matchedLoyalty = loyaltyPasses.find(
    (lp) =>
      (cartRestaurant?.slug && lp.restaurantSlug?.toLowerCase() === cartRestaurant.slug.toLowerCase()) ||
      (cartRestaurant?.id && lp.tenantId === cartRestaurant.id)
  );

  const pointValue = matchedLoyalty?.pointValueInRupees || 0.5;
  const minPointsNeeded = matchedLoyalty?.minimumPointsToRedeem || 10;
  const hasEnoughPoints = matchedLoyalty ? matchedLoyalty.points >= minPointsNeeded : false;
  const maxRedeemablePts = matchedLoyalty
    ? Math.min(matchedLoyalty.points, Math.ceil(subtotal / pointValue))
    : 0;
  const potentialLoyaltyDiscount = Math.min(subtotal, Math.round(maxRedeemablePts * pointValue));

  const handleToggleLoyalty = () => {
    if (isLoyaltyRedeemed) {
      setLoyaltyRedemption(false, 0, 0);
    } else {
      if (potentialLoyaltyDiscount > 0) {
        setLoyaltyRedemption(true, potentialLoyaltyDiscount, maxRedeemablePts);
      }
    }
  };

  const handleApplyCoupon = () => {
    const code = inputCoupon.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME50' || code === 'FIRST50') {
      applyCoupon(code, 50);
      Alert.alert('Coupon Applied!', '₹50 discount has been applied to your order.');
    } else if (code === 'DISCOUNT10') {
      const disc = Math.round(subtotal * 0.1);
      applyCoupon(code, disc);
      Alert.alert('Coupon Applied!', `10% discount (₹${disc}) has been applied.`);
    } else {
      Alert.alert('Invalid Coupon', 'This coupon code is invalid or has expired.');
    }
    setInputCoupon('');
  };

  const handlePlaceOrder = async () => {
    if (!cartRestaurant) return;
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Please add dishes to your cart first.');
      return;
    }

    const cleanPhone = custPhone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length < 10) {
      if (!isLoggedIn) {
        // Prompt login modal
        setAuthModalVisible(true);
        return;
      }
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const finalName = custName.trim() || profile.name || 'Foodie';

    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter or select a delivery address.');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      Alert.alert('Table Required', 'Please enter your dine-in table number.');
      return;
    }

    setSubmitting(true);
    try {
      // Auto-login or update store profile
      await loginWithPhone(cleanPhone, finalName);
      setProfile({ name: finalName, phone: cleanPhone, address: deliveryAddress });

      // Construct remarks
      const remarksParts: string[] = [];
      if (orderType === 'DINE_IN' && tableNumber.trim()) {
        remarksParts.push(`[Table: ${tableNumber.trim()}]`);
      }
      if (isLoyaltyRedeemed && loyaltyDiscountAmount > 0) {
        remarksParts.push(`[Loyalty Redeemed: ${redeemedLoyaltyPoints} pts (-₹${loyaltyDiscountAmount})]`);
      }
      if (cookingInstructions.trim()) {
        remarksParts.push(cookingInstructions.trim());
      }

      const payload = {
        customerName: finalName,
        phone: cleanPhone,
        orderType,
        address: orderType === 'DELIVERY' ? deliveryAddress.trim() : null,
        tableId: null,
        remarks: remarksParts.join(' ').trim(),
        total: grandTotal,
        paymentMethod,
        couponCode: couponCode || undefined,
        discountAmount: discountAmount + (isLoyaltyRedeemed ? loyaltyDiscountAmount : 0),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant?.name || null,
          addons: i.addons.map((a) => ({ addonName: a.name, price: a.price })),
        })),
      };

      const result = await submitOrder(payload, cartRestaurant.slug);

      if (result && result.id) {
        addTrackedOrder(result.id);
        clearCart();
        navigation.navigate('OrderTracking', { orderId: result.id });
      } else {
        throw new Error('Order creation did not return an order ID');
      }
    } catch (err: any) {
      console.error('Order placement failed:', err);
      Alert.alert('Order Failed', err.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartRestaurant || items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Explore top restaurants and add delicious dishes!</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('Explore')}
          activeOpacity={0.85}
        >
          <Text style={styles.browseBtnText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Review Order</Text>
          <Text style={styles.headerSubtitle}>From {cartRestaurant.name}</Text>
        </View>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearCartText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Guest 1-Tap Login Banner */}
        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.guestBanner}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.88}
          >
            <View style={styles.guestBannerIcon}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestBannerTitle}>Returning Customer?</Text>
              <Text style={styles.guestBannerSub}>Sign in with 1 tap to use saved addresses & loyalty points</Text>
            </View>
            <View style={styles.guestBannerAction}>
              <Text style={styles.guestBannerActionText}>Sign In</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Order Type Tabs */}
        <View style={styles.orderTypeCard}>
          <Text style={styles.sectionHeading}>Choose Order Type</Text>
          <View style={styles.orderTypeRow}>
            <TouchableOpacity
              style={[styles.typePill, orderType === 'DELIVERY' && styles.typePillActive]}
              onPress={() => setOrderType('DELIVERY')}
            >
              <Bike size={16} color={orderType === 'DELIVERY' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.typePillText, orderType === 'DELIVERY' && styles.typePillTextActive]}>
                Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typePill, orderType === 'TAKEAWAY' && styles.typePillActive]}
              onPress={() => setOrderType('TAKEAWAY')}
            >
              <Package size={16} color={orderType === 'TAKEAWAY' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.typePillText, orderType === 'TAKEAWAY' && styles.typePillTextActive]}>
                Takeaway
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typePill, orderType === 'DINE_IN' && styles.typePillActive]}
              onPress={() => setOrderType('DINE_IN')}
            >
              <UtensilsCrossed size={16} color={orderType === 'DINE_IN' ? colors.primaryDark : colors.textSecondary} />
              <Text style={[styles.typePillText, orderType === 'DINE_IN' && styles.typePillTextActive]}>
                Dine-In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Location / Table Card */}
        <View style={styles.card}>
          {orderType === 'DELIVERY' ? (
            <View>
              <View style={styles.cardTitleRow}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>Delivery Address</Text>
              </View>

              {/* Saved Address Quick Selector Pills */}
              {savedAddresses.length > 0 && (
                <View style={styles.savedPillsWrapper}>
                  <Text style={styles.savedPillsHeading}>Saved Addresses:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedPillsScroll}>
                    {savedAddresses.map((addr) => {
                      const isSelected = deliveryAddress.trim() === addr.address.trim();
                      return (
                        <TouchableOpacity
                          key={addr.id}
                          style={[styles.addressPill, isSelected && styles.addressPillActive]}
                          onPress={() => setDeliveryAddress(addr.address, addr.id)}
                          activeOpacity={0.8}
                        >
                          <MapPin size={12} color={isSelected ? colors.primaryDark : colors.textSecondary} />
                          <Text style={[styles.addressPillText, isSelected && styles.addressPillTextActive]}>
                            {addr.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <TextInput
                style={styles.textInput}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Enter complete delivery address..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>
          ) : orderType === 'DINE_IN' ? (
            <View>
              <View style={styles.cardTitleRow}>
                <UtensilsCrossed size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>Dine-In Table Number</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={tableNumber}
                onChangeText={setTableNumber}
                placeholder="e.g. Table 04, T-12, Outdoor 2"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : (
            <View>
              <View style={styles.cardTitleRow}>
                <Package size={16} color={colors.primary} />
                <Text style={styles.cardTitle}>Takeaway Pickup</Text>
              </View>
              <Text style={styles.helperText}>
                Collect directly from the restaurant counter at {cartRestaurant.name}.
              </Text>
            </View>
          )}
        </View>

        {/* Customer Contact Details */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            {isLoggedIn && profile.phone ? (
              <View style={styles.verifiedTag}>
                <ShieldCheck size={12} color="#15803d" />
                <Text style={styles.verifiedTagText}>Verified Member</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputRow}>
            <User size={16} color={colors.textMuted} />
            <TextInput
              style={styles.inlineInput}
              value={custName}
              onChangeText={setCustName}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={[styles.inputRow, { marginTop: 8 }]}>
            <Phone size={16} color={colors.textMuted} />
            <TextInput
              style={styles.inlineInput}
              value={custPhone}
              onChangeText={setCustPhone}
              placeholder="10-digit Phone Number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({items.length})</Text>
          {items.map((item) => {
            const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
            const lineTotal = (item.price + addonsTotal) * item.quantity;

            return (
              <View key={item.id} style={styles.cartItemRow}>
                <View style={styles.itemInfoCol}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.variant && (
                    <Text style={styles.itemMeta}>Size: {item.variant.name}</Text>
                  )}
                  {item.addons.length > 0 && (
                    <Text style={styles.itemMeta}>
                      Extras: {item.addons.map((a) => a.name).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>₹{lineTotal}</Text>
                </View>

                {/* Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateItemQuantity(item.id, -1)}
                  >
                    <Minus size={13} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateItemQuantity(item.id, 1)}
                  >
                    <Plus size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Loyalty Points Redemption (Restaurant Specific) */}
        {matchedLoyalty && matchedLoyalty.points > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Award size={16} color="#d97706" />
              <Text style={styles.cardTitle}>Restaurant Loyalty Points</Text>
            </View>
            <View style={styles.loyaltyCardBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.loyaltyPointsTitle}>
                  {matchedLoyalty.points} Loyalty Points Available
                </Text>
                <Text style={styles.loyaltyPointsSub}>
                  {hasEnoughPoints
                    ? `Redeem ${maxRedeemablePts} pts for ₹${potentialLoyaltyDiscount} off this order`
                    : `Min ${minPointsNeeded} points needed to redeem on orders`}
                </Text>
              </View>
              {hasEnoughPoints && (
                <TouchableOpacity
                  style={[styles.loyaltyActionBtn, isLoyaltyRedeemed && styles.loyaltyActionBtnActive]}
                  onPress={handleToggleLoyalty}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.loyaltyActionText, isLoyaltyRedeemed && styles.loyaltyActionTextActive]}>
                    {isLoyaltyRedeemed ? 'Applied ✓' : 'Redeem'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Cooking Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cooking Instructions (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={cookingInstructions}
            onChangeText={setCookingInstructions}
            placeholder="e.g. Extra spicy, don't ring the bell, keep sauce separate"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Coupon Code Section */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Tag size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Offers & Coupons</Text>
          </View>
          {couponCode ? (
            <View style={styles.appliedCouponRow}>
              <View style={styles.couponPill}>
                <Check size={14} color="#15803d" />
                <Text style={styles.couponPillText}>{couponCode}</Text>
              </View>
              <Text style={styles.couponSavings}>Saved ₹{discountAmount}</Text>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code (try WELCOME50)"
                placeholderTextColor={colors.textMuted}
                value={inputCoupon}
                onChangeText={setInputCoupon}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.paymentPill, paymentMethod === 'COD' && styles.paymentPillActive]}
              onPress={() => setPaymentMethod('COD')}
            >
              <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
                {paymentMethod === 'COD' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.paymentText}>Cash / Pay on Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentPill, paymentMethod === 'ONLINE' && styles.paymentPillActive]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <View style={[styles.radioCircle, paymentMethod === 'ONLINE' && styles.radioCircleActive]}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.paymentText}>UPI / Cards / NetBanking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          {orderType === 'DELIVERY' && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Partner Fee</Text>
              <Text style={[styles.billValue, deliveryFee === 0 && { color: '#16a34a' }]}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
          )}
          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#16a34a' }]}>Coupon Discount ({couponCode})</Text>
              <Text style={[styles.billValue, { color: '#16a34a' }]}>-₹{discountAmount}</Text>
            </View>
          )}
          {isLoyaltyRedeemed && loyaltyDiscountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#d97706' }]}>Loyalty Discount ({redeemedLoyaltyPoints} pts)</Text>
              <Text style={[styles.billValue, { color: '#d97706' }]}>-₹{loyaltyDiscountAmount}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.bottomBarTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomBarTotalValue}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <ChevronRight size={18} color="#ffffff" style={{ marginLeft: 4 }} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Slide-Up Phone Auth Modal */}
      <PhoneAuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={(phone?: string) => {
          setAuthModalVisible(false);
          if (phone) setCustPhone(phone);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clearCartText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 10,
  },
  guestBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  guestBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guestBannerAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestBannerActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  orderTypeCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  typePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typePillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  savedPillsWrapper: {
    marginBottom: 10,
  },
  savedPillsHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  savedPillsScroll: {
    gap: 8,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  addressPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addressPillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  loyaltyCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 4,
  },
  loyaltyPointsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  loyaltyPointsSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  loyaltyActionBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  loyaltyActionBtnActive: {
    backgroundColor: '#15803d',
  },
  loyaltyActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loyaltyActionTextActive: {
    color: '#ffffff',
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  couponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponPillText: {
    fontWeight: '700',
    color: '#15803d',
    fontSize: 13,
  },
  couponSavings: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
  },
  removeCouponText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    color: colors.text,
  },
  applyBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  paymentOptions: {
    gap: 8,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  paymentPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  bottomBarTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomBarTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  placeOrderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: colors.background,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
