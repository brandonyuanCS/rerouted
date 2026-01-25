import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { AssignmentCard, Assignment, GlassCard } from '../components';
import { useAssignment } from '../context/AssignmentContext';

import { optimizationData } from '../data/optimizationData';

const AssignmentScreen: React.FC = () => {
  const { acceptAssignment } = useAssignment();
  const [refreshing, setRefreshing] = useState(false);

  // Hardcoded user for demo
  const currentUser = { id: 'PLT001' };

  // New Mock Offers for "Urgent" update
  const initialOffers: Assignment[] = [
    {
      id: 'offer-1',
      flightNumber: 'AA 1198',
      origin: 'DFW',
      destination: 'ORD',
      departureTime: '14:30',
      gate: 'C22',
      role: 'pilot',
      status: 'offered',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 mins from now
      aircraftType: 'Boeing 737-800'
    },
    {
      id: 'offer-2',
      flightNumber: 'AA 1234',
      origin: 'ORD',
      destination: 'LGA',
      departureTime: '19:45',
      gate: 'K12',
      role: 'pilot',
      status: 'offered',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 mins from now
      aircraftType: 'Airbus A321'
    }
  ];

  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>(initialOffers);

  // Countdown Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingAssignments(prevOffers =>
        prevOffers.map(offer => {
          // Small hack to force re-render if we were displaying relative time, 
          // but effectively we might just want to update the expiresAt or let the card handle relative time?
          // If the card calculates "time remaining" based on `expiresAt` - `now`, simply re-rendering parent works?
          // Or we can just leave it static if the Card doesn't support live tick.
          // Assuming Card might not update live without props change. 
          // Let's just update the state to trigger re-renders. 
          return { ...offer };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter for ANY other assignments the user might have that are NOT the active one?
  // For now, let's just use the `assignments` map. If they are assigned, it's "Accepted" or "Active".
  // The Dashboard shows "Active". This screen shows "Accepted" (future) or "Past".
  // The JSON snapshot is a single point in time. 
  // We will assume NO past assignments in this JSON.
  const [pastAssignments] = useState<Assignment[]>([]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleAccept = (assignmentId: string) => {
    Alert.alert(
      'Accept Assignment',
      'Are you sure you want to accept this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            const assignmentToAccept = pendingAssignments.find(a => a.id === assignmentId);
            if (assignmentToAccept) {
              acceptAssignment(assignmentToAccept);
              setPendingAssignments((prev) =>
                prev.filter(a => a.id !== assignmentId) // Remove from offers
              );
              Alert.alert('Success', 'Assignment accepted successfully! Dashboard updated.');
            }
          },
        },
      ]
    );
  };

  const handleDecline = (assignmentId: string) => {
    Alert.alert(
      'Decline Assignment',
      'Are you sure you want to decline this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setPendingAssignments((prev) =>
              prev.filter((a) => a.id !== assignmentId)
            );
          },
        },
      ]
    );
  };

  const offeredAssignments = pendingAssignments.filter(a => a.status === 'offered');
  const acceptedAssignments = pendingAssignments.filter(a => a.status === 'accepted');

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
            <Text style={styles.headerTitle}>Assignments</Text>
            <Text style={styles.headerSubtitle}>
              {offeredAssignments.length} pending offer{offeredAssignments.length !== 1 ? 's' : ''}
            </Text>
          </GlassCard>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }>

            {offeredAssignments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending Offers</Text>
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                </View>
                <Text style={styles.sectionHint}>
                  First to accept gets the assignment
                </Text>
                {offeredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    showActions
                    onAccept={() => handleAccept(assignment.id)}
                    onDecline={() => handleDecline(assignment.id)}
                  />
                ))}
              </View>
            )}

            {acceptedAssignments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Accepted</Text>
                {acceptedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </View>
            )}

            {offeredAssignments.length === 0 && acceptedAssignments.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.emptyIconGradient}
                  />
                  <Text style={styles.emptyIconText}>✓</Text>
                </View>
                <Text style={styles.emptyTitle}>No Pending Offers</Text>
                <Text style={styles.emptySubtitle}>
                  New assignment offers will appear here
                </Text>
              </View>
            )}

            {pastAssignments.length > 0 && (
              <View style={[styles.section, { marginBottom: 0 }]}>
                <Text style={styles.sectionTitle}>Past Assignments</Text>
                {pastAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </View>
            )}
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
  headerTitle: {
    ...typography.h1,
    color: colors.textOnDarkGlass,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textOnDarkGlassMuted,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 160, // Increased for more visible bottom space
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textOnGlass,
  },
  sectionHint: {
    ...typography.small,
    color: colors.textOnGlassMuted,
    marginBottom: spacing.md,
  },
  urgentBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentText: {
    ...typography.captionBold,
    color: colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyIconText: {
    fontSize: 32,
    color: colors.textOnGlassMuted,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textOnGlass,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textOnGlassMuted,
    textAlign: 'center',
  },
});

export default AssignmentScreen;
