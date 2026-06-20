// Local error boundary scoped to the QR scanner subtree. Keeps any scanner
// render-throw (camera/getUserMedia/zxing init edge cases) from reaching the
// app-wide root ErrorBoundary; shows an in-screen message + Reload instead.
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import i18n from '@/i18n';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

export class ScannerErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[ScannerErrorBoundary]', error);
    }
  }

  handleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>{i18n.t('errors.cameraGeneric')}</Text>
          <Pressable style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>{i18n.t('errors.reload')}</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000000',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  buttonText: { color: '#000000', fontSize: 15, fontWeight: '600' },
});

export default ScannerErrorBoundary;
