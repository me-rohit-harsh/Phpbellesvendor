import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CategoryCard = ({ category, onPress, onEdit, onDelete }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(category);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(category);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(category);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* Category Image */}
        <View style={styles.imageContainer}>
          {category.image ? (
            <Image source={{ uri: category.image }} style={styles.categoryImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: category.color || '#F3F4F6' }]}>
              <Ionicons 
                name="restaurant-outline" 
                size={32} 
                color={category.color ? '#FFFFFF' : '#9CA3AF'} 
              />
            </View>
          )}
        </View>

        {/* Category Info */}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name || 'Unnamed Category'}
          </Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {category.description || 'No description available'}
          </Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant" size={14} color="#6B7280" />
              <Text style={styles.statText}>
                {category.items_count || 0} items
              </Text>
            </View>
            {category.is_active !== undefined && (
              <View style={[styles.statusBadge, category.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, category.is_active ? styles.activeText : styles.inactiveText]}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 16,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'MyFont-Medium',
  },
  activeText: {
    color: '#065F46',
  },
  inactiveText: {
    color: '#991B1B',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
});

export default CategoryCard;