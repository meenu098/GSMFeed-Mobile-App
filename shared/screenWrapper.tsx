import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StatusBar, ViewStyle } from "react-native";
import { useTheme } from "./themeContext";

interface ScreenWrapperProps {
  children: React.ReactNode;
  bg?: string;
  style?: ViewStyle | ViewStyle[];
  withPadding?: boolean;
  animate?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  bg,
  style,
  withPadding = false,
  animate = true,
}) => {
  const { isDark, colors, motion } = useTheme();
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 8 : 0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, motion.normal, opacity, translateY]);

  const wrapperStyle = useMemo(
    () => [
      {
        flex: 1,
        backgroundColor: bg ?? colors.background,
        paddingHorizontal: withPadding ? 16 : 0,
      },
      style,
    ],
    [bg, colors.background, style, withPadding],
  );

  return (
    <Animated.View
      style={[
        wrapperStyle,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </Animated.View>
  );
};

export default ScreenWrapper;
