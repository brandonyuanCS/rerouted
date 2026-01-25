import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Card, DutyTimeBar, AssignmentCard, Assignment, GlassCard } from '../components';
import { TabParamList } from '../navigation/AppNavigator';
import { useAssignment } from '../context/AssignmentContext';

const { width } = Dimensions.get('window');



import { optimizationData } from '../data/optimizationData';

type DashboardScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Dashboard'>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { currentAssignment, systemStatus } = useAssignment();

  // Hardcoded user for demo
  const currentUser = {
    id: 'PLT001',
    name: 'Sarah Johnson',
    role: 'Captain',
    base: 'DFW',
    dutyHoursRemaining: 8.5
  };

  // Notification Animation
  const translateY = useRef(new Animated.Value(-150)).current;
  const [notificationVisible, setNotificationVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotificationVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)), // Bouncy effect
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotificationVisible(false));
  };

  const handleViewOffers = () => {
    handleDismiss();
    navigation.navigate('Assignments');
  };

  // 1. Find the user's current assignment in the data - REPLACED BY CONTEXT
  // 2. Construct assignment object - REPLACED BY CONTEXT

  // 3. Stats from data
  // "workers_started": 4 -> maybe show in a different view or as a system status

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.success;
      default:
        return colors.textOnGlassMuted;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background Image */}
      <ImageBackground
        source={require('../../assets/csbg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Notification Popup */}
          {notificationVisible && (
            <Animated.View style={[
              styles.notificationContainer,
              { transform: [{ translateY }] }
            ]}>
              <GlassCard variant="default" style={styles.notificationCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.notificationContent}>
                  <View style={styles.notificationIcon}>
                    <Text style={{ fontSize: 20 }}>🚨</Text>
                  </View>
                  <View style={styles.notificationTextContainer}>
                    <Text style={styles.notificationTitle}>URGENT UPDATE</Text>
                    <Text style={styles.notificationBody}>
                      New optimized schedule available. Action required immediately.
                    </Text>
                  </View>
                </View>
                <View style={styles.notificationActions}>
                  <TouchableOpacity onPress={handleDismiss} style={styles.notificationDismiss}>
                    <Text style={styles.notificationDismissText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleViewOffers} style={styles.notificationButton}>
                    <Text style={styles.notificationButtonText}>View Options</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Glass Header */}
          <GlassCard variant="dark" style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{currentUser.name}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentUser.base}</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.metaText}>ID: {currentUser.id}</Text>
              <Text style={styles.metaDot}>|</Text>
              <Text style={styles.metaText}>{currentUser.role}</Text>
            </View>
          </GlassCard>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>

            <Card variant="elevated" style={styles.dutyCard}>
              <DutyTimeBar hoursRemaining={currentUser.dutyHoursRemaining} />
            </Card>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Assignment</Text>
              {currentAssignment ? (
                <AssignmentCard assignment={currentAssignment} />
              ) : (
                <GlassCard>
                  <Text style={{ color: colors.textOnGlass, textAlign: 'center' }}>
                    No active assignment found for {currentUser.id}
                  </Text>
                </GlassCard>
              )}
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>System Status</Text>
              <View style={styles.actionGrid}>
                <View style={[styles.actionCard, { alignItems: 'flex-start' }]}>
                  <Text style={[typography.caption, { color: colors.textOnGlassMuted }]}>Status</Text>
                  <Text style={[typography.h3, { color: getStatusColor(systemStatus) }]}>{systemStatus.toUpperCase()}</Text>
                </View>
                <View style={[styles.actionCard, { alignItems: 'flex-start' }]}>
                  <Text style={[typography.caption, { color: colors.textOnGlassMuted }]}>Workers</Text>
                  <Text style={[typography.h3, { color: colors.secondary }]}>{optimizationData.progress.workers_started}</Text>
                </View>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Assignments')}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.actionGradient}
                  />
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                    <Text style={styles.actionIconText}>+</Text>
                  </View>
                  <Text style={styles.actionLabel}>New Offers</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>
                      2
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Status')}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.actionGradient}
                  />
                  <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.actionIconText}>i</Text>
                  </View>
                  <Text style={styles.actionLabel}>My Status</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
              <Card variant="outlined" style={styles.scheduleCard}>
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleDate}>
                    <Text style={styles.scheduleDayNum}>25</Text>
                    <Text style={styles.scheduleDayName}>SAT</Text>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleRoute}>DFW - ORD - DFW</Text>
                    <Text style={styles.scheduleTime}>06:00 - 18:30</Text>
                  </View>
                </View>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleDate}>
                    <Text style={styles.scheduleDayNum}>26</Text>
                    <Text style={styles.scheduleDayName}>SUN</Text>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleRoute}>DFW - MIA</Text>
                    <Text style={styles.scheduleTime}>09:00 - 14:00</Text>
                  </View>
                </View>
              </Card>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 244, 252, 0.85)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl + 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.body,
    color: colors.textOnDarkGlassMuted,
  },
  name: {
    ...typography.h2,
    color: colors.textOnDarkGlass,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.small,
    color: colors.textOnDarkGlassMuted,
  },
  metaDot: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  dutyCard: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textOnGlass,
    marginBottom: spacing.md,
  },
  quickActions: {
    marginBottom: spacing.lg,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.xl + 4,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgba(0, 120, 210, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  actionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconText: {
    ...typography.h2,
    color: colors.textInverse,
  },
  actionLabel: {
    ...typography.smallBold,
    color: colors.textOnGlass,
  },
  actionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  scheduleCard: {
    padding: 0,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  scheduleDate: {
    width: 54,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  scheduleDayNum: {
    ...typography.h2,
    color: colors.primary,
  },
  scheduleDayName: {
    ...typography.captionBold,
    color: colors.textOnGlassMuted,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleRoute: {
    ...typography.bodyBold,
    color: colors.textOnGlass,
  },
  scheduleTime: {
    ...typography.small,
    color: colors.textOnGlassMuted,
    marginTop: spacing.xs,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 120, 210, 0.15)',
    marginHorizontal: spacing.md,
  },
  notificationContainer: {
    position: 'absolute',
    top: 60, // Adjust based on header/safe area
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  notificationCard: {
    padding: 0,
    // Use standard glass styling (inherited from GlassCard props but ensured here)
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: spacing.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.h4,
    color: colors.primary, // Blue instead of red
    marginBottom: 2,
  },
  notificationBody: {
    ...typography.small,
    color: colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 120, 210, 0.1)',
  },
  notificationDismiss: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 120, 210, 0.1)',
  },
  notificationDismissText: {
    ...typography.smallBold,
    color: colors.textSecondary,
  },
  notificationButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 120, 210, 0.1)', // Subtle blue tint
  },
  notificationButtonText: {
    ...typography.smallBold,
    color: colors.primary,
  },
});

export default DashboardScreen;
