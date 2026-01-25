import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Card } from './Card';
import { Button } from './Button';

export interface Assignment {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  gate: string;
  role: 'pilot' | 'flight_attendant';
  status: 'offered' | 'accepted' | 'declined' | 'active' | 'completed';
  expiresAt?: string;
  aircraftType?: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onAccept,
  onDecline,
  showActions = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!assignment.expiresAt) return;

    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expires = new Date(assignment.expiresAt!).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(remaining);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [assignment.expiresAt]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'offered':
        return colors.warning;
      case 'accepted':
      case 'active':
        return colors.success;
      case 'declined':
        return colors.error;
      case 'completed':
        return colors.textMuted;
      default:
        return colors.textSecondary;
    }
  };

  const getRoleLabel = () => {
    return assignment.role === 'pilot' ? 'Pilot' : 'Flight Attendant';
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flightInfo}>
          <Text style={styles.flightNumber}>{assignment.flightNumber}</Text>
          <Text style={styles.aircraftType}>{assignment.aircraftType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>
            {assignment.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.airport}>
          <Text style={styles.airportCode}>{assignment.origin}</Text>
          <Text style={styles.airportLabel}>Origin</Text>
        </View>
        <View style={styles.routeLine}>
          <View style={styles.line} />
          <View style={styles.plane}>
            <Text style={styles.planeIcon}>{'-->'}</Text>
          </View>
          <View style={styles.line} />
        </View>
        <View style={styles.airport}>
          <Text style={styles.airportCode}>{assignment.destination}</Text>
          <Text style={styles.airportLabel}>Destination</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Departure</Text>
          <Text style={styles.detailValue}>{assignment.departureTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Gate</Text>
          <Text style={styles.detailValue}>{assignment.gate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailValue}>{getRoleLabel()}</Text>
        </View>
      </View>

      {showActions && assignment.status === 'offered' && (
        <View style={styles.actions}>
          {timeRemaining > 0 && (
            <View style={styles.countdown}>
              <Text style={styles.countdownLabel}>Accept within</Text>
              <Text style={styles.countdownTime}>
                {formatCountdown(timeRemaining)}
              </Text>
            </View>
          )}
          <View style={styles.buttons}>
            <Button
              title="Decline"
              variant="outline"
              size="sm"
              onPress={onDecline || (() => {})}
              style={styles.declineButton}
            />
            <Button
              title="Accept"
              variant="primary"
              size="sm"
              onPress={onAccept || (() => {})}
              style={styles.acceptButton}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginTop: spacing.md, // Add top margin for separation between cards
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    ...typography.h2,
    color: colors.textOnGlass,
  },
  aircraftType: {
    ...typography.small,
    color: colors.textOnGlassMuted,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    ...typography.captionBold,
    color: colors.textInverse,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 120, 210, 0.15)',
    marginBottom: spacing.md,
  },
  airport: {
    alignItems: 'center',
    flex: 1,
  },
  airportCode: {
    ...typography.h1,
    color: colors.primary,
  },
  airportLabel: {
    ...typography.caption,
    color: colors.textOnGlassMuted,
    marginTop: spacing.xs,
  },
  routeLine: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0, 120, 210, 0.25)',
    borderRadius: 1,
  },
  plane: {
    paddingHorizontal: spacing.sm,
  },
  planeIcon: {
    ...typography.body,
    color: colors.primary,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textOnGlassMuted,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.bodyBold,
    color: colors.textOnGlass,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 120, 210, 0.15)',
  },
  countdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(195, 0, 25, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(195, 0, 25, 0.3)',
  },
  countdownLabel: {
    ...typography.small,
    color: colors.textOnGlass,
    marginRight: spacing.sm,
  },
  countdownTime: {
    ...typography.h3,
    color: colors.accent,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 2,
  },
});

export default AssignmentCard;
