import { DisconnectButton, LeaveIcon, usePersistentUserChoices, VideoConference } from '@livekit/components-react';
import styles from '@/styles/controls/controls.module.scss';
import { AudioToggle } from './controls/audio_toggle';
import { VideoToggle } from './controls/video_toggle';
import { ScreenToggle } from './controls/screen_toggle';
import { Track } from 'livekit-client';
import { useCallback, useState } from 'react';

export function Controls({ saveUserChoices = true }) {
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  // [states]
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);

  const audio_on_clicked = useCallback((enabled: boolean): void => {
    const new_state = !enabled;
    set_audio_enabled(new_state);
    saveAudioInputEnabled(new_state);
  }, [saveAudioInputEnabled]);

  return (
    <div className={styles.controls}>
      <div className={styles.controls_left}>
        <AudioToggle enabled={audio_enabled} onClicked={audio_on_clicked}></AudioToggle>
        <VideoToggle></VideoToggle>
        <ScreenToggle></ScreenToggle>
      </div>
      <div className={styles.controls_right}>
        <DisconnectButton>
          <LeaveIcon />
        </DisconnectButton>
      </div>
    </div>
  );
}
