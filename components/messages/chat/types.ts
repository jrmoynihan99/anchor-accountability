// components/messages/types.ts

export interface Message {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read";
}

export interface MessageDisplayProps {
  message: Message;
  showTimestamp: boolean;
  colors: any;
}

export interface ThreadHeaderProps {
  threadName: string;
  isTyping: boolean;
  colors: any;
  onBack: () => void;
}

export interface MessageInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onFocus: () => void;
  colors: any;
  disabled?: boolean;
}

export interface EmptyStateProps {
  isNewThread: boolean;
  threadName?: string;
  colors: any;
}
