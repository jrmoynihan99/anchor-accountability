import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";
import { StyleSheet, View } from "react-native";

type PortalStore = {
  subscribeKeys: (listener: () => void) => () => void;
  getKeysSnapshot: () => readonly string[];
  subscribeContent: (key: string, listener: () => void) => () => void;
  getContentSnapshot: (key: string) => React.ReactNode;
  mount: (key: string, content: React.ReactNode) => void;
  unmount: (key: string) => void;
};

function createPortalStore(): PortalStore {
  let keys: readonly string[] = [];
  const contentMap = new Map<string, React.ReactNode>();
  const keyListeners = new Set<() => void>();
  const contentListeners = new Map<string, Set<() => void>>();

  const notifyKeys = () => keyListeners.forEach((l) => l());
  const notifyContent = (key: string) =>
    contentListeners.get(key)?.forEach((l) => l());

  return {
    subscribeKeys(listener) {
      keyListeners.add(listener);
      return () => keyListeners.delete(listener);
    },
    getKeysSnapshot() {
      return keys;
    },
    subscribeContent(key, listener) {
      if (!contentListeners.has(key)) contentListeners.set(key, new Set());
      contentListeners.get(key)!.add(listener);
      return () => {
        contentListeners.get(key)?.delete(listener);
      };
    },
    getContentSnapshot(key) {
      return contentMap.get(key) ?? null;
    },
    mount(key, content) {
      const isNew = !contentMap.has(key);
      contentMap.set(key, content);
      if (isNew) {
        keys = [...keys, key];
        notifyKeys();
      }
      notifyContent(key);
    },
    unmount(key) {
      if (!contentMap.has(key)) return;
      contentMap.delete(key);
      contentListeners.delete(key);
      keys = keys.filter((k) => k !== key);
      notifyKeys();
    },
  };
}

const PortalStoreContext = createContext<PortalStore | null>(null);

export function useModalPortal() {
  const store = useContext(PortalStoreContext);
  if (!store) {
    return { mount: () => {}, unmount: () => {} };
  }
  return { mount: store.mount, unmount: store.unmount };
}

/** Renders a single portal's content — only re-renders when THIS key's content changes. */
function PortalSlot({ portalKey }: { portalKey: string }) {
  const store = useContext(PortalStoreContext)!;
  const subscribe = useCallback(
    (listener: () => void) => store.subscribeContent(portalKey, listener),
    [store, portalKey],
  );
  const getSnapshot = useCallback(
    () => store.getContentSnapshot(portalKey),
    [store, portalKey],
  );
  const content = useSyncExternalStore(subscribe, getSnapshot);
  return <>{content}</>;
}

/** Renders portal containers — only re-renders when keys are added/removed. */
function PortalRenderer() {
  const store = useContext(PortalStoreContext)!;
  const keys = useSyncExternalStore(store.subscribeKeys, store.getKeysSnapshot);

  if (keys.length === 0) return null;

  return (
    <>
      {keys.map((key) => (
        <View
          key={key}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
          collapsable={false}
        >
          <PortalSlot portalKey={key} />
        </View>
      ))}
    </>
  );
}

export function ModalPortalHost({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<PortalStore | null>(null);
  if (!storeRef.current) storeRef.current = createPortalStore();

  return (
    <PortalStoreContext.Provider value={storeRef.current}>
      {children}
      <PortalRenderer />
    </PortalStoreContext.Provider>
  );
}
