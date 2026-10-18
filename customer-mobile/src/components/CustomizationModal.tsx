import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface CustomizationModalProps {
  visible: boolean;
  product: any;
  onClose: () => void;
  onAddToCart: (variant: any | null, addons: any[]) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  visible,
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const variants = product.variants || [];
  const addons = product.addons || [];

  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const rawProductBase = typeof product.offerPrice === 'number' && product.offerPrice > 0
    ? product.offerPrice
    : (typeof product.basePrice === 'number' ? product.basePrice : (product.price || 0));

  const variantPrice = selectedVariant
    ? (selectedVariant.offerPrice ?? selectedVariant.price ?? rawProductBase)
    : rawProductBase;

  const addonsTotal = selectedAddons.reduce((sum, a) => {
    const price = a.addon?.price ?? a.price ?? 0;
    return sum + price;
  }, 0);

  const totalItemPrice = variantPrice + addonsTotal;

  const handleConfirm = () => {
    const normalizedVariant = selectedVariant
      ? {
          id: selectedVariant.id,
          name: selectedVariant.name,
          price: selectedVariant.offerPrice ?? selectedVariant.price ?? variantPrice,
        }
      : null;

    const normalizedAddons = selectedAddons.map((a) => ({
      id: a.addon?.id || a.id,
      name: a.addon?.name || a.name,
      price: a.addon?.price ?? a.price ?? 0,
    }));

    onAddToCart(normalizedVariant, normalizedAddons);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
              <Text style={styles.subtitle}>Customize your dish</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Variants Section */}
            {variants.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Size / Portion</Text>
                  <Text style={styles.requiredTag}>REQUIRED</Text>
                </View>
                {variants.map((v: any) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.optionRow, isSelected && styles.optionRowActive]}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioContainer}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                          {v.name}
                        </Text>
                      </View>
                      <Text style={styles.optionPrice}>₹{v.offerPrice ?? v.price}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Addons Section */}
            {addons.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Add Extras</Text>
                  <Text style={styles.optionalTag}>OPTIONAL</Text>
                </View>
                {addons.map((a: any) => {
                  const addonId = a.addon?.id || a.id;
                  const addonName = a.addon?.name || a.name;
                  const addonPrice = a.addon?.price ?? a.price ?? 0;
                  const isChecked = selectedAddons.some((addon) => (addon.addon?.id || addon.id) === addonId);
                  return (
                    <TouchableOpacity
                      key={addonId}
                      style={[styles.optionRow, isChecked && styles.optionRowActive]}
                      onPress={() => toggleAddon(a)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                          {isChecked && <Check size={14} color="#ffffff" />}
                        </View>
                        <Text style={[styles.optionLabel, isChecked && styles.optionLabelActive]}>
                          {addonName}
                        </Text>
                      </View>
                      <Text style={styles.optionPrice}>+₹{addonPrice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel}>Item Total</Text>
              <Text style={styles.totalPrice}>₹{totalItemPrice}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  optionLabelActive: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  totalBlock: {},
  totalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
