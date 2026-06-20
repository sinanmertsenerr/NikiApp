// Web date/time field — WEB.
// @react-native-community/datetimepicker has no web build, so admin campaign/raffle
// schedule fields use a native HTML <input type="datetime-local"> here. Same props
// as the native stub so callers can render <WebDateTimeField> behind a
// Platform.OS === 'web' branch without touching the ios/android picker code.
import React from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export interface WebDateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'datetime' | 'date' | 'time';
  style?: Record<string, unknown>;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toInputValue(d: Date, mode: string): string {
  if (!d || isNaN(d.getTime())) return '';
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (mode === 'date') return date;
  if (mode === 'time') return time;
  return `${date}T${time}`;
}

export function WebDateTimeField({ value, onChange, mode = 'datetime', style }: WebDateTimeFieldProps) {
  const inputType = mode === 'date' ? 'date' : mode === 'time' ? 'time' : 'datetime-local';
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

  return (
    <input
      type={inputType}
      value={toInputValue(value, mode)}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return;
        if (mode === 'time') {
          const base = value && !isNaN(value.getTime()) ? new Date(value) : new Date();
          const [hh, mm] = v.split(':').map(Number);
          base.setHours(hh, mm, 0, 0);
          onChange(base);
          return;
        }
        // datetime-local / date are parsed in local time by the Date constructor
        const parsed = new Date(v);
        if (!isNaN(parsed.getTime())) onChange(parsed);
      }}
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '15px',
        borderRadius: '12px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        color: isDark ? '#FFFFFF' : '#1A1A1A',
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        border: `1px solid ${isDark ? '#333333' : '#cccccc'}`,
        colorScheme: isDark ? 'dark' : 'light',
        ...(style || {}),
      }}
    />
  );
}

export default WebDateTimeField;
