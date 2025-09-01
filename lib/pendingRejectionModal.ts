// lib/pendingRejectionModal.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_MODAL_KEY = "pendingRejectionModal";

export async function setPendingRejectionModal(data: {
  type: "plea" | "post";
  message?: string;
  reason?: string;
}) {
  await AsyncStorage.setItem(PENDING_MODAL_KEY, JSON.stringify(data));
}

export async function getPendingRejectionModal() {
  const raw = await AsyncStorage.getItem(PENDING_MODAL_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearPendingRejectionModal() {
  await AsyncStorage.removeItem(PENDING_MODAL_KEY);
}
