import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useCaptureStore } from '../store';
import type { Settings } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    toggleSettingsModal,
    settings,
    updateSetting,
    categories,
  } = useCaptureStore();

  const themeOptions: { value: Settings['theme']; label: string; emoji: string }[] = [
    { value: 'system', label: 'System', emoji: '📱' },
    { value: 'light', label: 'Light', emoji: '☀️' },
    { value: 'dark', label: 'Dark', emoji: '🌙' },
  ];

  return (
    <Modal
      visible={isSettingsModalOpen}
      animationType="none"
      transparent
      onRequestClose={toggleSettingsModal}
    >
      <Pressable style={styles.backdrop} onPress={toggleSettingsModal}>
        <AnimatedView
          entering={FadeIn}
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <AnimatedView
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown}
        style={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Theme</Text>
              <View style={styles.themeOptions}>
                {themeOptions.map(({ value, label, emoji }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.themeOption,
                      settings.theme === value && styles.themeOptionActive,
                    ]}
                    onPress={() => updateSetting('theme', value)}
                  >
                    <Text style={styles.themeEmoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.themeLabel,
                        settings.theme === value && styles.themeLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Behavior Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behavior</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDescription}>
                  Vibrate when capturing
                </Text>
              </View>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => updateSetting('hapticFeedback', value)}
                trackColor={{ false: '#3f3f5a', true: '#6366f1' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-open Keyboard</Text>
                <Text style={styles.settingDescription}>
                  Show keyboard on app launch
                </Text>
              </View>
              <Switch
                value={settings.autoOpenKeyboard}
                onValueChange={(value) => updateSetting('autoOpenKeyboard', value)}
                trackColor={{ false: '#3f3f5a', true: '#6366f1' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Default Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Category</Text>
            <Text style={styles.sectionDescription}>
              New captures will be added to this category
            </Text>

            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    settings.defaultCategory === category.id &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => updateSetting('defaultCategory', category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      settings.defaultCategory === category.id &&
                        styles.categoryNameActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>0.1.0 (MVP)</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Built with</Text>
              <Text style={styles.aboutValue}>Expo SDK 54</Text>
            </View>
          </View>

          {/* Footer spacing */}
          <View style={styles.footer} />
        </ScrollView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#13131f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3f3f5a',
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f5a',
  },
  themeOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
  },
  themeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  themeLabel: {
    fontSize: 13,
    color: '#999',
  },
  themeLabelActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f120',
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#999',
  },
  categoryNameActive: {
    color: '#fff',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  aboutLabel: {
    fontSize: 15,
    color: '#666',
  },
  aboutValue: {
    fontSize: 15,
    color: '#fff',
  },
  footer: {
    height: 40,
  },
});
