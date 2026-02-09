import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@deep_linked_orgs";

interface DeepLinkedOrgsData {
  orgIds: string[];
  latestOrgId: string;
}

/**
 * Add an org ID to the persisted set of deep-linked orgs.
 * Also sets it as the latest (most recently linked) org.
 */
export async function addDeepLinkedOrg(orgId: string): Promise<void> {
  try {
    const existing = await getDeepLinkedOrgs();
    const orgIds = existing
      ? Array.from(new Set([...existing.orgIds, orgId]))
      : [orgId];

    const data: DeepLinkedOrgsData = { orgIds, latestOrgId: orgId };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[deepLinkedOrgs] Error saving:", e);
  }
}

/**
 * Read all persisted deep-linked org data.
 * Returns null if nothing has been stored.
 */
export async function getDeepLinkedOrgs(): Promise<DeepLinkedOrgsData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeepLinkedOrgsData;
  } catch (e) {
    console.warn("[deepLinkedOrgs] Error reading:", e);
    return null;
  }
}
