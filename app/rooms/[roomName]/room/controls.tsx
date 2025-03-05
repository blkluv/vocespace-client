import {
  DisconnectButton,
  LeaveIcon,
  usePersistentUserChoices,
  VideoConference,
  RoomContext,
  RoomName,
} from '@livekit/components-react';
import styles from '@/styles/controls/controls.module.scss';
import { AudioToggle } from './controls/audio_toggle';
import { VideoToggle } from './controls/video_toggle';
import { ScreenToggle } from './controls/screen_toggle';
import { Track } from 'livekit-client';
import { ReactNode, useCallback, useState } from 'react';
import { publisher, subject_map, SubjectKey } from '@/lib/std/chanel';
import { SettingToggle } from './controls/setting_toggle';
import { Button, Drawer } from 'antd';
import { SvgResource } from '../pre_join/resources';

export function Controls({ saveUserChoices = true }) {
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  // [states] -----------------------------------------------------------------
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);
  const [setting_visible, set_setting_visible] = useState(false);

  // [toggle click handlers] -------------------------------------------------
  // - [audio] ---------------------------------------------------------------
  const audio_on_clicked = useCallback(
    (enabled: boolean): void => {
      const new_state = !enabled;
      set_audio_enabled(new_state);
      saveAudioInputEnabled(new_state);
      // - [publish] ------------------------------------------------------------
      const audio_publisher = publisher(new_state);
      subject_map.set(SubjectKey.Audio, audio_publisher);
    },
    [saveAudioInputEnabled],
  );

  // - [setting] -------------------------------------------------------------
  const setting_on_clicked = useCallback(
    (visible: boolean): void => {
      const new_state = !visible;
      set_setting_visible(new_state);
    },
    [saveAudioInputEnabled],
  );

  return (
    <div className={styles.controls}>
      <div className={styles.controls_left}>
        <AudioToggle enabled={audio_enabled} onClicked={audio_on_clicked}></AudioToggle>
        <VideoToggle></VideoToggle>
        <ScreenToggle></ScreenToggle>
        <SettingToggle enabled={setting_visible} onClicked={setting_on_clicked}></SettingToggle>
      </div>
      <div className={styles.controls_right}>
        <DisconnectButton>
          <LeaveIcon />
        </DisconnectButton>
      </div>
      <Drawer
        title="Settings"
        placement="bottom"
        closable={false}
        height={"70%"}
        open={setting_visible}
        extra={setting_drawer_header({
          on_clicked: () => set_setting_visible(false),
        })}
      >
        <p>设置：可以是房间的设置，...</p>
      </Drawer>
    </div>
  );
}

const setting_drawer_header = ({ on_clicked }: { on_clicked: () => void }): ReactNode => {
  return (
    <div>
      <Button type="text" shape="circle" onClick={on_clicked}>
        <SvgResource type="close" color="#000000" svgSize={16}></SvgResource>
      </Button>
    </div>
  );
};
