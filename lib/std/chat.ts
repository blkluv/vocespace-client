export interface ChatMsgItem {
  id?: string;
  sender: {
    id: string;
    name: string;
  };
  message: string | null;
  type: 'text' | 'file';
  roomName: string;
  timestamp?: string;
  file: {
    name: string;
    size: number;
    type: string;
    url?: string;
    data?: string | ArrayBuffer | null;
  } | null;
}