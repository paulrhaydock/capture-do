import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCaptureStore } from '../store';

export function Header() {
  const { toggleListModal, toggleSettingsModal, queue } = useCaptureStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleSettingsModal}>
        <Text style={styles.icon}>⚙️</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>CaptureDo</Text>
        {queue.length > 0 && (
          <View style={styles.queueBadge}>
            <Text style={styles.queueText}>{queue.length}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={toggleListModal}>
        <Text style={styles.icon}>📋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e1e2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  queueBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  queueText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});
