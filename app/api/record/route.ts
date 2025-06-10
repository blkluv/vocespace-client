import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_REGION,
} = process.env;

interface EgressBody {
  room: string | null;
  type: 'start' | 'stop';
  egressId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { room, type, egressId }: EgressBody = await req.json();
    if (room === null) {
      return new NextResponse('Missing roomName parameter', { status: 403 });
    }

    if (!LIVEKIT_URL) {
      return NextResponse.json({ error: 'LIVEKIT_URL is not set' }, { status: 500 });
    }

    // const hostURL = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'https://');
    const hostURL = 'https://vocespace.xyz';

    const egressClient = new EgressClient(hostURL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    if (type === 'start' && !egressId) {
      // check if the room egresses are already running
      const existingEgresses = await egressClient.listEgress({ roomName: room });
      console.warn(existingEgresses);
      if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
        return NextResponse.json(
          { error: 'Egress is already running for this room' },
          { status: 403 },
        );
      }
      let timestamp = new Date().getTime();
      timestamp = Math.floor(timestamp / 1000); // Convert to seconds
      const fileOutput = new EncodedFileOutput({
        filepath: `${room}/${timestamp}.mp4`,
        output: {
          case: 's3',
          value: new S3Upload({
            accessKey: S3_ACCESS_KEY,
            secret: S3_SECRET_KEY,
            region: S3_REGION,
            bucket: S3_BUCKET,
            forcePathStyle: true,
          }),
        },
      });

      const egressInfo = await egressClient.startRoomCompositeEgress(
        room,
        {
          file: fileOutput,
        },
        {
          layout: 'speaker',
        },
      );

      return NextResponse.json(
        {
          filePath: `s3://${S3_BUCKET}/${fileOutput.filepath}`,
          egressId: egressInfo.egressId,
        },
        { status: 200 },
      );
    } else if (type === 'stop' && egressId) {
      const existingEgresses = await egressClient.listEgress({
        roomName: room,
        active: true,
        egressId,
      });
      if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
        // Stop the egress
        await egressClient.stopEgress(egressId);
        return NextResponse.json({ success: true, egressId, stop: true }, { status: 200 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
