import { StyleSheet, Text, type TextProps } from "react-native";

import { Typography } from "@/constants/Typography";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "titleLarge"
    | "titleXLarge"
    | "subtitle"
    | "subtitleMedium"
    | "subtitleSemibold"
    | "body"
    | "bodyMedium"
    | "bodySemibold"
    | "caption"
    | "captionMedium"
    | "button"
    | "buttonLarge"
    | "buttonXLarge"
    | "timer"
    | "verse"
    | "quote"
    | "quoteText"
    | "badge"
    | "small"
    | "tab"
    | "statValue"
    | "statLabel"
    | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "titleLarge" ? styles.titleLarge : undefined,
        type === "titleXLarge" ? styles.titleXLarge : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "subtitleMedium" ? styles.subtitleMedium : undefined,
        type === "subtitleSemibold" ? styles.subtitleSemibold : undefined,
        type === "body" ? styles.body : undefined,
        type === "bodyMedium" ? styles.bodyMedium : undefined,
        type === "bodySemibold" ? styles.bodySemibold : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "captionMedium" ? styles.captionMedium : undefined,
        type === "button" ? styles.button : undefined,
        type === "buttonLarge" ? styles.buttonLarge : undefined,
        type === "buttonXLarge" ? styles.buttonXLarge : undefined,
        type === "timer" ? styles.timer : undefined,
        type === "verse" ? styles.verse : undefined,
        type === "quote" ? styles.quote : undefined,
        type === "quoteText" ? styles.quoteText : undefined,
        type === "badge" ? styles.badge : undefined,
        type === "small" ? styles.small : undefined,
        type === "tab" ? styles.tab : undefined,
        type === "statValue" ? styles.statValue : undefined,
        type === "statLabel" ? styles.statLabel : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Typography.styles.body,
  title: Typography.styles.title,
  titleLarge: Typography.styles.titleLarge,
  titleXLarge: Typography.styles.titleXLarge,
  subtitle: Typography.styles.subtitle,
  subtitleMedium: Typography.styles.subtitleMedium,
  subtitleSemibold: Typography.styles.subtitleSemibold,
  body: Typography.styles.body,
  bodyMedium: Typography.styles.bodyMedium,
  bodySemibold: Typography.styles.bodySemibold,
  caption: Typography.styles.caption,
  captionMedium: Typography.styles.captionMedium,
  button: Typography.styles.button,
  buttonLarge: Typography.styles.buttonLarge,
  buttonXLarge: Typography.styles.buttonXLarge,
  timer: Typography.styles.timer,
  verse: Typography.styles.verse,
  quote: Typography.styles.quote,
  quoteText: Typography.styles.quoteText,
  badge: Typography.styles.badge,
  small: Typography.styles.small,
  tab: Typography.styles.tab,
  statValue: Typography.styles.statValue,
  statLabel: Typography.styles.statLabel,
  link: {
    ...Typography.styles.body,
    lineHeight: Typography.lineHeight.normal,
    color: "#0a7ea4",
  },
});
