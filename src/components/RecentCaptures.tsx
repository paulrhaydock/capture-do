import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from 'react-native-reanimated';
import { useCaptureStore } from '../store';
import type { Capture } from '../types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RecentCapturesProps {
  maxItems?: number;
  onViewAll?: () => void;
}

export function RecentCaptures({ maxItems = 5, onViewAll }: RecentCapturesProps) {
  const { captures, categories } = useCaptureStore();

  // Get recent captures
  const recentCaptures = captures.slice(0, maxItems);

  const getCategoryEmoji = (categoryId: string | null): string => {
    if (!categoryId) return '📥';
    const category = categories.find((c) => c.id === categoryId);
    return category?.emoji ?? '📥';
  };

  const getStatusIndicator = (status: Capture['status']): { color: string; label: string } => {
    switch (status) {
      case 'pending':
        return { color: '#fbbf24', label: '⏳' };
      case 'processing':
        return { color: '#3b82f6', label: '⚙️' };
      case 'completed':
        return { color: '#22c55e', label: '✓' };
      case 'failed':
        return { color: '#ef4444', label: '✗' };
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderItem = ({ item, index }: { item: Capture; index: number }) => {
    const status = getStatusIndicator(item.status);
    const displayText = item.extractedTitle || item.rawText;

    return (
      <AnimatedTouchable
        entering={FadeInDown.delay(index * 50).springify()}
        exiting={FadeOutUp}
        layout={Layout.springify()}
        style={styles.captureItem}
        activeOpacity={0.7}
      >
        <View style={styles.captureLeft}>
          <Text style={styles.categoryEmoji}>
            {getCategoryEmoji(item.categoryId)}
          </Text>
          <View style={styles.captureContent}>
            <Text style={styles.captureText} numberOfLines={2}>
              {displayText}
            </Text>
            <View style={styles.captureMetaRow}>
              <Text style={styles.captureTime}>{formatTime(item.createdAt)}</Text>
              {item.extractedPriority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>!</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.statusDot, { backgroundColor: status.color }]}>
          <Text style={styles.statusLabel}>{status.label}</Text>
        </View>
      </AnimatedTouchable>
    );
  };

  if (recentCaptures.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No captures yet</Text>
        <Text style={styles.emptySubtext}>Start typing to capture your first thought</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent</Text>
        {captures.length > maxItems && onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View all ({captures.length})</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={recentCaptures}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  captureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  captureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  captureContent: {
    flex: 1,
  },
  captureText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  captureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  captureTime: {
    fontSize: 12,
    color: '#666',
  },
  priorityBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusLabel: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
});
