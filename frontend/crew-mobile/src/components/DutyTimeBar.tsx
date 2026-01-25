import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Duty Time Remaining</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
      <View style={styles.barContainer}>
        <LinearGradient
          colors={['rgba(0, 120, 210, 0.08)', 'rgba(0, 120, 210, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.barBackground}
        />
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: statusColor,
            },
          ]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.barShine}
          />
        </View>
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
    color: colors.textOnGlass,
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
  barContainer: {
    height: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0, 120, 210, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 120, 210, 0.15)',
  },
  barBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    position: 'relative',
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.h3,
    color: colors.textOnGlass,
  },
  maxText: {
    ...typography.small,
    color: colors.textOnGlassMuted,
    alignSelf: 'flex-end',
  },
});

export default DutyTimeBar;
