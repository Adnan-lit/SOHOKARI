import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors } from '@theme/colors';

interface Props {
  title:      string;
  onPress:    () => void;
  loading?:   boolean;
  disabled?:  boolean;
  variant?:   'primary' | 'outline' | 'ghost';
  style?:     ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title, onPress, loading, disabled,
  variant = 'primary', style, textStyle,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost'   && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} />
        : <Text style={[
            styles.text,
            variant === 'primary' && styles.textPrimary,
            variant === 'outline' && styles.textOutline,
            variant === 'ghost'   && styles.textGhost,
            textStyle,
          ]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:        { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primary:     { backgroundColor: Colors.accent },
  outline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.accent },
  ghost:       { backgroundColor: 'transparent' },
  disabled:    { opacity: 0.5 },
  text:        { fontSize: 16, fontWeight: '600' },
  textPrimary: { color: Colors.white },
  textOutline: { color: Colors.accent },
  textGhost:   { color: Colors.primary },
});