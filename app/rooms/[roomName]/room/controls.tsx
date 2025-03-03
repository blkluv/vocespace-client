import { DisconnectButton, LeaveIcon } from '@livekit/components-react';
import styles from '@/styles/controls/controls.module.scss';
import { AudioToggle } from './controls/audio_toggle';
import { VideoToggle } from './controls/video_toggle';
import { ScreenToggle } from './controls/screen_toggle';

export function Controls() {
  return (
    <div className={styles.controls}>
      <div className={styles.controls_left}>
        <AudioToggle></AudioToggle>
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
