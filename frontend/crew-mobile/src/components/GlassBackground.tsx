import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface GlassBackgroundProps {
  children: React.ReactNode;
}

export const GlassBackground: React.FC<GlassBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Gradient background matching manager-dashboard */}
      <LinearGradient
        colors={[
          colors.gradientStart,
          colors.gradientMiddle,
          colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      
      {/* Decorative orbs for visual interest */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.3,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(0, 120, 210, 0.3)',
    top: -width * 0.3,
    right: -width * 0.3,
  },
  orb2: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: 'rgba(0, 100, 180, 0.25)',
    bottom: height * 0.2,
    left: -width * 0.2,
  },
  orb3: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: 'rgba(0, 80, 160, 0.2)',
    bottom: -width * 0.1,
    right: width * 0.1,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default GlassBackground;
