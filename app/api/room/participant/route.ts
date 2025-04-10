/**
 * 连接某个房间并查询房间信息
 */

import { ParticipantInfo, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

interface RoomInfo {
  roomId: string;
  participants: ParticipantInfo[];
}

const URL: string = process.env.LIVEKIT_URL || 'wss://space.voce.chat';
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

// 查询可被使用的参与者名字
export async function GET(request: NextRequest) {
  const roomService = new RoomServiceClient(URL, API_KEY, API_SECRET);

  const roomId = request.nextUrl.searchParams.get('roomId');
  if (roomId) {
    let participants: ParticipantInfo[] = [];
    try {
      participants = await roomService.listParticipants(roomId);
      // 接下来需要便利参与者，获取所有为`User [01~99]`的参与者，得到新参与者可以使用的名字进行返回
      let usedUserNames: number[] = [];

      participants.forEach((participant) => {
        if (participant.identity.startsWith('User')) {
          const userName = participant.identity.split(' ')[1];
          usedUserNames.push(parseInt(userName));
        }
      });

      // 直接进行排序并获取最大值，+ 1之后就是可以使用的参与者名字
      usedUserNames.sort((a, b) => a - b);
      const availableUserName = `User ${usedUserNames[usedUserNames.length - 1] + 1}`;

      return NextResponse.json({
        name: availableUserName,
      });
    } catch (e) {
      // 这里需要处理错误，可能是房间不存在或者没有权限
      return NextResponse.json({
        name: `User 01`,
      });
    }
  }

  return NextResponse.json(
    {
      error: 'Missing roomId',
    },
    {
      status: 400,
    },
  );
}
