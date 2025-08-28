import { UserDefineStatus, UserStatus } from '.';
import { ModelBg, ModelRole } from './virtual';

/**
 * Child room information
 */
export interface ChildRoom {
  /**
   * room name
   */
  name: string;
  /**
   * 参与者ID
   * participantId
   */
  participants: string[];
  /**
   * room owner ID
   */
  ownerId: string;
  /**
   * is private room or not
   */
  isPrivate: boolean;
}

/**
 * Participant settings in Space
 */
export interface ParticipantSettings {
  /**
   * 参与者名称
   */
  name: string;
  /**
   * 音量
   */
  volume: number;
  /**
   * 视频模糊度
   */
  blur: number;
  /**
   * 屏幕分享模糊度
   */
  screenBlur: number;
  /**
   * 用户状态：系统状态/用户自定义状态
   */
  status: UserStatus | string;
  socketId: string;
  /**
   * 参与者开始时间
   */
  startAt: number;
  /**
   * 虚拟形象
   */
  virtual: {
    role: ModelRole;
    bg: ModelBg;
    enabled: boolean;
  };
  /**
   * 是否开启屏幕分享音频
   */
  openShareAudio: boolean;
  /**
   * 是否开启新用户加入时的提示音
   */
  openPromptSound: boolean;
}

export interface SpaceTimeRecord {
  start: number; // 记录开始时间戳
  end?: number; // 记录结束时间戳
}

export interface SpaceDateRecord {
  /**
   * 空间的使用记录
   */
  space: SpaceTimeRecord[];
  /**
   * 参与者的使用记录
   */
  participants: {
    [name: string]: SpaceTimeRecord[];
  };
}

/**
 * 记录空间的使用情况
 * 主要应用在空间的使用记录中
 */
export interface SpaceDateRecords {
  [spaceId: string]: SpaceDateRecord;
}

export interface RecordSettings {
  egressId?: string;
  filePath?: string;
  active: boolean;
}

export type AppKey = 'timer' | 'countdown' | 'todo';

export interface SpaceInfoMap {
  [spaceId: string]: SpaceInfo;
}

export interface SpaceInfo {
  participants: {
    [participantId: string]: ParticipantSettings;
  };
  status?: UserDefineStatus[];
  ownerId: string;
  record: RecordSettings;
  startAt: number;
  children: ChildRoom[];
  // 应用列表，由主持人设置参与者可以使用的应用
  apps: AppKey[];
  persistence: boolean;
}

export const DEFAULT_SPACE_INFO = (startAt: number): SpaceInfo => ({
  participants: {},
  ownerId: '',
  persistence: false,
  record: { active: false },
  startAt,
  children: [],
  apps: ['todo', 'countdown'],
});

export const DEFAULT_PARTICIPANT_SETTINGS: ParticipantSettings = {
  name: '',
  volume: 100,
  blur: 0.0,
  screenBlur: 0.0,
  status: UserStatus.Online,
  socketId: '',
  startAt: 0,
  virtual: {
    role: ModelRole.None,
    bg: ModelBg.ClassRoom,
    enabled: false,
  },
  openPromptSound: true,
  openShareAudio: false,
};

/**
 * key in localStorage
 */
export const PARTICIPANT_SETTINGS_KEY = 'vocespace_participant_settings';
