import React from 'react';
import { Animated, Image, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { useVisualEffects } from '../theme/visual-effects';

const logo = require('../../assets/logoHR.png');
const ledInputRange = [0, 0.32, 0.62, 0.82, 1];
const ledColors = [colors.blue, colors.purple, colors.pink, colors.amber, colors.blue];

function useLedProgress(duration = 4200) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [duration, progress]);

  return progress;
}

export function LedText({ children, selectable = false, style }) {
  const { ledEnabled } = useVisualEffects();
  const progress = useLedProgress();
  const color = progress.interpolate({ inputRange: ledInputRange, outputRange: ledColors });
  const glow = progress.interpolate({
    inputRange: ledInputRange,
    outputRange: ['rgba(59,130,246,0.45)', 'rgba(139,92,246,0.45)', 'rgba(236,72,153,0.42)', 'rgba(245,158,11,0.34)', 'rgba(59,130,246,0.45)'],
  });

  if (!ledEnabled) {
    return (
      <Text selectable={selectable} style={[{ color: colors.blue }, style]}>
        {children}
      </Text>
    );
  }

  return (
    <Animated.Text
      selectable={selectable}
      style={[
        style,
        {
          color,
          textShadowColor: glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        },
      ]}>
      {children}
    </Animated.Text>
  );
}

export function AppLogo({ theme, compact = false }) {
  return (
    <View style={[styles.logoRow, compact && { gap: 8 }]}>
      <Image source={logo} style={[styles.logoImage, compact && { width: 44, height: 44 }]} resizeMode="contain" />
      <View>
        <View style={styles.brandLine}>
          <Text selectable style={[styles.brandHealthy, { color: theme.logoText }, compact && { fontSize: 21 }]}>Healthy</Text>
          <LedText selectable style={[styles.brandReminder, compact && { fontSize: 21 }]}>Reminder</LedText>
        </View>
        <Text selectable style={[styles.brandSub, { color: theme.soft }, compact && { fontSize: 9 }]}>SISTEMA DENTAL</Text>
      </View>
    </View>
  );
}

export function SoftOrb({ style, color }) {
  return <View pointerEvents="none" style={[styles.orb, { backgroundColor: color }, style]} />;
}

export function IconBadge({ icon, color, size = 44 }) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, backgroundColor: `${color}18` }]}>
      <Text style={[styles.iconText, { color }]}>{icon}</Text>
    </View>
  );
}

function ButtonArrowIcon() {
  return (
    <View style={styles.buttonArrowIcon}>
      <View style={styles.buttonArrowLine} />
      <View style={styles.buttonArrowHead} />
    </View>
  );
}

export function GradientButton({ label, onPress, right = 'arrow', disabled = false, style }) {
  const { ledEnabled } = useVisualEffects();
  const progress = useLedProgress(3600);
  const backgroundColor = progress.interpolate({ inputRange: ledInputRange, outputRange: ledColors });
  const shimmerX = progress.interpolate({ inputRange: [0, 1], outputRange: [-170, 190] });
  const glowScale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.22, 0.9] });
  const glowOpacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.22, 0.1] });

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [
      styles.gradientButton,
      style,
      pressed && { transform: [{ scale: 0.98 }] },
      disabled && { opacity: 0.55 },
    ]}>
      {ledEnabled ? (
        <>
          <Animated.View style={[styles.ledButtonFill, { backgroundColor }]} />
          <Animated.View style={[styles.gradientGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
          <Animated.View style={[styles.ledButtonShimmer, { transform: [{ translateX: shimmerX }, { rotate: '14deg' }] }]} />
        </>
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        style={styles.gradientLabel}
      >
        {label}
      </Text>
      {right ? (
        <View style={styles.gradientArrowBubble}>
          {right === 'arrow' ? <ButtonArrowIcon /> : <Text style={styles.gradientArrow}>{right}</Text>}
        </View>
      ) : null}
    </Pressable>
  );
}

export function HeaderButton({ label, onPress, theme, active }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        { backgroundColor: active ? theme.chip : theme.input, borderColor: theme.line },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.headerButtonText, { color: active ? colors.blue : theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

export function Input({ label, theme, icon, rightLabel, onRightPress, inputStyle, shellStyle, multiline, error, maxLength, keyboardType, onChangeText, sanitize, ...props }) {
  const effectiveMaxLength = maxLength || (multiline ? 2000 : 255);
  const handleChangeText = React.useCallback((rawValue) => {
    let value = String(rawValue ?? '');
    if (sanitize === 'digits' || keyboardType === 'number-pad' || keyboardType === 'numeric') value = value.replace(/\D/g, '');
    if (sanitize === 'decimal' || keyboardType === 'decimal-pad') {
      value = value.replace(',', '.').replace(/[^0-9.]/g, '');
      const [whole = '', ...parts] = value.split('.');
      value = parts.length ? `${whole}.${parts.join('').slice(0, 2)}` : whole;
    }
    if (sanitize === 'letters') value = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '');
    if (sanitize === 'phone' || keyboardType === 'phone-pad') value = value.replace(/[^0-9+() -]/g, '');
    onChangeText?.(value.slice(0, effectiveMaxLength));
  }, [effectiveMaxLength, keyboardType, onChangeText, sanitize]);
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputShell, multiline && styles.inputShellMultiline, { backgroundColor: theme.input, borderColor: error ? colors.red : theme.line }, shellStyle]}>
        <Text style={[styles.inputIcon, multiline && styles.inputIconMultiline, { color: theme.muted }]}>{icon}</Text>
        <TextInput
          placeholderTextColor={theme.soft}
          style={[styles.input, multiline && styles.inputMultiline, { color: theme.text }, inputStyle]}
          autoCapitalize="none"
          multiline={multiline}
          maxLength={effectiveMaxLength}
          keyboardType={keyboardType}
          onChangeText={handleChangeText}
          returnKeyType={multiline ? 'default' : 'next'}
          blurOnSubmit={!multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {rightLabel ? (
          <Pressable onPress={onRightPress} hitSlop={10}>
            <Text style={[styles.inputAction, { color: colors.blue }]}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text selectable style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onPress, theme }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <LedText style={styles.sectionAction}>{action}</LedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AppointmentCard({ item, theme, detailed = false }) {
  const detailLine = [
    item.room || 'Consultorio 1',
    item.type,
    item.end_time ? `${item.time}-${item.end_time}` : '',
  ].filter(Boolean).join(' - ');

  return (
    <View style={[styles.appointmentCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={[styles.timeBlock, { backgroundColor: `${item.color}16` }]}>
        <Text selectable style={[styles.timeText, { color: item.color }]}>{item.time}</Text>
      </View>
      <View style={[styles.timeline, { backgroundColor: item.color }]} />
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{item.patient}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{item.service}</Text>
        {detailed ? <Text selectable style={[styles.cardSub, { color: theme.soft }]}>{detailLine}</Text> : null}
      </View>
      <Text style={[styles.smallChip, { color: item.color, backgroundColor: `${item.color}14` }]}>{item.status}</Text>
    </View>
  );
}

export function SettingRow({ theme, title, subtitle, value, onValueChange }) {
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={{ flex: 1 }}>
        <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.line, true: `${colors.blue}80` }} thumbColor={value ? colors.blue : '#f8fafc'} />
    </View>
  );
}
