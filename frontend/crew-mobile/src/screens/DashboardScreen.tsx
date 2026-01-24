import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Card, DutyTimeBar, AssignmentCard, Assignment } from '../components';
import { TabParamList } from '../navigation/AppNavigator';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
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
      </View>

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
              onPress={() => navigation.navigate('Assignments')}>
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
              onPress={() => navigation.navigate('Status')}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
  },
  name: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
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
    color: colors.textInverse,
    opacity: 0.7,
  },
  metaDot: {
    ...typography.small,
    color: colors.textInverse,
    opacity: 0.4,
    marginHorizontal: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dutyCard: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionIconText: {
    ...typography.h2,
    color: colors.textInverse,
  },
  actionLabel: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  actionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  scheduleCard: {
    padding: spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDate: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  scheduleDayNum: {
    ...typography.h2,
    color: colors.primary,
  },
  scheduleDayName: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleRoute: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  scheduleTime: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
});

export default DashboardScreen;
