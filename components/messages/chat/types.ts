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

// components/messages/chat/types.ts
export interface ThreadHeaderProps {
  threadName?: string;
  isTyping?: boolean;
  colors: any;
  onBack: () => void;
  otherUserId?: string; // Add this line
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
