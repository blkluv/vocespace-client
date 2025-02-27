'use client';

import { formatChatMessageLinks, LiveKitRoom, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  Track,
  VideoPresets,
  type VideoCodec,
} from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useMemo } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { SettingsMenu } from '@/lib/SettingsMenu';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
}) {
  const worker =
    typeof window !== 'undefined' &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const keyProvider = new ExternalE2EEKeyProvider();

  const e2eePassphrase =
    typeof window !== 'undefined' ? decodePassphrase(window.location.hash.substring(1)) : undefined;
  const e2eeEnabled = !!(e2eePassphrase && worker);
  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);
  // // 订阅声音频道，当远程参与者发布音频轨道时将其他参与者音量调节到10%
  // room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  //   console.log("订阅新====================");
  //   if (track.kind === Track.Kind.Audio) {
  //     console.log("=========== 调节音量 ============");
  //     let audio_element = track.attach();
  //     document.body.appendChild(audio_element);
  //     audio_element.volume = 0.1;
  //   }
  // });

  if (e2eeEnabled) {
    keyProvider.setKey(e2eePassphrase);
    room.setE2EEEnabled(true);
  }
  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  return (
    <LiveKitRoom
      room={room}
      token={props.token}
      connectOptions={connectOptions}
      serverUrl={props.liveKitUrl}
      audio={true}
      video={true}
    >
      <VideoConference
        chatMessageFormatter={formatChatMessageLinks}
        SettingsComponent={
          process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
        }
      />
      <DebugMode logLevel={LogLevel.debug} />
    </LiveKitRoom>
  );
}
