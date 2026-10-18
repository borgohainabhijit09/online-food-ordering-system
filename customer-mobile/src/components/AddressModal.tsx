import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  MapPin,
  Navigation,
  Home,
  Briefcase,
  Plus,
  Check,
  X,
  Trash2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCustomerStore, SavedAddress } from '../store/useCustomerStore';
import { captureCurrentLocation } from '../services/location';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose }) => {
  const deliveryAddress = useCustomerStore((s) => s.deliveryAddress);
  const savedAddresses = useCustomerStore((s) => s.savedAddresses);
  const setDeliveryAddress = useCustomerStore((s) => s.setDeliveryAddress);
  const addSavedAddress = useCustomerStore((s) => s.addSavedAddress);
  const removeSavedAddress = useCustomerStore((s) => s.removeSavedAddress);

  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New address form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddressText, setNewAddressText] = useState('');

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setErrorMessage(null);
    try {
      const res = await captureCurrentLocation();
      if (res.success && res.address) {
        setDeliveryAddress(res.address);
        addSavedAddress('Current Location' as any, res.address);
        onClose();
      } else {
        setErrorMessage(res.error || 'Could not determine your location.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Location service error.');
    } finally {
      setLocating(false);
    }
  };

  const handleSelectSaved = (item: SavedAddress) => {
    setDeliveryAddress(item.address, item.id);
    onClose();
  };

  const handleSaveNewAddress = () => {
    if (!newAddressText.trim()) {
      setErrorMessage('Please type a delivery address.');
      return;
    }
    addSavedAddress(newLabel, newAddressText.trim());
    setNewAddressText('');
    setIsAddingNew(false);
    onClose();
  };

  const renderIconForLabel = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return <Home size={18} color={colors.primary} />;
      case 'work':
        return <Briefcase size={18} color="#0284c7" />;
      default:
        return <MapPin size={18} color="#16a34a" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.sheetTitle}>Select Delivery Location</Text>
              <Text style={styles.sheetSubtitle}>Choose from saved addresses or detect live</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* GPS Locate Button */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleUseCurrentLocation}
              disabled={locating}
              activeOpacity={0.8}
            >
              <View style={styles.gpsIconCircle}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Navigation size={18} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>
                  {locating ? 'Detecting current location...' : 'Use Current Location'}
                </Text>
                <Text style={styles.gpsSubtitle}>Enable GPS for precision doorstep delivery</Text>
              </View>
            </TouchableOpacity>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
                {savedAddresses.map((item) => {
                  const isSelected = deliveryAddress === item.address;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                      onPress={() => handleSelectSaved(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addressIconWrapper}>
                        {renderIconForLabel(item.label)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.labelRow}>
                          <Text style={styles.addressLabel}>{item.label}</Text>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Check size={12} color="#ffffff" />
                              <Text style={styles.selectedBadgeText}>Selected</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressText} numberOfLines={2}>
                          {item.address}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeSavedAddress(item.id)}
                      >
                        <Trash2 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Add New Address Accordion */}
            <View style={styles.sectionBlock}>
              {!isAddingNew ? (
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => setIsAddingNew(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={colors.primary} />
                  <Text style={styles.addNewText}>Add New Delivery Address</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.newAddressForm}>
                  <Text style={styles.formTitle}>Add New Address</Text>

                  {/* Label Selector */}
                  <View style={styles.labelPillsRow}>
                    {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        style={[styles.pill, newLabel === lbl && styles.pillActive]}
                        onPress={() => setNewLabel(lbl)}
                      >
                        <Text style={[styles.pillText, newLabel === lbl && styles.pillTextActive]}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.inputArea}
                    placeholder="Flat / House no, Building name, Street, Landmark..."
                    placeholderTextColor={colors.textMuted}
                    value={newAddressText}
                    onChangeText={setNewAddressText}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.formActionRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setIsAddingNew(false);
                        setNewAddressText('');
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveNewAddress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveBtnText}>Save & Deliver Here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  gpsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  addressItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#fff5f7',
  },
  addressIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 6,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  newAddressForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  labelPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#ffffff',
  },
  inputArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 75,
    marginBottom: 14,
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
