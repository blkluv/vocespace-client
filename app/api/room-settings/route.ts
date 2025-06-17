// /app/api/room-settings/route.ts
import { UserStatus } from '@/lib/std';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

interface Participant {
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

// 内存中存储房间设置
interface RoomSettings {
  participants: {
    [participantId: string]: Participant;
  };
  status?: Status[];
  ownerId: string;
  record: {
    egressId?: string;
    filePath?: string;
    active: boolean;
  };
}

interface RoomSettingsMap {
  [roomId: string]: RoomSettings;
}

interface Status {
  id: string;
  creator: {
    name: string;
    id: string;
  };
  name: string;
  desc: string;
  icon: {
    key: string;
    color: string;
  };
  volume: number;
  blur: number;
  screenBlur: number;
}

// [redis config env] ----------------------------------------------------------
const {
  REDIS_ENABLED = 'false',
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,
  REDIS_DB = '0',
} = process.env;

let redisClient: Redis | null = null;

// [build redis client] --------------------------------------------------------
if (REDIS_ENABLED === 'true') {
  let host = REDIS_HOST;
  let port = parseInt(REDIS_PORT, 10);
  let db = parseInt(REDIS_DB, 10);

  redisClient = new Redis({
    host,
    port,
    password: REDIS_PASSWORD,
    db,
  });
}

class RoomManager {
  // 房间 redis key 前缀
  private static ROOM_KEY_PREFIX = 'room:';
  // 参与者 redis key 前缀
  private static PARTICIPANT_KEY_PREFIX = 'room:participant:';
  // 房间列表 redis key 前缀 （房间不止一个）
  private static ROOM_LIST_KEY_PREFIX = 'room:list:';

  // room redis key, like: room:test_room
  private static getRoomKey(room: string): string {
    return `${this.ROOM_KEY_PREFIX}${room}`;
  }
  // participant redis key
  private static getParticipantKey(room: string, participantId: string): string {
    return `${this.PARTICIPANT_KEY_PREFIX}${room}:${participantId}`;
  }

