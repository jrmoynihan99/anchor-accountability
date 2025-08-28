// hooks/useRejectionModal.ts
import { useCallback, useState } from "react";

export function useRejectionModalController() {
  // Modal is visible or not
  const [visible, setVisible] = useState(false);
  // Modal content
  const [type, setType] = useState<"plea" | "post" | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [reason, setReason] = useState<string | undefined>();

  // Show modal with provided info
  const open = useCallback(
    ({
      type,
      message,
      reason,
    }: {
      type: "plea" | "post";
      message?: string;
      reason?: string;
    }) => {
      setType(type);
      setMessage(message);
      setReason(reason);
      setVisible(true);
    },
    []
  );

  // Hide modal, and after a delay, clear data (to avoid any crash)
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setType(undefined);
      setMessage(undefined);
      setReason(undefined);
    }, 400); // Must be longer than your modal's closing animation!
  }, []);

  return {
    visible,
    open,
    close,
    type,
    message,
    reason,
  };
}
