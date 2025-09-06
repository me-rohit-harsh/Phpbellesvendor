import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock data for restaurants
  const restaurants = [
    {
      id: 1,
      name: 'Shashank da dhaba',
      cuisine: 'North Indian',
      rating: 4.5,
      deliveryTime: '25-30 min',
      image: null,
      isOpen: true,
      distance: '1.2 km'
    },
    {
      id: 2,
      name: 'South Spice',
      cuisine: 'South Indian',
      rating: 4.3,
      deliveryTime: '30-35 min',
      image: null,
      isOpen: true,
      distance: '2.1 km'
    },
    {
      id: 3,
      name: 'Pizza Corner',
      cuisine: 'Italian',
      rating: 4.1,
      deliveryTime: '20-25 min',
      image: null,
      isOpen: false,
      distance: '0.8 km'
    }
  ];

  // Mock data for most ordered food items across all restaurants
  const mostOrderedItems = [
    {
      id: 1,
      name: 'Masala Dosa',
      restaurant: 'South Spice',
      price: 149,
      rating: 4.6,
      totalOrders: 203,
      image: null,
      category: 'Main Course'
    },
    {
      id: 2,
      name: 'Chicken Biryani',
      restaurant: 'Shashank da dhaba',
      price: 299,
      rating: 4.7,
      totalOrders: 156,
      image: null,
      category: 'Main Course'
    },
    {
      id: 3,
      name: 'Mango Lassi',
      restaurant: 'Shashank da dhaba',
      price: 79,
      rating: 4.4,
      totalOrders: 134,
      image: null,
      category: 'Beverages'
    },
    {
      id: 4,
      name: 'Paneer Butter Masala',
      restaurant: 'Shashank da dhaba',
      price: 249,
      rating: 4.5,
      totalOrders: 89,
      image: null,
      category: 'Main Course'
    },
    {
      id: 5,
      name: 'Margherita Pizza',
      restaurant: 'Pizza Corner',
      price: 199,
      rating: 4.2,
      totalOrders: 78,
      image: null,
      category: 'Main Course'
    }
  ];

  const categories = ['All', 'Main Course', 'Beverages', 'Dessert', 'Snacks'];

  const filteredItems = mostOrderedItems.filter(item => {
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity style={styles.restaurantCard}>
      <View style={styles.restaurantImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.restaurantImage} />
        ) : (
          <View style={styles.placeholderRestaurantImage}>
            <Ionicons name="restaurant" size={32} color="#9CA3AF" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <Text style={styles.deliveryTime}>{item.deliveryTime}</Text>
          <Text style={styles.distance}>{item.distance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity style={styles.foodItemCard}>
      <View style={styles.foodImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.foodImage} />
        ) : (
          <View style={styles.placeholderFoodImage}>
            <Ionicons name="fast-food" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.foodItemInfo}>
        <Text style={styles.foodItemName}>{item.name}</Text>
        <Text style={styles.restaurantNameSmall}>{item.restaurant}</Text>
        <View style={styles.foodItemMeta}>
          <Text style={styles.foodPrice}>₹{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingSmall}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.orderCount}>{item.totalOrders} orders</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Evening!</Text>
            <Text style={styles.location}>📍 Current Location</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#020A66" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food, restaurants..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurants Near You</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsList}
          />
        </View>

        {/* Most Ordered Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Ordered Food</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <FlatList
            data={filteredItems}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.foodItemRow}
            contentContainerStyle={styles.foodItemsList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  location: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
  },
  searchContainer: {
    marginBottom: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#020A66',
  },
  restaurantsList: {
    paddingHorizontal: 20,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 15,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  restaurantImageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderRestaurantImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingSmall: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
    marginLeft: 2,
  },
  deliveryTime: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginRight: 15,
  },
  distance: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  selectedCategoryButton: {
    backgroundColor: '#020A66',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  foodItemsList: {
    paddingHorizontal: 20,
  },
  foodItemRow: {
    justifyContent: 'space-between',
  },
  foodItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  foodImageContainer: {
    alignItems: 'center',
    paddingTop: 15,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderFoodImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemInfo: {
    padding: 15,
    paddingTop: 10,
  },
  foodItemName: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  restaurantNameSmall: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  foodItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  orderCount: {
    fontSize: 11,
    fontFamily: 'MyFont-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});