import React from 'react';
import {
  Text, ActivityIndicator, Pressable,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!isDisabled) scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    if (!isDisabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'outline' && styles.outline,
          variant === 'ghost'   && styles.ghost,
          isDisabled && styles.disabled,
          pressed && variant === 'ghost' && { opacity: 0.7 }
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
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base:        { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, flexDirection: 'row', gap: 8 },
  primary:     { backgroundColor: Colors.accent, elevation: 4, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  outline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.accent },
  ghost:       { backgroundColor: 'transparent' },
  disabled:    { opacity: 0.6, elevation: 0, shadowOpacity: 0 },
  text:        { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  textPrimary: { color: Colors.white },
  textOutline: { color: Colors.accent },
  textGhost:   { color: Colors.primary },
});