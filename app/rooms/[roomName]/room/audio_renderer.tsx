import { use_add_user_device } from '@/lib/hooks/store/user_choices';
import { default_device } from '@/lib/std/device';
import { RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import { useEffect, useState } from 'react';

/**
 * ## AudioRenderer
 * override the default audio renderer to use the user's settings
 */
export function AudioRenderer() {
  // [userinfos] ------------------------------------------------------------------------------
  const [device_settings, set_device_settings] = useState(default_device());
  useEffect(() => {
    set_device_settings(use_add_user_device());
  }, []);

  return (
    <RoomAudioRenderer
      volume={device_settings.microphone.other / 100.0}
      muted={device_settings.microphone.enabled}
    />
  );
}
