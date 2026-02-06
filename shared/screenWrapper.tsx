import React from "react";
import { StatusBar, View, ViewStyle } from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  bg?: string;
  style?: ViewStyle | ViewStyle[];
  withPadding?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  bg = "#000",
  style,
  withPadding = false,
}) => {
  return (
    <View style={[{ flex: 1, backgroundColor: bg }, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {children}
    </View>
  );
};

export default ScreenWrapper;
