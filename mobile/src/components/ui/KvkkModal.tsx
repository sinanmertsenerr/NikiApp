import React, { useState, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
    Colors,
    DarkColors,
    RSpacing,
    RFontSizes,
    BorderRadius,
    RBorderRadius,
    Shadows,
} from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useColorScheme } from 'react-native';
import { Button } from './Button';

interface KvkkModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export const KvkkModal: React.FC<KvkkModalProps> = ({
    visible,
    onClose,
    onAccept,
}) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const { theme } = useSettingsStore();
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

    const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
    const colors = isDark ? DarkColors : Colors;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

        // Check if user scrolled to bottom (with some tolerance)
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

        if (isCloseToBottom && !isScrolledToBottom) {
            setIsScrolledToBottom(true);
        }
    };

    const handleAccept = () => {
        if (isScrolledToBottom) {
            onAccept();
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
                ) : (
                    <View style={[styles.dimmedBackground, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]} />
                )}

                <View style={[styles.modalContainer, { backgroundColor: colors.background, shadowColor: colors.cardShadow }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {t('auth.kvkkLightingText', 'Aydınlatma Metni')}
                        </Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        onScroll={handleScroll}
                        scrollEventThrottle={16} // Provide smooth scroll updates
                        indicatorStyle={isDark ? 'white' : 'black'}
                    >
                        <Text style={[styles.text, { color: colors.text }]}>
                            <Text style={styles.bold}>NİKİ COFFEE KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ</Text>
                            {'\n\n'}
                            <Text style={styles.bold}>1. Veri Sorumlusu</Text>
                            {'\n'}
                            İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuata uygun olarak, mobil uygulamamızın ("Uygulama") kullanıcıları olarak sizlerin kişisel verilerine ilişkin esasları belirtmek amacıyla hazırlanmıştır. Veri sorumlusu sıfatıyla Niki Coffee olarak, kişisel verilerinizi aşağıda açıklanan amaçlar kapsamında ve mevzuata uygun olarak işlemekteyiz.
                            {'\n\n'}
                            <Text style={styles.bold}>2. Kişisel Verilerin İşlenme Amacı</Text>
                            {'\n'}
                            Toplanan kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları dahilinde ve aşağıdaki amaçlarla işlenecektir:
                            {'\n'}• Üyelik işlemlerinin gerçekleştirilmesi ve üyelik hizmetlerinin sunulması,
                            {'\n'}• Uygulama üzerinden sunulan ürün ve hizmetlerin ifası, operasyonel süreçlerin yürütülmesi,
                            {'\n'}• Kullanıcı memnuniyetine yönelik aktivitelerin yürütülmesi, talep ve şikayetlerin takibi,
                            {'\n'}• İletişim faaliyetlerinin yürütülmesi, müşteri desteği sağlanması,
                            {'\n'}• Yasal yükümlülüklerin yerine getirilmesi (fatura düzenlenmesi, resmi kurum taleplerine cevap verilmesi vb.),
                            {'\n'}• Bilgi güvenliği süreçlerinin yürütülmesi, uygulamanın güvenliğinin sağlanması,
                            {'\n'}• Hukuki süreçlerin yürütülmesi ve doğabilecek uyuşmazlıklarda delil olarak kullanılması.
                            {'\n\n'}
                            <Text style={styles.bold}>3. İşlenen Kişisel Veri Kategorileri</Text>
                            {'\n'}
                            Uygulama kullanımınız sırasında toplanabilecek kişisel veri kategorileri aşağıda belirtilmiştir:
                            {'\n'}• <Text style={styles.bold}>Kimlik ve Profil Bilgileri:</Text> Ad, soyad, biyografi, profil fotoğrafı.
                            {'\n'}• <Text style={styles.bold}>İletişim Bilgileri:</Text> E-posta adresi, telefon numarası.
                            {'\n'}• <Text style={styles.bold}>İşlem Güvenliği Bilgileri:</Text> IP adresi, cihaz bilgileri, uygulama erişim logları (parola hash vb.).
                            {'\n'}• <Text style={styles.bold}>Finansal Bilgiler:</Text> Cüzdan bakiyesi, harcama bilgileri, yapılan ödeme tutarları.
                            {'\n'}• <Text style={styles.bold}>Müşteri İşlem Bilgileri:</Text> Sipariş geçmişi, talep/şikayet bilgileri, kampanya katılım ve ödül puan bilgileri.
                            {'\n\n'}
                            <Text style={styles.bold}>4. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</Text>
                            {'\n'}
                            Kişisel verileriniz, uygulama üzerinden doldurduğunuz formlar ve elektronik ortamdaki etkileşimleriniz vasıtasıyla toplanmaktadır. Veri toplamanın hukuki sebepleri şunlardır:
                            {'\n'}• Sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (KVKK m.5/2-c),
                            {'\n'}• Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması (KVKK m.5/2-ç),
                            {'\n'}• İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması (KVKK m.5/2-f).
                            {'\n\n'}
                            <Text style={styles.bold}>5. Kişisel Verilerin Aktarılması</Text>
                            {'\n'}
                            Kişisel verileriniz, yukarıda belirtilen amaçlar doğrultusunda ve KVKK'nın 8. ve 9. maddelerine uygun olarak; yetkili kamu kurum ve kuruluşlarına (yasal zorunluluklar gereği) ve hizmetlerimizi sunabilmek amacıyla iş ortaklarımıza/tedarikçilerimize aktarılabilecektir.
                            {'\n\n'}
                            <Text style={styles.bold}>6. Haklarınız</Text>
                            {'\n'}
                            KVKK'nın 11. maddesi uyarınca veri sahipleri olarak; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını öğrenme, verilerin düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme, ve kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz. Taleplerinizi niki@ieu.app adresine iletebilirsiniz.
                        </Text>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <View style={styles.warningContainer}>
                            {!isScrolledToBottom && (
                                <Text style={[styles.warningText, { color: colors.warning }]}>
                                    Onaylamak için metni sonuna kadar okuyunuz.
                                </Text>
                            )}
                        </View>
                        <Button
                            title={t('common.readAndAccept', 'Okudum, Onaylıyorum')}
                            onPress={handleAccept}
                            disabled={!isScrolledToBottom}
                            size="lg"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dimmedBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        height: '85%',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        ...Shadows.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: RSpacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: RFontSizes.lg,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        right: RSpacing.md,
        padding: RSpacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: RSpacing.lg,
        paddingBottom: RSpacing.xxl,
    },
    text: {
        fontSize: RFontSizes.md,
        lineHeight: 24,
    },
    bold: {
        fontWeight: '700',
    },
    footer: {
        padding: RSpacing.lg,
        paddingBottom: Platform.OS === 'ios' ? RSpacing.xl : RSpacing.lg,
        borderTopWidth: 1,
        gap: RSpacing.sm,
    },
    warningContainer: {
        height: 20,
        alignItems: 'center',
        marginBottom: RSpacing.xs,
    },
    warningText: {
        fontSize: RFontSizes.xs,
        fontWeight: '500',
    },
});
