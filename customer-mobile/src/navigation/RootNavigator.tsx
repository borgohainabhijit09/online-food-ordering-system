import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Utensils, QrCode, ShoppingBag, Package, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { useCustomerStore } from '../store/useCustomerStore';

import { HomeScreen } from '../screens/HomeScreen';
import { RestaurantScreen } from '../screens/RestaurantScreen';
import { DineInScreen } from '../screens/DineInScreen';
import { CartScreen } from '../screens/CartScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { OrdersHistoryScreen } from '../screens/OrdersHistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const ExploreStack = createNativeStackNavigator();
const DineInStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <ExploreStack.Screen name="HomeScreen" component={HomeScreen} />
      <ExploreStack.Screen name="RestaurantDetail" component={RestaurantScreen} />
      <ExploreStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </ExploreStack.Navigator>
  );
}

function DineInNavigator() {
  return (
    <DineInStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <DineInStack.Screen name="DineInHome" component={DineInScreen} />
      <DineInStack.Screen name="RestaurantDetail" component={RestaurantScreen} />
      <DineInStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </DineInStack.Navigator>
  );
}

function CartNavigator() {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <CartStack.Screen name="CartHome" component={CartScreen} />
      <CartStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <CartStack.Screen name="RestaurantDetail" component={RestaurantScreen} />
    </CartStack.Navigator>
  );
}

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <OrdersStack.Screen name="OrdersHome" component={OrdersHistoryScreen} />
      <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <OrdersStack.Screen name="RestaurantDetail" component={RestaurantScreen} />
    </OrdersStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const itemCount = useCustomerStore((s) => s.getItemCount());

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const tabHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Utensils size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="DineIn"
        component={DineInNavigator}
        options={{
          tabBarLabel: 'Dine-In QR',
          tabBarIcon: ({ color, size }) => <QrCode size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartNavigator}
        options={{
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={OrdersNavigator}
        options={{
          tabBarLabel: 'My Orders',
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
