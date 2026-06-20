// Web date/time field — NATIVE stub.
// Never rendered on native (callers guard with Platform.OS === 'web'); native
// keeps using @react-native-community/datetimepicker under its ios/android
// branches. The web counterpart (WebDateTimeField.web.tsx) renders an <input>.
import React from 'react';

export interface WebDateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'datetime' | 'date' | 'time';
  style?: Record<string, unknown>;
}

export function WebDateTimeField(_props: WebDateTimeFieldProps) {
  return null;
}

export default WebDateTimeField;
