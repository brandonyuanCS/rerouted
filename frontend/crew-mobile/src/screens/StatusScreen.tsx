import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Card, DutyTimeBar, AssignmentCard, Assignment } from '../components';

// Mock current assignment
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

const StatusScreen: React.FC = () => {
  const crewStatus = {
    status: 'On Duty',
    location: 'DFW - Terminal A',
    dutyStartTime: '06:00',
    dutyHoursRemaining: 8.5,
    restRequired: false,
    nextRest: '22:00',
    hotelBooking: null,
  };

  const certifications = [
    { type: 'Boeing 737', expiry: '2026-08-15', valid: true },
    { type: 'Boeing 777', expiry: '2026-06-01', valid: true },
    { type: 'Airbus A320', expiry: '2026-03-20', valid: true },
    { type: 'First Aid', expiry: '2025-12-01', valid: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Status</Text>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{crewStatus.status}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        
        <Card variant="elevated" style={styles.dutyCard}>
          <DutyTimeBar hoursRemaining={crewStatus.dutyHoursRemaining} />
          <View style={styles.dutyInfo}>
            <View style={styles.dutyInfoItem}>
              <Text style={styles.dutyLabel}>Duty Started</Text>
              <Text style={styles.dutyValue}>{crewStatus.dutyStartTime}</Text>
            </View>
            <View style={styles.dutyDivider} />
            <View style={styles.dutyInfoItem}>
              <Text style={styles.dutyLabel}>Required Rest By</Text>
              <Text style={styles.dutyValue}>{crewStatus.nextRest}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <Card variant="outlined" style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>*</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{crewStatus.location}</Text>
              <Text style={styles.locationMeta}>Last updated: Just now</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Assignment</Text>
          <AssignmentCard assignment={mockCurrentAssignment} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Card variant="outlined" style={styles.certCard}>
            {certifications.map((cert, index) => (
              <View key={cert.type}>
                <View style={styles.certItem}>
                  <View style={styles.certInfo}>
                    <Text style={styles.certType}>{cert.type}</Text>
                    <Text style={styles.certExpiry}>
                      Expires: {cert.expiry}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.certBadge,
                      { backgroundColor: cert.valid ? colors.success : colors.error },
                    ]}>
                    <Text style={styles.certBadgeText}>
                      {cert.valid ? 'VALID' : 'EXPIRED'}
                    </Text>
                  </View>
                </View>
                {index < certifications.length - 1 && (
                  <View style={styles.certDivider} />
                )}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card variant="outlined" style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Crew Scheduling</Text>
              <Text style={styles.contactValue}>1-800-AA-CREW</Text>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Operations Center</Text>
              <Text style={styles.contactValue}>1-800-AA-OPS</Text>
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
  headerTitle: {
    ...typography.h1,
    color: colors.textInverse,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
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
  dutyInfo: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  dutyInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  dutyLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  dutyValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  dutyDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  locationIconText: {
    ...typography.h2,
    color: colors.primary,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  locationMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  certCard: {
    padding: spacing.md,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certInfo: {
    flex: 1,
  },
  certType: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  certExpiry: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  certBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  certBadgeText: {
    ...typography.captionBold,
    color: colors.textInverse,
  },
  certDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  contactCard: {
    padding: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  contactValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  contactDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
});

export default StatusScreen;
