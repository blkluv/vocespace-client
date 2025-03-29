// /app/api/room-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 内存中存储房间设置 (实际应用中可能需要使用数据库或 Redis)
interface RoomSettings {
  [roomId: string]: {
    participants: {
      [participantId: string]: {
        blur: number;
      };
    };
  };
}

const roomSettings: RoomSettings = {};

// 获取房间所有参与者设置
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId');
  
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }
  
  const settings = roomSettings[roomId]?.participants || {};
  
  return NextResponse.json({ settings });
}

// 更新单个参与者设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, participantId, settings } = body;
    
    if (!roomId || !participantId || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // 初始化房间设置（如果不存在）
    if (!roomSettings[roomId]) {
      roomSettings[roomId] = { participants: {} };
    }
    
    // 更新参与者设置
    roomSettings[roomId].participants[participantId] = {
      ...roomSettings[roomId].participants[participantId],
      ...settings
    };
    
    console.log(`Updated settings for room ${roomId}, participant ${participantId}:`, settings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating room settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// 清除参与者设置（当参与者离开房间时）
export async function DELETE(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId');
  const participantId = request.nextUrl.searchParams.get('participantId');
  
  if (!roomId || !participantId) {
    return NextResponse.json({ error: 'Room ID and Participant ID are required' }, { status: 400 });
  }
  
  if (roomSettings[roomId]?.participants?.[participantId]) {
    delete roomSettings[roomId].participants[participantId];
    
    // 如果房间为空，清除整个房间
    if (Object.keys(roomSettings[roomId].participants).length === 0) {
      delete roomSettings[roomId];
    }
    
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false, message: 'Participant not found' });
}