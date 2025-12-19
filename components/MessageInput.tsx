// components/ui/MessageInput.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength?: number;
  minHeight?: number;
  showCharacterCount?: boolean;
  showBorder?: boolean; // New optional prop
}

export function MessageInput({
  value,
  onChangeText,
  placeholder,
  maxLength = 500,
  minHeight = 120,
  showCharacterCount = true,
  showBorder = true, // Defaults to true for backward compatibility
}: MessageInputProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        showBorder && styles.inputContainer, // Only apply border styles if showBorder is true
        showBorder && {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      <TextInput
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
