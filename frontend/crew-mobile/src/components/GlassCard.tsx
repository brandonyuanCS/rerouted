import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/typography';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'dark' | 'navigation';
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          container: styles.darkContainer,
          gradient: ['rgba(0, 60, 120, 0.8)', 'rgba(0, 40, 100, 0.7)'] as const,
        };
      case 'navigation':
        return {
          container: styles.navContainer,
          gradient: ['rgba(0, 60, 120, 0.85)', 'rgba(0, 50, 110, 0.8)'] as const,
        };
      default:
        return {
          container: styles.container,
          gradient: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.wrapper, variantStyles.container, style]}>
      {/* Top highlight line */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.8)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topHighlight}
      />
      
      {/* Inner gradient overlay for glass depth */}
      <LinearGradient
        colors={variantStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />
      
      {/* Content */}
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.xl + 8, // 24px for that liquid feel
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    // iOS shadow for depth
    shadowColor: 'rgba(0, 120, 210, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    // Android elevation
    elevation: 8,
  },
  darkContainer: {
    backgroundColor: colors.glassNavBackground,
    borderWidth: 2,
    borderColor: colors.glassNavBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  navContainer: {
    backgroundColor: colors.glassNavBackground,
    borderWidth: 1.5,
    borderColor: colors.glassNavBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    zIndex: 2,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl + 8,
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: 20,
  },
  noPadding: {
    padding: 0,
  },
});

export default GlassCard;
