import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { Colors } from '@theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  snapPoints: number[]; // e.g. [80, SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.85]
  initialSnap?: number; // index into snapPoints
  children: React.ReactNode;
}

export default function BottomSheet({ snapPoints, initialSnap = 0, children }: BottomSheetProps) {
  const sortedSnaps = useMemo(() => [...snapPoints].sort((a, b) => a - b), [snapPoints]);
  const initialHeight = sortedSnaps[initialSnap] ?? sortedSnaps[0];
  const sheetHeight = useRef(new Animated.Value(initialHeight)).current;
  const lastHeight = useRef(initialHeight);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        // Capture the current value
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = lastHeight.current - gestureState.dy;
        const clamped = Math.max(sortedSnaps[0], Math.min(newHeight, sortedSnaps[sortedSnaps.length - 1]));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = lastHeight.current - gestureState.dy;
        // Find the nearest snap point
        let nearest = sortedSnaps[0];
        let minDist = Infinity;
        for (const sp of sortedSnaps) {
          const dist = Math.abs(currentHeight - sp);
          if (dist < minDist) {
            minDist = dist;
            nearest = sp;
          }
        }
        // Also factor in velocity: if swiping up fast, go to next higher snap
        if (gestureState.vy < -0.5) {
          const higher = sortedSnaps.find(sp => sp > currentHeight);
          if (higher) nearest = higher;
        } else if (gestureState.vy > 0.5) {
          const lower = [...sortedSnaps].reverse().find(sp => sp < currentHeight);
          if (lower !== undefined) nearest = lower;
        }

        lastHeight.current = nearest;
        Animated.spring(sheetHeight, {
          toValue: nearest,
          useNativeDriver: false,
          damping: 20,
          stiffness: 200,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { height: sheetHeight }]}>
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.handle} />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  content: {
    flex: 1,
  },
});
