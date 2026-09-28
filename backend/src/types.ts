export type ChatMessage = {
  sender: string;
  text: string;
  timestamp: string;
};

export type ServerMessage = {
  type: 'chat';
  payload: ChatMessage;
};
