import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Header,
  CaptureInput,
  RecentCaptures,
  SmartListModal,
  SettingsModal,
} from '../components';
import { useCaptureStore } from '../store';

export function CaptureScreen() {
  const { initialize, isInitialized, toggleListModal } = useCaptureStore();

  // Initialize store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />

        {/* Header with settings and list buttons */}
        <Header />

        {/* Recent captures list */}
        <View style={styles.content}>
          <RecentCaptures maxItems={5} onViewAll={toggleListModal} />
        </View>

        {/* Capture input at bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <SafeAreaView edges={['bottom']}>
            <CaptureInput autoFocus />
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Modals */}
        <SmartListModal />
        <SettingsModal />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
});
