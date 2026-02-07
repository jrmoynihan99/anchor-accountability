import React, {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";
import { StyleSheet, View } from "react-native";

type PortalStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Map<string, React.ReactNode>;
  mount: (key: string, content: React.ReactNode) => void;
  unmount: (key: string) => void;
};

function createPortalStore(): PortalStore {
  let portals = new Map<string, React.ReactNode>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return portals;
    },
    mount(key, content) {
      portals = new Map(portals).set(key, content);
      notify();
    },
    unmount(key) {
      if (!portals.has(key)) return;
      const next = new Map(portals);
      next.delete(key);
      portals = next;
      notify();
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

/** Renders only the portal content — isolated from the app tree. */
function PortalRenderer() {
  const store = useContext(PortalStoreContext)!;
  const portals = useSyncExternalStore(store.subscribe, store.getSnapshot);

  if (portals.size === 0) return null;

  return (
    <>
      {Array.from(portals.entries()).map(([key, content]) => (
        <View
          key={key}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
          collapsable={false}
        >
          {content}
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
