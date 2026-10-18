import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { Colors } from '../theme/colors';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { KotScreen } from '../screens/kot/KotScreen';
import { TablesScreen } from '../screens/tables/TablesScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

import { ShoppingBag, ChefHat, Utensils, Settings as SettingsIcon } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Live Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="KOT"
        component={KotScreen}
        options={{
          tabBarLabel: 'Kitchen KOT',
          tabBarIcon: ({ color, size }) => <ChefHat size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Tables"
        component={TablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color, size }) => <Utensils size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Store Manager',
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
