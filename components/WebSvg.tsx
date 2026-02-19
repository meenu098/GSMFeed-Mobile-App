import React from "react";
import { DimensionValue, Image, ImageStyle, Platform, StyleProp } from "react-native";
import { SvgUri } from "react-native-svg";

type WebSvgProps = {
  uri: string;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ImageStyle>;
};

const normalizeSize = (value?: number | string): DimensionValue | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?%$/.test(trimmed)) {
    return trimmed as DimensionValue;
  }
  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? undefined : numeric;
};

const WebSvg = ({ uri, width, height, style }: WebSvgProps) => {
  if (Platform.OS === "web") {
    const resolvedStyle: StyleProp<ImageStyle> = [
      style,
      width !== undefined || height !== undefined
        ? { width: normalizeSize(width), height: normalizeSize(height) }
        : null,
    ];
    return <Image source={{ uri }} style={resolvedStyle} resizeMode="contain" />;
  }

  return (
    <SvgUri
      uri={uri}
      width={width}
      height={height}
      style={style as any}
    />
  );
};

export default WebSvg;
