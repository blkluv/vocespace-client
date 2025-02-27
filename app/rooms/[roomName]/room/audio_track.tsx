import { use_add_user_device } from '@/lib/hooks/store/user_choices';
import { default_device } from '@/lib/std/device';
import { RoomAudioRenderer, useLocalParticipant, useTracks } from '@livekit/components-react';
import { isLocalParticipant, Track } from 'livekit-client';
import { useEffect, useState } from 'react';

export function AudioTracker() {
  // [tracks] ------------------------------------------------------------------------------
  const tracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]).filter(
    (ref) => !isLocalParticipant(ref.participant) && ref.publication.kind === Track.Kind.Audio,
  );
  // [userinfos] ------------------------------------------------------------------------------
  const {
    isMicrophoneEnabled,
    isScreenShareEnabled,
    isCameraEnabled,
    microphoneTrack,
    cameraTrack,
    lastMicrophoneError,
    lastCameraError,
    localParticipant,
  } = useLocalParticipant();

  const [device_settings, set_device_settings] = useState(default_device());
  useEffect(() => {
    if (localParticipant.name) {
      set_device_settings(use_add_user_device(localParticipant.name));
    }
  }, [localParticipant.name]);

  return (
    <RoomAudioRenderer volume={device_settings.microphone.other} muted={isMicrophoneEnabled} />
  );
}
