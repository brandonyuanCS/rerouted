import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Card, DutyTimeBar, AssignmentCard, Assignment, GlassCard } from '../components';
import { TabParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type DashboardScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Dashboard'>;
};

// Mock data for current assignment
const mockCurrentAssignment: Assignment = {
  id: '1',
  flightNumber: 'AA 2847',
  origin: 'DFW',
  destination: 'LAX',
  departureTime: '14:30',
  gate: 'A24',
  role: 'flight_attendant',
  status: 'active',
  aircraftType: 'Boeing 737-800',
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const crewMember = {
    name: 'Sarah Johnson',
    id: 'AA-28471',
    role: 'Senior Flight Attendant',
    base: 'DFW',
    dutyHoursRemaining: 8.5,
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
        {/* Glass Header */}
        <GlassCard variant="dark" style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{crewMember.name}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{crewMember.base}</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaText}>ID: {crewMember.id}</Text>
            <Text style={styles.metaDot}>|</Text>
            <Text style={styles.metaText}>{crewMember.role}</Text>
          </View>
        </GlassCard>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          
          <Card variant="elevated" style={styles.dutyCard}>
            <DutyTimeBar hoursRemaining={crewMember.dutyHoursRemaining} />
          </Card>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            <AssignmentCard assignment={mockCurrentAssignment} />
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
                  <Text style={styles.actionBadgeText}>2</Text>
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
});

export default DashboardScreen;
