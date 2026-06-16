import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors }   from '@theme/colors';

interface Props extends TextInputProps {
  label:       string;
  error?:      string;
  iconName?:   React.ComponentProps<typeof Ionicons>['name'];
  isPassword?: boolean;
}

export default function FormInput({
  label, error, iconName, isPassword, style, onFocus, onBlur, ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 250 });
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 250 });
    onBlur?.(e);
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    if (error) return { borderColor: Colors.error };
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [Colors.border, Colors.primary]
    );
    return { borderColor };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, error && { color: Colors.error }, isFocused && !error && { color: Colors.primary }]}>
        {label}
      </Text>
      <Animated.View style={[styles.inputRow, animatedBorderStyle]}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={error ? Colors.error : (isFocused ? Colors.primary : Colors.textMuted)}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, letterSpacing: 0.3 },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12,
    backgroundColor: Colors.surface, paddingHorizontal: 14,
  },
  icon:       { marginRight: 10 },
  input:      { flex: 1, height: 52, fontSize: 16, color: Colors.text, fontWeight: '500' },
  eyeBtn:     { padding: 8, marginRight: -4 },
  errorText:  { fontSize: 13, fontWeight: '500', color: Colors.error, marginTop: 6 },
});