  // 判断房间是否存在 ----------------------------------------------------------------------
  static async roomExists(room: string): Promise<boolean> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomKey = this.getRoomKey(room);
      const exists = await redisClient.exists(roomKey);
      return exists > 0;
    } catch (error) {
      console.error('Error checking room existence:', error);
      return false;
    }
  }

  // 获取房间设置 --------------------------------------------------------------------------
  static async getRoomSettings(room: string): Promise<RoomSettings | null> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomKey = this.getRoomKey(room);
      const roomDataStr = await redisClient.get(roomKey);

      if (!roomDataStr) {
        return null;
      }

      return JSON.parse(roomDataStr) as RoomSettings;
    } catch (error) {
      console.error('Error getting room settings:', error);
      return null;
    }
  }

  // 设置房间设置数据 -----------------------------------------------------------------------
  static async setRoomSettings(room: string, settings: RoomSettings): Promise<boolean> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomKey = this.getRoomKey(room);
      const settingsStr = JSON.stringify(settings);
      // 设置回存储
      await redisClient.set(roomKey, settingsStr);
      // 设置到房间列表中
      await redisClient.sadd(this.ROOM_LIST_KEY_PREFIX, room);
      return true;
    } catch (error) {
      console.error('Error setting room settings:', error);
      return false;
    }
  }
  // 获取所有房间设置 -------------------------------------------------------------------
  static async getAllRooms(): Promise<RoomSettingsMap> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomKeys = await redisClient.smembers(this.ROOM_LIST_KEY_PREFIX);
      const roomMap: RoomSettingsMap = {};

      for (const roomKey of roomKeys) {
        const roomSettings = await this.getRoomSettings(roomKey);
        if (roomSettings) {
          roomMap[roomKey] = roomSettings;
        }
      }

      return roomMap;
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return {};
    }
  }
  // 更新参与者设置 -----------------------------------------------------------------------
  static async updateParticipant(
    room: string,
    participantId: string,
    pData: Participant,
  ): Promise<boolean> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      let roomSettings = await this.getRoomSettings(room);
      // 房间不存在说明是第一次创建
      if (!roomSettings) {
        roomSettings = {
          participants: {},
          ownerId: participantId,
          record: { active: false },
        };
      }

      // 更新参与者数据
      roomSettings.participants[participantId] = {
        ...roomSettings.participants[participantId],
        ...pData,
      };

      // 保存更新后的房间设置
      return await this.setRoomSettings(room, roomSettings);
    } catch (error) {
      console.error('Error updating participant:', error);
      return false;
    }
  }
  // 删除房间 -----------------------------------------------------------------------
  static async deleteRoom(room: string): Promise<boolean> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomKey = this.getRoomKey(room);
      // 删除房间设置
      await redisClient.del(roomKey);
      // 从房间列表中删除
      await redisClient.srem(this.ROOM_LIST_KEY_PREFIX, room);
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  // 转让房间主持人 -----------------------------------------------------------------------
  static async transferOwnership(room: string, newOwnerId: string): Promise<boolean> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      const roomSettings = await this.getRoomSettings(room);
      if (!roomSettings || !roomSettings.participants[newOwnerId]) {
        return false; // 房间或新主持人不存在
      } else {
        roomSettings.ownerId = newOwnerId;
        return await this.setRoomSettings(room, roomSettings);
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
      return false;
    }
  }

  // 删除参与者 -----------------------------------------------------------------------
  static async removeParticipant(
    room: string,
    participantId: string,
  ): Promise<{
    success: boolean;
    clearAll?: boolean;
    error?: any;
  }> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }

      let roomSettings = await this.getRoomSettings(room);
      if (!roomSettings || !roomSettings.participants[participantId]) {
        return {
          success: false,
        }; // 房间或参与者不存在可能出现了问题
      }

      // 删除参与者
      delete roomSettings.participants[participantId];
      // 先设置回去, 以防transferOwnership读取脏数据
      await this.setRoomSettings(room, roomSettings);
      // 判断这个参与者是否是主持人，如果是则进行转让，转给第一个参与者， 如果没有参与者直接删除房间
      if (Object.keys(roomSettings.participants).length === 0) {
        await this.deleteRoom(room);
        return {
          success: true,
          clearAll: true,
        };
      } else {
        // 进行转让, 一定有1个参与者
        if (roomSettings.ownerId === participantId) {
          const remainingParticipants = Object.keys(roomSettings.participants);
          await this.transferOwnership(
            room,
            remainingParticipants[0], // 转让给第一个剩余的参与者
          );
        }
        return {
          success: true,
          clearAll: false,
        };
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      return {
        success: false,
        clearAll: false,
        error,
      };
    }
  }
  // 添加房间的状态 --------------------------------------------------------------
  static async addRoomStatus(
    room: string,
    status: Status,
  ): Promise<{
    success: boolean;
    error?: any;
  }> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }

      let roomSettings = await this.getRoomSettings(room);
      if (!roomSettings) {
        throw new Error('Room not found');
      }
      // 房间存在，需要检查是否已经存在同名状态
      if (!roomSettings.status) {
        roomSettings.status = [status];
      } else {
        const isExist = roomSettings.status.some((s) => s.name === status.name);
        if (isExist) {
          throw new Error('Status already exists');
        } else {
          roomSettings.status.push(status);
        }
      }
      await this.setRoomSettings(room, roomSettings);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error adding room status:', error);
      return {
        success: false,
        error,
      };
    }
  }
  // 生成新参与者 ----------------------------------------------------------------
  static async genUserName(room: string): Promise<string> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      let roomSettings = await this.getRoomSettings(room);
      if (!roomSettings) {
        roomSettings = {
          participants: {},
          ownerId: '',
          record: { active: false },
        };
      }

      // 获取所有参与者的名字
      const participants = Object.values(roomSettings.participants);
      let usedUserNames: number[] = [];
      participants.forEach((participant) => {
        if (participant.name.startsWith('User')) {
          const userName = participant.name.split(' ')[1];
          // 判断是否是数字
          if (!isNaN(parseInt(userName))) {
            // 将数字字符串转换为数字并存储
            usedUserNames.push(parseInt(userName));
          }
        }
      });

      // 直接进行排序并获取最大值，+ 1之后就是可以使用的参与者名字
      let suffix = 1; // 默认从 1 开始
      if (usedUserNames.length > 0) {
        usedUserNames.sort((a, b) => a - b);
        suffix = usedUserNames[usedUserNames.length - 1] + 1;
      }

      let suffix_str = suffix.toString();
      if (suffix < 10) {
        suffix_str = `0${suffix}`;
      }

      const availableUserName = `User ${suffix_str}`;

      return availableUserName;
    } catch (error) {
      console.error('Error generating user name:', error);
      return 'User 01'; // 默认返回第一个用户
    }
  }
  // 更新录制设置 -------------------------------------------------------
  static async updateRecordSettings(
    room: string,
    recordSettings: { egressId?: string; filePath?: string; active: boolean },
  ): Promise<{
    success: boolean;
    error?: any;
  }> {
    try {
      if (!redisClient) {
        throw new Error('Redis client is not initialized or disabled.');
      }
      let roomSettings = await this.getRoomSettings(room);
      if (!roomSettings) {
        throw new Error('Room not found');
      }

      // 更新录制设置
      roomSettings.record = {
        ...roomSettings.record,
        ...recordSettings,
      };
      await this.setRoomSettings(room, roomSettings);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating record settings:', error);
      return {
        success: false,
        error,
      };
    }
  }
}

