// Mobile frame — WEB.
// Makes the website look like a mobile app: on phone-width viewports it fills the
// screen (full bleed); on tablet/desktop it renders a centered ~430px phone column
// with a rounded device frame + shadow over a neutral backdrop. The inner width is
// kept in sync with the responsive scaling clamp in responsive.web.ts.
import React from 'react';
import { Dimensions, StyleSheet, View, useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

const MAX_PHONE_WIDTH = 430;

export function MobileFrame({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

  const viewportWidth = Dimensions.get('window').width;
  const isDesktop = viewportWidth > MAX_PHONE_WIDTH;

  const appBg = isDark ? '#121212' : '#FFFFFF';
  const backdropBg = isDark ? '#000000' : '#E5E5EA';

  return (
    <View style={[styles.backdrop, { backgroundColor: isDesktop ? backdropBg : appBg }]}>
      <View
        style={[
          styles.frame,
          { backgroundColor: appBg },
          isDesktop && styles.frameDesktop,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    minHeight: '100%' as any,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_PHONE_WIDTH,
    overflow: 'hidden',
    // A transform makes this the containing block for position:fixed descendants,
    // so react-native-web Modals stay inside the phone column on desktop instead
    // of covering the whole viewport. Inert on phone-width (full-bleed).
    transform: [{ translateX: 0 }],
  },
  frameDesktop: {
    marginVertical: 16,
    borderRadius: 28,
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    maxHeight: 'calc(100% - 32px)' as any,
  },
});

export default MobileFrame;
