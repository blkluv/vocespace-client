// // room management
// import { NextResponse } from 'next/server';
// import { Room, RoomServiceClient } from 'livekit-server-sdk';
// import os from 'os';

// const PORT = process.env.PORT ?? 3000;
// const getServerIp = () => {
//   const interfaces = os.networkInterfaces();
//   for (const interfaceName in interfaces) {
//     const networkInterface = interfaces[interfaceName];
//     if (networkInterface) {
//       for (const net of networkInterface) {
//         if (net.family === 'IPv4' && !net.internal) {
//           return net.address;
//         }
//       }
//     }
//   }
//   return null;
// };
// const HOST = process.env.SERVER_NAME ?? getServerIp() ?? 'localhost';
// const API_KEY = process.env.LIVEKIT_API_KEY;
// const API_SECRET = process.env.LIVEKIT_API_SECRET;
// console.warn(HOST, API_KEY, API_SECRET);
// const roomService = new RoomServiceClient(`https://${HOST}`, API_KEY, API_SECRET);

// /// delete participant from room
// /// json body: {
// ///   roomName: string,
// ///   identity: string // participant identity
// /// }
// export async function DELETE(request: Request) {
//   const { roomName, identity } = await request.json();
//   if (!roomName || !identity) {
//     return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//   }

//   await roomService.removeParticipant(roomName, identity);
//   return NextResponse.json({ message: 'Participant removed successfully' });
// }

