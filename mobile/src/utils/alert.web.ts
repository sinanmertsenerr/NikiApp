// Cross-platform alert — WEB.
// react-native-web has no Alert module, so we reproduce the RN Alert.alert API
// using the browser's native dialogs while preserving the button/onPress/style
// contract so confirm/cancel/destructive callbacks still fire on web.

type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

interface AlertButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: AlertButtonStyle;
  isPreferred?: boolean;
}

function joinText(title?: string, message?: string): string {
  return [title, message].filter(Boolean).join('\n\n');
}

function alert(title: string, message?: string, buttons?: AlertButton[], _options?: unknown): void {
  if (typeof window === 'undefined') return;

  const text = joinText(title, message);

  // 0–1 button → simple acknowledgement dialog.
  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }
  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  // 2+ buttons → confirm dialog. The "cancel"-styled button (or the first one)
  // maps to Cancel; the primary action maps to OK.
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const confirmBtn =
    buttons.find((b) => b.isPreferred) ??
    buttons.find((b) => b.style !== 'cancel') ??
    buttons[buttons.length - 1];

  const confirmed = window.confirm(text);
  if (confirmed) {
    confirmBtn?.onPress?.();
  } else {
    (cancelBtn ?? buttons[0])?.onPress?.();
  }
}

export const Alert = { alert };
export default Alert;
