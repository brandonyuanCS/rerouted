import React, { useState } from 'react';
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

// Mock pending assignments
const mockPendingAssignments: Assignment[] = [
  {
    id: '2',
    flightNumber: 'AA 1156',
    origin: 'DFW',
    destination: 'JFK',
    departureTime: '16:45',
    gate: 'C12',
    role: 'flight_attendant',
    status: 'offered',
    expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
    aircraftType: 'Airbus A321',
  },
  {
    id: '3',
    flightNumber: 'AA 892',
    origin: 'DFW',
    destination: 'SFO',
    departureTime: '18:00',
    gate: 'B8',
    role: 'flight_attendant',
    status: 'offered',
    expiresAt: new Date(Date.now() + 2.5 * 60 * 1000).toISOString(),
    aircraftType: 'Boeing 777-200',
  },
];

const mockPastAssignments: Assignment[] = [
  {
    id: '4',
    flightNumber: 'AA 445',
    origin: 'LAX',
    destination: 'DFW',
    departureTime: '08:00',
    gate: 'A15',
    role: 'flight_attendant',
    status: 'completed',
    aircraftType: 'Boeing 737-800',
  },
  {
    id: '5',
    flightNumber: 'AA 2201',
    origin: 'ORD',
    destination: 'DFW',
    departureTime: '11:30',
    gate: 'D22',
    role: 'flight_attendant',
    status: 'declined',
    aircraftType: 'Airbus A320',
  },
];

const AssignmentScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>(mockPendingAssignments);
  const [pastAssignments] = useState<Assignment[]>(mockPastAssignments);

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
            setPendingAssignments((prev) =>
              prev.map((a) =>
                a.id === assignmentId ? { ...a, status: 'accepted' as const } : a
              )
            );
            Alert.alert('Success', 'Assignment accepted successfully!');
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
