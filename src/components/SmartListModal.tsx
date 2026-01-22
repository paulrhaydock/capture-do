import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Pressable,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useCaptureStore } from '../store';
import type { Capture, CategoryId, ProcessingStatus } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export function SmartListModal() {
  const {
    isListModalOpen,
    toggleListModal,
    captures,
    categories,
    filter,
    setFilter,
    clearFilter,
    deleteCapture,
  } = useCaptureStore();

  // Filter captures based on current filter state
  const filteredCaptures = useMemo(() => {
    return captures.filter((capture) => {
      // Category filter
      if (filter.categories.length > 0 && !filter.categories.includes(capture.categoryId as CategoryId)) {
        return false;
      }

      // Status filter
      if (filter.statuses.length > 0 && !filter.statuses.includes(capture.status)) {
        return false;
      }

      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const text = (capture.extractedTitle || capture.rawText).toLowerCase();
        if (!text.includes(query)) {
          return false;
        }
      }

      // Date range
      if (filter.dateRange.start && capture.createdAt < filter.dateRange.start) {
        return false;
      }
      if (filter.dateRange.end && capture.createdAt > filter.dateRange.end) {
        return false;
      }

      return true;
    });
  }, [captures, filter]);

  const toggleCategoryFilter = (categoryId: CategoryId) => {
    const newCategories = filter.categories.includes(categoryId)
      ? filter.categories.filter((c) => c !== categoryId)
      : [...filter.categories, categoryId];
    setFilter({ categories: newCategories });
  };

  const toggleStatusFilter = (status: ProcessingStatus) => {
    const newStatuses = filter.statuses.includes(status)
      ? filter.statuses.filter((s) => s !== status)
      : [...filter.statuses, status];
    setFilter({ statuses: newStatuses });
  };

  const handleDelete = async (capture: Capture) => {
    await deleteCapture(capture.id);
  };

  const renderRightActions = (capture: Capture) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(capture)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderCaptureItem = ({ item }: { item: Capture }) => {
    const category = categories.find((c) => c.id === item.categoryId);
    const displayText = item.extractedTitle || item.rawText;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <View style={styles.captureItem}>
          <Text style={styles.categoryEmoji}>{category?.emoji || '📥'}</Text>
          <View style={styles.captureContent}>
            <Text style={styles.captureText} numberOfLines={2}>
              {displayText}
            </Text>
            <View style={styles.captureMetaRow}>
              <Text style={styles.captureCategory}>{category?.name || 'Inbox'}</Text>
              {item.extractedPriority && (
                <View
                  style={[
                    styles.priorityChip,
                    item.extractedPriority === 'high' && styles.priorityHigh,
                    item.extractedPriority === 'medium' && styles.priorityMedium,
                  ]}
                >
                  <Text style={styles.priorityChipText}>{item.extractedPriority}</Text>
                </View>
              )}
              {item.extractedDueDate && (
                <Text style={styles.dueDate}>
                  📅 {new Date(item.extractedDueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  const statusFilters: { status: ProcessingStatus; label: string; emoji: string }[] = [
    { status: 'pending', label: 'Pending', emoji: '⏳' },
    { status: 'processing', label: 'Processing', emoji: '⚙️' },
    { status: 'completed', label: 'Done', emoji: '✅' },
    { status: 'failed', label: 'Failed', emoji: '❌' },
  ];

  const hasActiveFilters =
    filter.categories.length > 0 ||
    filter.statuses.length > 0 ||
    filter.searchQuery !== '';

  return (
    <Modal
      visible={isListModalOpen}
      animationType="none"
      transparent
      onRequestClose={toggleListModal}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable style={styles.backdrop} onPress={toggleListModal}>
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
            <View style={styles.headerRow}>
              <Text style={styles.title}>All Captures</Text>
              <Text style={styles.count}>{filteredCaptures.length} items</Text>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterSection}>
            {/* Category filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterChip,
                    filter.categories.includes(category.id) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleCategoryFilter(category.id)}
                >
                  <Text style={styles.filterChipEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.categories.includes(category.id) && styles.filterChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Status filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
            >
              {statusFilters.map(({ status, label, emoji }) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filter.statuses.includes(status) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleStatusFilter(status)}
                >
                  <Text style={styles.filterChipEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.statuses.includes(status) && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
                  <Text style={styles.clearButtonText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Capture List */}
          <FlatList
            data={filteredCaptures}
            renderItem={renderCaptureItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No captures match your filters</Text>
              </View>
            }
          />
        </AnimatedView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
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
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3f3f5a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  count: {
    fontSize: 14,
    color: '#666',
  },
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#999',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  captureItem: {
    flexDirection: 'row',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
    marginBottom: 6,
  },
  captureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  captureCategory: {
    fontSize: 12,
    color: '#666',
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#3f3f5a',
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#f97316',
  },
  priorityChipText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
