// app/update.tsx
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STORE_URL = Platform.select({
  ios: "https://apps.apple.com/us/app/anchor-fight-lust-together/id6752869901",
  android:
    "https://play.google.com/store/apps/details?id=com.jrmoynihan99.anchor",
}) as string;

export default function UpdateScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Update Required</Text>

        <Text style={styles.message}>
          A new version of Anchor is available. Please update to continue using
          the app.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL(STORE_URL)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAF8F6", // Light background
  },
  content: {
    maxWidth: 400,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontFamily: "Spectral_700Bold",
    color: "#3D3022", // Dark text
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: "Spectral_400Regular",
    color: "#6B5F52", // Secondary text
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#CBAD8D",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Spectral_700Bold",
    color: "#FFFFFF",
  },
});
