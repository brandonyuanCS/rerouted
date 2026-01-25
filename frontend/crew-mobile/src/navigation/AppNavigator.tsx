import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { typography, borderRadius } from '../theme/typography';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AssignmentScreen from '../screens/AssignmentScreen';
import StatusScreen from '../screens/StatusScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Assignments: undefined;
  Status: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon: React.FC<{ label: string; focused: boolean }> = ({ label, focused }) => {
  const getIcon = () => {
    switch (label) {
      case 'Home':
        return 'H';
      case 'Offers':
        return '+';
      case 'Status':
        return 'i';
      default:
        return '?';
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
        <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>
          {getIcon()}
        </Text>
      </View>
    </View>
  );
};

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.textOnDarkGlass,
        tabBarInactiveTintColor: colors.textOnDarkGlassMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tabBarGradient} />
          </View>
        ),
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentScreen}
        options={{
          tabBarLabel: 'Offers',
          tabBarIcon: ({ focused }) => <TabIcon label="Offers" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Status"
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ focused }) => <TabIcon label="Status" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 85,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 50, 100, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  tabBarGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tabIconText: {
    ...typography.bodyBold,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabIconTextActive: {
    color: colors.textInverse,
  },
});

export default AppNavigator;
