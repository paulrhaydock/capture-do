import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCaptureStore } from '../store';

const AnimatedView = Animated.createAnimatedComponent(View);

interface CaptureInputProps {
  autoFocus?: boolean;
}

export function CaptureInput({ autoFocus = true }: CaptureInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = React.useState('');

  const { addCapture, settings } = useCaptureStore();

  // Animation values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Focus input on mount if autoFocus enabled
  useEffect(() => {
    if (autoFocus && settings.autoOpenKeyboard) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, settings.autoOpenKeyboard]);

  const triggerHaptic = useCallback(() => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [settings.hapticFeedback]);

  const handleSubmit = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Trigger haptic feedback
    triggerHaptic();

    // Fire and Forget animation
    // 1. Scale up slightly
    scale.value = withSequence(
      withSpring(1.02, { damping: 15 }),
      withSpring(0.98, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );

    // 2. Slide up and fade out (simulating "sent")
    translateY.value = withSpring(-20, { damping: 20 });
    opacity.value = withSpring(0.3, { damping: 20 }, () => {
      // Reset after animation
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
    });

    // Clear input immediately (Fire and Forget UX)
    setText('');

    // Add to queue (non-blocking)
    try {
      await addCapture(trimmedText, 'text');
    } catch (error) {
      console.error('Failed to capture:', error);
    }

    // Keep keyboard open for next capture
    inputRef.current?.focus();
  }, [text, addCapture, scale, translateY, opacity, triggerHaptic]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView style={[styles.container, animatedStyle]}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Capture anything..."
        placeholderTextColor="#666"
        multiline
        maxLength={2000}
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={handleSubmit}
        autoCapitalize="sentences"
        autoCorrect
      />
      <TouchableOpacity
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <View style={styles.sendIcon}>
          <View style={styles.arrow} />
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1e1e2e',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#fff',
    maxHeight: 120,
    paddingVertical: 4,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#3f3f5a',
  },
  sendIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
    transform: [{ rotate: '0deg' }],
  },
});
