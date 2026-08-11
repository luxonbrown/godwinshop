import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { HomeTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useCart } from '../context/CartContext';

const Tab = createBottomTabNavigator<HomeTabParamList>();

const ICONS: Record<keyof HomeTabParamList, [string, string]> = {
  HomeTab: ['home', 'home-outline'],
  ShopTab: ['grid', 'grid-outline'],
  CategoriesTab: ['pricetags', 'pricetags-outline'],
  CartTab: ['cart', 'cart-outline'],
  ProfileTab: ['person', 'person-outline']
};

function tabIcon(name: keyof HomeTabParamList, focused: boolean) {
  const [on, off] = ICONS[name];
  return <Ionicons name={(focused ? on : off) as never} size={22} color={focused ? colors.accent : colors.muted} />;
}

export default function TabNavigator() {
  const { count } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.base }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => tabIcon('HomeTab', focused) }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ProductsScreen}
        options={{ tabBarLabel: 'Shop', tabBarIcon: ({ focused }) => tabIcon('ShopTab', focused) }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{ tabBarLabel: 'Categories', tabBarIcon: ({ focused }) => tabIcon('CategoriesTab', focused) }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => tabIcon('CartTab', focused),
          tabBarBadge: count > 0 ? (count > 99 ? '99+' : count) : undefined,
          tabBarBadgeStyle: styles.badge
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => tabIcon('ProfileTab', focused) }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6
  },
  label: {
    fontSize: 11
  },
  badge: {
    backgroundColor: colors.accent,
    color: colors.black,
    fontSize: 11,
    fontWeight: '700'
  }
});