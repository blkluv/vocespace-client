'use client';

import { Channel } from '../controls/channel';

export default function TestPage() {
  return (
    <div>
      <Channel roomName="iys" onlineCount={6} mainRoomUsers={[
        {
            id: "1",
            name: "Alice",
            avatar: "https://example.com/avatar1.png",
            status: "online"
        }
      ]}
      subRooms={[

      ]}
      currentRoom='main'
      onJoinMainRoom={()=>{}}
      onJoinSubRoom={()=>{}}
      onLeaveSubRoom={()=>{}}
        onCreateSubRoom={()=>{}}
        onSubRoomSettings={()=>{}}
      ></Channel>
    </div>
  );
}
