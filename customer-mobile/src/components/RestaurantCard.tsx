import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, Clock, MapPin, Bike } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface RestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    imageUrl?: string | null;
    isAcceptingOrders: boolean;
    deliveryFee: number;
    minOrder: number;
    deliveryRadiusKm?: number;
    cuisineText?: string;
    cuisines?: string[];
    rating: number;
    reviewCount: number;
    prepTime: string;
    distance: string;
    totalProducts?: number;
  };
  onPress: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const displayImage = !imageError ? (restaurant.imageUrl || restaurant.logoUrl) : null;
  const isWideRadius = Boolean(restaurant.deliveryRadiusKm && restaurant.deliveryRadiusKm >= 1000);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.86}
    >
      {/* LEFT COLUMN: Details & Meta */}
      <View style={styles.leftCol}>
        {/* Name & Rating Row */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
            <Star size={10} color="#ffffff" fill="#ffffff" style={styles.starIcon} />
          </View>
        </View>

        {/* Cuisines */}
        <Text style={styles.cuisines} numberOfLines={2}>
          {restaurant.cuisineText || 'Multi-Cuisine • Fast Food'}
        </Text>

        {/* Distance & Delivery Time Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{restaurant.prepTime}</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <View style={styles.metaItem}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {isWideRadius ? 'All Areas (10,000 km)' : restaurant.distance}
            </Text>
          </View>
        </View>

        {/* Badges: Delivery Fee & Order Status */}
        <View style={styles.badgeRow}>
          {restaurant.deliveryFee === 0 ? (
            <View style={styles.freeDeliveryBadge}>
              <Bike size={11} color="#047857" />
              <Text style={styles.freeDeliveryText}>Free Delivery</Text>
            </View>
          ) : (
            <View style={styles.feeBadge}>
              <Text style={styles.feeText}>₹{restaurant.deliveryFee} fee</Text>
            </View>
          )}

          <View style={[styles.statusBadge, !restaurant.isAcceptingOrders && styles.statusBadgeClosed]}>
            <View style={[styles.statusDot, !restaurant.isAcceptingOrders && styles.statusDotClosed]} />
            <Text style={[styles.statusText, !restaurant.isAcceptingOrders && styles.statusTextClosed]}>
              {restaurant.isAcceptingOrders ? 'Accepting Orders' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* RIGHT COLUMN: Image / Logo */}
      <View style={styles.rightCol}>
        <View style={styles.imageContainer}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.fallbackImage, { backgroundColor: getRestaurantColor(restaurant.name) }]}>
              <Text style={styles.fallbackInitial}>{restaurant.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          {/* Closed Overlay */}
          {!restaurant.isAcceptingOrders && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedText}>CLOSED</Text>
            </View>
          )}

          {/* Wide Radius pill on image */}
          {isWideRadius && restaurant.isAcceptingOrders && (
            <View style={styles.imageRadiusTag}>
              <Text style={styles.imageRadiusTagText}>10,000 km</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

function getRestaurantColor(name: string): string {
  const palette = ['#0284c7', '#0d9488', '#ea580c', '#7c3aed', '#db2777', '#4f46e5', '#ca8a04'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  leftCol: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  ratingBadge: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  starIcon: {
    marginLeft: 1,
  },
  cuisines: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
    color: colors.textMuted,
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  freeDeliveryBadge: {
    backgroundColor: '#ecfdf5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    borderWidth: 0.5,
    borderColor: '#a7f3d0',
  },
  freeDeliveryText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '700',
  },
  feeBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  feeText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeClosed: {
    backgroundColor: '#fef2f2',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
  },
  statusDotClosed: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: '600',
  },
  statusTextClosed: {
    color: '#b91c1c',
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 14,
  },
  fallbackImage: {
    width: 96,
    height: 96,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  imageRadiusTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(225, 29, 72, 0.9)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  imageRadiusTagText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
