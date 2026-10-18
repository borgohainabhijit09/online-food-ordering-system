import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    basePrice?: number | null;
    offerPrice?: number | null;
    price?: number | null;
    dietaryPreference?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG';
    isTrending?: boolean;
    image?: string | null;
    images?: { url: string }[];
    variants?: any[];
    addons?: any[];
  };
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const isVeg = product.dietaryPreference === 'VEG' || product.dietaryPreference === 'VEGAN';
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const hasAddons = Array.isArray(product.addons) && product.addons.length > 0;
  const hasCustomizations = hasVariants || hasAddons;

  // Resolve base price
  const rawBase = typeof product.basePrice === 'number' ? product.basePrice : (product.price || 0);

  // If basePrice is 0 or not specified, look for minimum variant price
  const minVariantPrice = hasVariants
    ? Math.min(...product.variants!.map((v: any) => v.offerPrice ?? v.price ?? rawBase ?? 0))
    : rawBase;

  const isStartingPrice = rawBase === 0 && hasVariants && minVariantPrice > 0;
  const activeBasePrice = isStartingPrice ? minVariantPrice : rawBase;

  // Determine if item has an active discount
  const isDiscounted =
    typeof product.offerPrice === 'number' &&
    product.offerPrice > 0 &&
    product.offerPrice < activeBasePrice;

  // Final selling price
  const sellingPrice = isDiscounted ? product.offerPrice : activeBasePrice;

  const discountPercent =
    isDiscounted && activeBasePrice > 0
      ? Math.round(((activeBasePrice - (product.offerPrice as number)) / activeBasePrice) * 100)
      : 0;

  // Image resolution: support product.image or product.images[0].url
  const imageUrl = product.image || product.images?.[0]?.url || null;

  return (
    <View style={styles.card}>
      <View style={styles.contentCol}>
        {/* Veg/Non-Veg Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.dietBadge, isVeg ? styles.vegBadge : styles.nonVegBadge]}>
            <View style={[styles.dietDot, isVeg ? styles.vegDot : styles.nonVegDot]} />
          </View>
          {product.isTrending && (
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>Bestseller</Text>
            </View>
          )}
          {isDiscounted && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Pricing */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {isStartingPrice ? 'From ' : ''}₹{sellingPrice}
          </Text>
          {isDiscounted && (
            <Text style={styles.originalPrice}>₹{activeBasePrice}</Text>
          )}
        </View>

        {/* Description */}
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
      </View>

      {/* Right Column: Image & Add / Stepper */}
      <View style={styles.actionCol}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.buttonWrapper}>
          {quantityInCart === 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>ADD</Text>
              {hasCustomizations && <Text style={styles.customizablePill}>+</Text>}
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperContainer}>
              <TouchableOpacity style={styles.stepperBtn} onPress={onDecrement} activeOpacity={0.7}>
                <Minus size={13} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{quantityInCart}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={onIncrement} activeOpacity={0.7}>
                <Plus size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasCustomizations && (
          <Text style={styles.customizableLabel}>Customizable</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'flex-start',
  },
  contentCol: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  dietBadge: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadge: {
    borderColor: colors.veg,
  },
  nonVegBadge: {
    borderColor: colors.nonVeg,
  },
  dietDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vegDot: {
    backgroundColor: colors.veg,
  },
  nonVegDot: {
    backgroundColor: colors.nonVeg,
  },
  trendingBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  trendingText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '700',
  },
  saleBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actionCol: {
    alignItems: 'center',
    width: 104,
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMuted,
  },
  buttonWrapper: {
    marginTop: -16,
  },
  addButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  customizablePill: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    paddingHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  customizableLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
