import { UserDefineStatus, UserStatus } from ".";
import { ModelBg, ModelRole } from "./virtual";

export interface ChildRoom {
  // room name
  name: string;
  // 参与者ID
  participants: string[];
  ownerId: string;
  // is private room
  isPrivate: boolean;
}

export interface ParticipantSettings {
  name: string;
  volume: number;
  blur: number;
  screenBlur: number;
  status: UserStatus | string;
  socketId: string;
  startAt: number;
  virtual: {
    role: ModelRole;
    bg: ModelBg;
    enabled: boolean;
  };
}

export interface RecordSettings {
  egressId?: string;
  filePath?: string;
  active: boolean;
}

export interface RoomSettings {
  participants: {
    [participantId: string]: ParticipantSettings;
  };
  status?: UserDefineStatus[];
  ownerId: string;
  record: RecordSettings;
  startAt: number;
  children: ChildRoom[]
}

