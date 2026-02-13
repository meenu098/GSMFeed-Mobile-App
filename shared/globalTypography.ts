import { Text, TextInput } from "react-native";
import { APP_FONT_FAMILY } from "./designSystem";

let hasAppliedGlobalTypography = false;

const mergeStyle = (existing: any, next: any) => {
  if (!existing) return next;
  return [next, existing];
};

type TypographyComponent = {
  defaultProps?: {
    style?: any;
  };
};

export const applyGlobalTypography = () => {
  if (hasAppliedGlobalTypography) return;
  hasAppliedGlobalTypography = true;

  const textComponent = Text as unknown as TypographyComponent;
  const textInputComponent = TextInput as unknown as TypographyComponent;

  textComponent.defaultProps = textComponent.defaultProps || {};
  textComponent.defaultProps.style = mergeStyle(textComponent.defaultProps.style, {
    fontFamily: APP_FONT_FAMILY.regular,
    includeFontPadding: false,
  });

  textInputComponent.defaultProps = textInputComponent.defaultProps || {};
  textInputComponent.defaultProps.style = mergeStyle(
    textInputComponent.defaultProps.style,
    {
    fontFamily: APP_FONT_FAMILY.regular,
    includeFontPadding: false,
    },
  );
};
