import {
  DisconnectButton,
  LeaveIcon,
  usePersistentUserChoices,
  VideoConference,
  RoomContext,
  RoomName,
} from '@livekit/components-react';
import styles from '@/styles/controls.module.scss';
import { AudioToggle } from './controls/audio_toggle';
import { VideoToggle } from './controls/video_toggle';
import { ScreenToggle } from './controls/screen_toggle';
import { Track } from 'livekit-client';
import { ReactNode, useCallback, useState } from 'react';
import { publisher, subject_map, SubjectKey } from '@/lib/std/chanel';
import { SettingToggle } from './controls/setting_toggle';
import { Button, Drawer } from 'antd';
import { SvgResource } from '../pre_join/resources';
import { use_add_user_device } from '@/lib/hooks/store/user_choices';

export function Controls({ saveUserChoices = true }) {
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });
  const add_derivce_settings = use_add_user_device(userChoices.username);
  // [states] -----------------------------------------------------------------
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);
  const [video_enabled, set_video_enabled] = useState(userChoices.videoEnabled);
  const [screen_enabled, set_screen_enabled] = useState(add_derivce_settings.screen.enabled);
  const [setting_visible, set_setting_visible] = useState(false);

  // [toggle click handlers] -------------------------------------------------
  // - [audio] ---------------------------------------------------------------
  const audio_on_clicked = useCallback(
    (enabled: boolean): void => {
      const new_state = !enabled;
      set_audio_enabled(new_state);
      saveAudioInputEnabled(new_state);
      new_state && saveAudioInputDeviceId(userChoices.audioDeviceId);
      // 发布事件
      publisher(SubjectKey.Audio, new_state);
    },
    [saveAudioInputEnabled, saveAudioInputDeviceId],
  );
  // - [video] ---------------------------------------------------------------
  const video_on_clicked = useCallback(
    (enabled: boolean): void => {
      const new_state = !enabled;
      set_video_enabled(new_state);
      saveVideoInputEnabled(new_state);
      new_state && saveVideoInputDeviceId(userChoices.videoDeviceId);
      // 发布事件
      publisher(SubjectKey.Video, new_state);
    },
    [saveVideoInputEnabled, saveVideoInputDeviceId],
  );
  // - [screen] --------------------------------------------------------------
  const screen_on_clicked = useCallback(
    (enabled: boolean): void => {
      const new_state = !enabled;
      set_screen_enabled(new_state);
      add_derivce_settings.screen.enabled = new_state;
      // 发布事件
      publisher(SubjectKey.Screen, new_state);
    },
    [saveVideoInputEnabled],
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
        <VideoToggle enabled={video_enabled} onClicked={video_on_clicked}></VideoToggle>
        <ScreenToggle enabled={screen_enabled} onClicked={screen_on_clicked}></ScreenToggle>
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
        height={'70%'}
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
