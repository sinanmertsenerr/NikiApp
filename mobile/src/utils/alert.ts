// Cross-platform alert — NATIVE.
// Re-exports React Native's Alert unchanged. The web counterpart (alert.web.ts)
// implements the same Alert.alert(title, message?, buttons?, options?) contract
// on top of window.confirm/window.alert, because react-native-web does not ship
// an Alert module (calling Alert.alert would throw on web).
import { Alert } from 'react-native';

export { Alert };
export default Alert;
