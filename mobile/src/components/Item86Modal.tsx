import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useMenuStockStore, MenuItem } from '../store/useMenuStockStore';
import { X, Search, UtensilsCrossed, CheckCircle2, AlertCircle } from 'lucide-react-native';

interface Item86ModalProps {
  visible: boolean;
  onClose: () => void;
  tenantSlug?: string;
}

export function Item86Modal({ visible, onClose, tenantSlug }: Item86ModalProps) {
  const {
    products,
    isLoading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    fetchProducts,
    toggleProductStock,
  } = useMenuStockStore();

  useEffect(() => {
    if (visible) {
      fetchProducts(tenantSlug);
    }
  }, [visible, tenantSlug]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.category?.name === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => !p.isActive).length;
  }, [products]);

  const renderProductItem = ({ item }: { item: MenuItem }) => {
    const isAvailable = item.isActive;
    const isVeg = item.dietaryPreference === 'VEG' || item.dietaryPreference === 'VEGAN';

    return (
      <View style={[styles.productCard, !isAvailable && styles.productCardOut]}>
        <View style={styles.productLeft}>
          <View style={styles.nameRow}>
            {/* Dietary dot */}
            <View
              style={[
                styles.dietaryDot,
                { borderColor: isVeg ? '#16a34a' : '#dc2626' },
              ]}
            >
              <View
                style={[
                  styles.dietaryInner,
                  { backgroundColor: isVeg ? '#16a34a' : '#dc2626' },
                ]}
              />
            </View>
            <Text style={[styles.productName, !isAvailable && styles.productNameOut]}>
              {item.name}
            </Text>
          </View>

          <View style={styles.productMeta}>
            <Text style={styles.productPrice}>₹{item.basePrice}</Text>
            {item.category?.name ? (
              <Text style={styles.categoryBadge}>{item.category.name}</Text>
            ) : null}
            {!isAvailable ? (
              <View style={styles.outBadge}>
                <Text style={styles.outBadgeText}>OUT OF STOCK</Text>
              </View>
            ) : (
              <View style={styles.inBadge}>
                <Text style={styles.inBadgeText}>IN STOCK</Text>
              </View>
            )}
          </View>
        </View>

        {/* Toggle Switch */}
        <View style={styles.switchWrapper}>
          <Switch
            value={isAvailable}
            onValueChange={(val) => {
              toggleProductStock(item.id, val, tenantSlug);
            }}
            trackColor={{ false: '#fca5a5', true: '#86efac' }}
            thumbColor={isAvailable ? '#16a34a' : '#dc2626'}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <UtensilsCrossed size={18} color="#ea580c" />
                <Text style={styles.title}>Menu Stock & Availability</Text>
              </View>
              <Text style={styles.subtitle}>
                Turn off dishes that ran out • {outOfStockCount} currently unavailable
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes to toggle stock..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoryListWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.categoryScroll}
              renderItem={({ item }) => {
                const isSelected = item === selectedCategory;
                return (
                  <TouchableOpacity
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Product List */}
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderProductItem}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <AlertCircle size={32} color="#94a3b8" />
                  <Text style={styles.emptyText}>No menu items found</Text>
                </View>
              }
            />
          )}

          {/* Done Button Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.doneBtnText}>Done / Save Availability</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  categoryListWrapper: {
    marginVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 8,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productCardOut: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  productLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietaryDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietaryInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  productNameOut: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  categoryBadge: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  outBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  outBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  inBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  switchWrapper: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
