'use client';

import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { Channel } from '../controls/channel';
import { Track } from 'livekit-client';

export default function TestPage() {

    const a = Track.Source.ScreenShareAudio;

  return (
    <div>
      <Channel
        roomName="iys"
        onlineCount={6}
        mainParticipants={[
            ["iaa", {
                name: "Zhang San",
                volume: 1,
                blur: 0,
                screenBlur: 0,
                status: "online",
                socketId: "socket-123",
                startAt: Date.now(),
                virtual: {
                    role: ModelRole.None,
                    bg: ModelBg.ClassRoom,
                    enabled: false
                }
            }]
        ]}
        subParticipants={[]}
        currentRoom="main"
        onJoinMainRoom={() => {}}
        onJoinSubRoom={() => {}}
        onLeaveSubRoom={() => {}}
        onCreateSubRoom={() => {}}
        onSubRoomSettings={() => {}}
      ></Channel>
    </div>
  );
}