// const roomSettings: RoomSettings = {};

// 获取房间所有参与者设置
export async function GET(request: NextRequest) {
  const all = request.nextUrl.searchParams.get('all') === 'true';
  const roomId = request.nextUrl.searchParams.get('roomId');
  const is_pre = request.nextUrl.searchParams.get('pre') === 'true';

  if (all) {
    const detail = request.nextUrl.searchParams.get('detail') === 'true';
    const allRooms = await RoomManager.getAllRooms();
    if (detail) {
      return NextResponse.json(allRooms, { status: 200 });
    } else {
      // 将roomSettings转为Map形式 Map<roomId, participants>
      const roomSettingsMap = Object.entries(allRooms).reduce((acc, [roomId, { participants }]) => {
        acc[roomId] = Object.keys(participants);
        return acc;
      }, {} as Record<string, string[]>);

      return NextResponse.json(roomSettingsMap);
    }
  }
  if (roomId == '' || !roomId) {
    return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
  }

  if (is_pre) {
    const availableUserName = await RoomManager.genUserName(roomId);
    return NextResponse.json({
      name: availableUserName,
    });
  } else {
    const allRooms = await RoomManager.getAllRooms();
    return NextResponse.json(
      { settings: allRooms[roomId] || { participants: {} } },
      { status: 200 },
    );
  }
}

// 更新单个参与者设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, participantId, settings, trans, record } = body;
    // 处理录制
    if (record && roomId) {
      const { success, error } = await RoomManager.updateRecordSettings(roomId, record);

      if (success) {
        const roomSettings = await RoomManager.getRoomSettings(roomId);
        return NextResponse.json({ success: true, record: roomSettings?.record }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: error || 'Failed to update record settings' },
          { status: 500 },
        );
      }
    }

    // 转让房间主持人
    if (trans && roomId && participantId) {
      const success = await RoomManager.transferOwnership(roomId, participantId);
      if (success) {
        return NextResponse.json({ success: true, ownerId: participantId }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
      }
    }

    if (!roomId || !participantId || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const success = await RoomManager.updateParticipant(roomId, participantId, settings);
    return NextResponse.json({ success }, { status: 200 });
  } catch (error) {
    console.error('Error updating room settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// 添加房间状态
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { roomId, status }: { roomId: string; status: Status } = body;
  if (!roomId || !status) {
    return NextResponse.json({ error: 'Room ID and status are required' }, { status: 400 });
  }

  const { success, error } = await RoomManager.addRoomStatus(roomId, status);

  if (success) {
    const roomSettings = await RoomManager.getRoomSettings(roomId);
    return NextResponse.json(
      { success: true, status: roomSettings?.status, roomId },
      { status: 200 },
    );
  } else {
    return NextResponse.json(
      {
        error,
        status,
      },
      {
        status: 500,
      },
    );
  }
}

// 清除参与者设置（当参与者离开房间时）
export async function DELETE(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId');
  const participantId = request.nextUrl.searchParams.get('participantId');

  if (!roomId || !participantId) {
    return NextResponse.json({ error: 'Room ID and Participant ID are required' }, { status: 400 });
  }

  let { success, clearAll, error } = await RoomManager.removeParticipant(roomId, participantId);
  if (success) {
    if (clearAll) {
      return NextResponse.json({ success: true, clearRoom: roomId });
    }
    return NextResponse.json({ success: true, message: 'Participant removed successfully' });
  }

  return NextResponse.json(
    { success: false, message: 'Failed to remove participant', error },
    { status: 500 },
  );
}
