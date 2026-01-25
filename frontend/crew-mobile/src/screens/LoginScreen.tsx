import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { Button, GlassCard } from '../components';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!employeeId || !password) {
      setError('Please enter your credentials');
      return;
    }

    setLoading(true);
    setError('');

    // Mock login - replace with actual API call
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1500);
  };

  return (
    <ImageBackground
      source={require('../../assets/csbg.png')}
      style={styles.container}
      resizeMode="cover">
      <View style={styles.overlay} />
      <StatusBar style="dark" />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>CrewSync</Text>
            <Text style={styles.subtitle}>Crew Coordination System</Text>
          </View>

          <GlassCard style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Employee ID</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your employee ID"
                  placeholderTextColor="rgba(71, 85, 105, 0.6)"
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(71, 85, 105, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginButton}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </GlassCard>

          <View style={styles.footer}>
            <View style={styles.divider}>
              <LinearGradient
                colors={['transparent', 'rgba(0, 120, 210, 0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
              <Text style={styles.dividerText}>American Airlines</Text>
              <LinearGradient
                colors={['transparent', 'rgba(0, 120, 210, 0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
            </View>
            <Text style={styles.footerText}>
              Internal crew management system
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(232, 244, 252, 0.3)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    marginVertical: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 120, 210, 0.2)',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(195, 0, 25, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    ...typography.small,
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.captionBold,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default LoginScreen;
