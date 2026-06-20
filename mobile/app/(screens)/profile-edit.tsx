import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { uploadService, getImageUrl } from '../../src/services/uploadService';
import { userService } from '../../src/services/userService';
import { formatPhoneNumber } from '../../src/utils/phoneFormat';
import { Input } from '../../src/components/ui/Input';
import { COUNTRIES, DEFAULT_COUNTRY, Country } from '../../src/constants/countries';
import { CountryPickerModal } from '../../src/components/ui/CountryPickerModal';
import { getErrorMessage } from '../../src/services/api';

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { user, updateUser } = useAuthStore();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  // Initial Phone Parsing Logic
  const getInitialPhoneData = () => {
    const rawPhone = user?.phone || '';

    // Check for international format (+...)
    if (rawPhone.startsWith('+')) {
      const country = COUNTRIES.find(c => rawPhone.startsWith(c.dialCode));
      if (country) {
        return {
          country,
          number: rawPhone.slice(country.dialCode.length)
        };
      }
    }

    // Check for Turkish local format (05...)
    if (rawPhone.startsWith('0')) {
      return {
        country: COUNTRIES.find(c => c.code === 'TR') || DEFAULT_COUNTRY,
        number: rawPhone.slice(1) // Remove leading 0
      };
    }

    // Default or raw
    return {
      country: DEFAULT_COUNTRY,
      number: rawPhone
    };
  };

  const initialPhoneData = getInitialPhoneData();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(initialPhoneData.number);
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialPhoneData.country);
  const [showCountryPicker, setShowCountryPicker] = useState(false);



  // Remove formatting to get raw phone number
  const unformatPhoneNumber = (text: string): string => {
    return text.replace(/\D/g, '');
  };

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // Local URI for new image
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('auth.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('profile.firstLastRequired'));
      return;
    }

    // Phone Validation
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      if (selectedCountry.code === 'TR') {
        if (!/^[0-9]{10}$/.test(cleanPhone)) {
          Alert.alert(t('common.error'), t('validation.phoneLengthTR', 'Lütfen 10 haneli numara giriniz (5XX...)'));
          return;
        }
      } else {
        if (!/^[0-9]{7,15}$/.test(cleanPhone)) {
          Alert.alert(t('common.error'), t('validation.phoneLength', 'Geçerli bir telefon numarası giriniz'));
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (newAvatarUri) {
        setIsUploadingAvatar(true);
        try {
          finalAvatarUrl = await uploadService.uploadAvatar(newAvatarUri);
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          Alert.alert(t('common.error'), getErrorMessage(uploadError));
          setIsUploadingAvatar(false);
          setIsLoading(false);
          return;
        }
        setIsUploadingAvatar(false);
      }

      // Submit Logic: Partial Update
      const updatePayload: any = {};

      // Check Name diff
      if (firstName.trim() !== user?.firstName) {
        updatePayload.firstName = firstName.trim();
      }
      if (lastName.trim() !== user?.lastName) {
        updatePayload.lastName = lastName.trim();
      }

      // Check Phone diff
      // Current user phone vs new phone logic
      // User phone in DB is correct (+90...)
      // We need to compare specific formatted version
      let formattedPhone = undefined;
      if (phone.trim()) {
        if (selectedCountry.code === 'TR') {
          formattedPhone = `${selectedCountry.dialCode}${phone.trim()}`;
        } else {
          formattedPhone = `${selectedCountry.dialCode}${phone.trim()}`;
        }
      }

      if (formattedPhone && formattedPhone !== user?.phone) {
        updatePayload.phone = formattedPhone;
      }

      // If nothing changed, return
      if (Object.keys(updatePayload).length === 0 && !newAvatarUri) {
        // No changes to save
        Alert.alert(t('common.info'), t('profile.noChanges', 'Değişiklik yapılmadı.'));
        setIsLoading(false);
        return;
      }

      // API call to update profile fields (if any fields changed)
      let updatedUser: any = user; // Default to current user if only avatar changed
      if (Object.keys(updatePayload).length > 0) {
        updatedUser = await userService.updateProfile(updatePayload);
      }
      // (Old API call removed)

      // Update local state with the confirmed data from backend
      updateUser({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatarUrl: finalAvatarUrl || updatedUser.avatarUrl,
      });

      router.navigate('/(tabs)/profile');
      // Show success message briefly or relying on visual update
      // Alert.alert(t('common.success'), t('profile.updateSuccess')); // Optional, might be annoying if it pops up on the next screen. 
      // User asked to just go to profile.
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.editProfile')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickImage} style={styles.avatarContainer} disabled={isUploadingAvatar}>
            {newAvatarUri || avatarUrl ? (
              <Image
                source={{ uri: newAvatarUri || getImageUrl(avatarUrl) || avatarUrl }}
                style={styles.avatar}
                cachePolicy="none"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#444444' : colors.primary }]}>
                <Text style={styles.avatarText}>
                  {firstName?.[0]}{lastName?.[0]}
                </Text>
              </View>
            )}
            <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            {isUploadingAvatar ? t('common.uploading') : t('common.changePhoto')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.firstName')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('auth.firstName')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.lastName')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('auth.lastName')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('auth.email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }]}
              value={email}
              editable={false}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {t('profile.emailCannotChange')}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.phone')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }]}
              value={user?.phone ? formatPhoneNumber(user.phone) : ''}
              editable={false}
              placeholder={t('profile.phone')}
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {t('profile.phoneCannotChange', 'Telefon numarası değiştirilemez')}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, { backgroundColor: isDark ? '#444444' : colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </Pressable>
      </ScrollView>
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountry}
        selectedCountryCode={selectedCountry.code}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RSpacing.lg,
    paddingVertical: RSpacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: RFontSizes.xl,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: RSpacing.lg,
    paddingBottom: RSpacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: RFontSizes.xxxl,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
    marginTop: RSpacing.sm,
  },
  form: {
    gap: RSpacing.lg,
  },
  inputGroup: {
    gap: RSpacing.xs,
  },
  label: {
    fontSize: RFontSizes.sm,
    fontWeight: '500',
    marginLeft: RSpacing.xs,
  },
  input: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: RSpacing.md,
    paddingVertical: RSpacing.md,
    fontSize: RFontSizes.md,
  },
  hint: {
    fontSize: RFontSizes.xs,
    marginLeft: RSpacing.xs,
    marginTop: 2,
  },
  saveButton: {
    marginTop: RSpacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
});
