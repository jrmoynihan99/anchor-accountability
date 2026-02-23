import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { NativeModules, Platform } from "react-native";

const { AppGroupStorage } = NativeModules;

export function useWidgetDataSync() {
  const { organizationId } = useOrganization();

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    if (!organizationId) return;

    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    const syncWidgetData = async () => {
      try {
        const orgRef = doc(db, "organizations", organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) return;

        const orgData = orgDoc.data();
        const orgName = orgData.name || organizationId;
        const deepLink = orgData.deepLink || "";

        // Ensure widget token exists on user doc
        const userRef = doc(
          db,
          "organizations",
          organizationId,
          "users",
          user.uid
        );
        const userDoc = await getDoc(userRef);
        let widgetToken = userDoc.data()?.widgetToken;

        if (!widgetToken) {
          widgetToken = crypto.randomUUID();
          await setDoc(userRef, { widgetToken }, { merge: true });
        }

        await AppGroupStorage.setWidgetData({
          orgId: organizationId,
          orgName,
          deepLink,
          userId: user.uid,
          widgetToken,
        });

        await AppGroupStorage.reloadWidgetTimelines();
      } catch (error) {
        console.error("[useWidgetDataSync] Error syncing widget data:", error);
      }
    };

    syncWidgetData();
  }, [organizationId]);
}
