import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useCaptureStore } from '../store';

const AnimatedView = Animated.createAnimatedComponent(View);

// Integration configuration
const INTEGRATIONS = [
  { id: 'todoist', name: 'Todoist', emoji: '✅', connected: false },
  { id: 'reminders', name: 'Reminders', emoji: '🔔', connected: false, isNative: true },
  { id: 'claude', name: 'Claude', emoji: '🤖', connected: false },
  { id: 'chatgpt', name: 'ChatGPT', emoji: '💬', connected: false },
];

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    toggleSettingsModal,
    captures,
  } = useCaptureStore();

  const handleConnect = (integrationId: string, isNative?: boolean) => {
    if (isNative) {
      Alert.alert(
        'Grant Access',
        'This will request permission to access your Reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Access', onPress: () => console.log('Request reminders permission') },
        ]
      );
    } else {
      Alert.alert(
        'Connect Account',
        `Connect your ${integrationId} account via OAuth.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => console.log(`Connect ${integrationId}`) },
        ]
      );
    }
  };

  const handleExportAll = () => {
    const captureCount = captures.length;
    Alert.alert(
      'Export All Captures',
      `Export ${captureCount} captures to JSON?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement actual export
            Alert.alert('Exported', `${captureCount} captures exported successfully.`);
          }
        },
      ]
    );
  };

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
          <TouchableOpacity onPress={toggleSettingsModal} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Integrations Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTEGRATIONS</Text>

            {INTEGRATIONS.map((integration) => (
              <View key={integration.id} style={styles.integrationRow}>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationEmoji}>{integration.emoji}</Text>
                  <Text style={styles.integrationName}>{integration.name}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    integration.connected && styles.connectedButton,
                  ]}
                  onPress={() => handleConnect(integration.id, integration.isNative)}
                >
                  <Text
                    style={[
                      styles.connectButtonText,
                      integration.connected && styles.connectedButtonText,
                    ]}
                  >
                    {integration.connected
                      ? 'Manage'
                      : integration.isNative
                        ? 'Grant Access'
                        : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA</Text>

            <TouchableOpacity style={styles.actionRow} onPress={handleExportAll}>
              <Text style={styles.actionEmoji}>📤</Text>
              <Text style={styles.actionText}>Export All Captures</Text>
            </TouchableOpacity>
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
    height: '55%',
    backgroundColor: '#13131f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    position: 'absolute',
    top: 8,
    width: 36,
    height: 4,
    backgroundColor: '#3f3f5a',
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  integrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  integrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  integrationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  integrationName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectedButton: {
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#3f3f5a',
  },
  connectButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  connectedButtonText: {
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
  },
  actionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    height: 40,
  },
});
