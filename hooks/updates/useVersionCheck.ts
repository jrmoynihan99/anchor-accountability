// hooks/updates/useVersionCheck.ts
import { db } from "@/lib/firebase";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

interface VersionConfig {
  minimumVersion?: string;
  message?: string;
}

export function useVersionCheck() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minimumVersion, setMinimumVersion] = useState<string>("");

  useEffect(() => {
    // Get current app version - try multiple sources for cross-platform compatibility
    const currentVersion =
      Constants.expoConfig?.version ||
      (Constants as any).manifest?.version ||
      (Constants as any).manifest2?.extra?.expoClient?.version ||
      Application.nativeApplicationVersion ||
      "0.0.0";
    console.log("[useVersionCheck] Current version:", currentVersion);

    // Real-time listener for version control document
    const versionDocRef = doc(db, "config", "versionControl");

    const unsubscribe = onSnapshot(
      versionDocRef,
      (versionDoc) => {
        try {
          if (!versionDoc.exists()) {
            console.log(
              "[useVersionCheck] No version control document found, allowing app access",
            );
            setUpdateRequired(false);
            setLoading(false);
            return;
          }

          const versionConfig = versionDoc.data() as VersionConfig;
          const requiredVersion = versionConfig.minimumVersion || "0.0.0";

          console.log("[useVersionCheck] Required version:", requiredVersion);

          // Compare semantic versions
          const needsUpdate =
            compareVersions(currentVersion, requiredVersion) < 0;
          console.log("[useVersionCheck] Version comparison:", {
            current: currentVersion,
            required: requiredVersion,
            needsUpdate,
          });

          setUpdateRequired(needsUpdate);
          setMinimumVersion(requiredVersion);
          setLoading(false);
        } catch (error) {
          console.error(
            "[useVersionCheck] Error processing version check:",
            error,
          );
          setUpdateRequired(false);
          setLoading(false);
        }
      },
      (error) => {
        // Fail open - allow app access on error
        console.error(
          "[useVersionCheck] Error listening to version control, allowing app access:",
          error,
        );
        setUpdateRequired(false);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { updateRequired, loading, minimumVersion };
}

/**
 * Compare two semantic version strings
 * Returns:
 *  -1 if version1 < version2
 *   0 if version1 == version2
 *   1 if version1 > version2
 */
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split(".").map((part) => parseInt(part, 10) || 0);
  const v2Parts = version2.split(".").map((part) => parseInt(part, 10) || 0);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }

  return 0;
}
