import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';

interface DutyTimeBarProps {
  hoursRemaining: number;
  maxHours?: number;
}

export const DutyTimeBar: React.FC<DutyTimeBarProps> = ({
  hoursRemaining,
  maxHours = 14,
}) => {
  const percentage = Math.min((hoursRemaining / maxHours) * 100, 100);

  const getStatusColor = () => {
    if (hoursRemaining <= 2) return colors.dutyRed;
    if (hoursRemaining <= 4) return colors.dutyYellow;
    return colors.dutyGreen;
  };

  const getStatusText = () => {
    if (hoursRemaining <= 2) return 'CRITICAL';
    if (hoursRemaining <= 4) return 'WARNING';
    return 'OK';
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Duty Time Remaining</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.timeText}>{formatTime(hoursRemaining)}</Text>
        <Text style={styles.maxText}>of {maxHours}h max</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.smallBold,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.captionBold,
    color: colors.textInverse,
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  maxText: {
    ...typography.small,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
});

export default DutyTimeBar;
