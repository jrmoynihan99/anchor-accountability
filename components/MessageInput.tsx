import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength?: number;
  minHeight?: number;
  showCharacterCount?: boolean;
  showBorder?: boolean;
}

export function MessageInput({
  value,
  onChangeText,
  placeholder,
  maxLength = 500,
  minHeight = 120,
  showCharacterCount = true,
  showBorder = true,
}: MessageInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        showBorder && styles.inputContainer,
        showBorder && {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[
          styles.textInput,
          {
            backgroundColor: colors.textInputBackground,
            borderColor: colors.textInputBorder,
            color: colors.text,
            minHeight,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        textAlignVertical="top"
        scrollEnabled={isFocused}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        // Optional: dismiss keyboard on drag
        onTouchStart={() => {
          if (!isFocused) {
            // prevent auto-focusing unless already focused
            Keyboard.dismiss();
          }
        }}
      />
      {showCharacterCount && (
        <ThemedText
          type="small"
          style={[
            styles.characterCount,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {value.length}/{maxLength}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  characterCount: {
    textAlign: "right",
    marginTop: 8,
  },
});
