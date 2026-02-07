// Cross-platform IconSymbol
// iOS → SF Symbols via expo-symbols
// Android/Web → MaterialCommunityIcons fallback

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SymbolView, type SymbolWeight } from "expo-symbols";
import {
  OpaqueColorValue,
  Platform,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

// 1. Allow ANY icon name, but keep autocomplete for mapped symbols
export type IconSymbolName = keyof typeof MAPPING | (string & {});

// 2. Mapping from SF Symbols → MaterialCommunityIcons
const MAPPING = {
  "house.fill": "home",
  paperplane: "send",
  "paperplane.fill": "send",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.left.forwardslash.chevron.right": "code-tags",
  "message.fill": "message",
  message: "message-outline",
  "message.badge": "message-alert",
  "person.3.fill": "account-group",
  "person.2": "account-multiple",
  "checkmark.circle.fill": "check-circle",
  checkmark: "check",
  "xmark.circle.fill": "close-circle",
  xmark: "close",
  "flame.fill": "fire",
  "megaphone.fill": "bullhorn",
  megaphone: "bullhorn-outline",
  "trophy.fill": "trophy",
  calendar: "calendar",
  "chart.bar.fill": "chart-bar",
  "eye.slash": "eye-off",
  "questionmark.circle": "help-circle",
  "arrow.up": "arrow-up",
  "arrow.right.square": "arrow-right-box",
  heart: "heart-outline",
  trash: "trash-can",
  bell: "bell",
  "lock.shield": "shield-lock",
  "info.circle": "information",
  paintbrush: "brush",
  exclamationmark: "alert",
  "heart.fill": "heart",
  plus: "plus",
  book: "book-outline",
  star: "star-outline",
  "star.fill": "star",
  "ellipsis.circle": "dots-horizontal-circle",
  "arrow.right": "arrow-right",
  "hand.raised.slash": "hand-back-right-off",
  "arrowshape.turn.up.left": "reply",
  "list.bullet": "format-list-bulleted",
  "arrow.up.left.and.arrow.down.right": "arrow-expand",
  "play.fill": "play",
  "arrow.left": "arrow-left",
  "bubble.left.and.bubble.right.fill": "message-processing",
  "bubble.left.and.bubble.right": "message-processing",
  clock: "clock-outline",
  "exclamationmark.triangle": "alert",
  flag: "flag-outline",
  "chevron.down": "chevron-down",
  "square.and.pencil": "pencil-box-outline",
  gear: "cog-outline",
  gearshape: "cog-outline",
  "gearshape.fill": "cog",
  "bell.badge": "bell-badge-outline",
  "bell.badge.fill": "bell-badge",
  "bell.fill": "bell",
  "bell.slash": "bell-off-outline",
  "bell.slash.fill": "bell-off",
  "building.2": "office-building",
  "chevron.forward": "chevron-right",
  "checkmark.circle": "check-circle-outline",
  "person.2.fill": "account-multiple",
  "clock.fill": "clock",
  "exclamationmark.triangle.fill": "alert",
  "person.crop.circle.badge.checkmark": "account-check",
  "info.circle.fill": "information",
  link: "link-variant",
  globe: "web",
  "person.fill": "account",
  "bed.double.fill": "bed",
  wineglass: "glass-wine",
  "eye.fill": "eye",
  "chart.bar": "chart-bar",
  "exclamationmark.circle.fill": "alert-circle",
  "exclamationmark.circle": "alert-circle-outline",
  "person.fill.xmark": "account-remove",
  "person.badge.plus": "account-plus",
  "person.crop.circle.badge.xmark": "account-remove",
  "key.fill": "key",
  "person.circle.fill": "account-circle",
  "arrow.right.circle.fill": "arrow-right-circle",
  "doc.text.fill": "file-document",
  "book.fill": "book",
  "envelope.badge": "email-alert",
} as const;

// 3. Fallback icon for unmapped symbols on Android
const FALLBACK_ANDROID_ICON = "help-circle-outline";

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // -------------------------------------
  // iOS — use SF Symbols exactly as before
  // -------------------------------------
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={name as any}
        size={size}
        tintColor={color}
        weight={weight}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  // -------------------------------------
  // Android/Web — use MaterialCommunityIcons
  // with proper fallback
  // -------------------------------------
  const mapped = MAPPING[name as keyof typeof MAPPING];
  const iconName = mapped ?? FALLBACK_ANDROID_ICON;

  return (
    <MaterialCommunityIcons
      name={iconName}
      size={size}
      color={color}
      style={style}
    />
  );
}
