import {
  DisconnectButton,
  LeaveIcon,
  usePersistentUserChoices,
  VideoConference,
  RoomContext,
  RoomName,
  ControlBarControls,
  useLocalParticipantPermissions,
  ChatToggle,
  ChatIcon,
} from '@livekit/components-react';
import styles from '@/styles/controls.module.scss';
import { AudioToggle } from './controls/audio_toggle';
import { VideoToggle } from './controls/video_toggle';
import { ScreenToggle } from './controls/screen_toggle';
import { ConnectionState, Room, Track } from 'livekit-client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { publisher, subject_map, SubjectKey } from '@/lib/std/chanel';
import { SettingToggle } from './controls/setting_toggle';
import { Button, Drawer, message, Slider } from 'antd';
import { SvgResource } from '../pre_join/resources';
import { use_add_user_device, use_stored_set } from '@/lib/hooks/store/user_choices';
import { AddDeviceInfo, useVideoBlur } from '@/lib/std/device';

export function Controls({
  room,
  saveUserChoices = true,
  controls,
}: {
  room?: Room;
  saveUserChoices?: boolean;
  controls?: ControlBarControls;
}) {
  // [hooks] -----------------------------------------------------------------
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });
  const add_derivce_settings = use_add_user_device(userChoices.username);
  const video_track_ref = useRef<HTMLImageElement>(null);
  // [states] -----------------------------------------------------------------
  const [messageApi, contextHolder] = message.useMessage();
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);
  const [video_enabled, set_video_enabled] = useState(userChoices.videoEnabled);
  const [screen_enabled, set_screen_enabled] = useState(add_derivce_settings.screen.enabled);
  const [setting_visible, set_setting_visible] = useState(false);
  const [volume, set_volume] = useState(add_derivce_settings.microphone.other);
  const [video_blur, set_video_blur] = useState(add_derivce_settings.video.blur);
  const [screen_blur, set_screen_blur] = useState(add_derivce_settings.screen.blur);

  const visibleControls = { leave: true, ...controls };
  const localPermissions = useLocalParticipantPermissions();

  if (!localPermissions) {
    visibleControls.camera = false;
    visibleControls.chat = false;
    visibleControls.microphone = false;
    visibleControls.screenShare = false;
  } else {
    visibleControls.camera ??= localPermissions.canPublish;
    visibleControls.microphone ??= localPermissions.canPublish;
    visibleControls.screenShare ??= localPermissions.canPublish;
    visibleControls.chat ??= localPermissions.canPublishData && controls?.chat;
  }

  const { blurValue, setVideoBlur } = useVideoBlur({
    videoRef: video_track_ref,
    initialBlur: add_derivce_settings.video.blur,
  });

  // [toggle click handlers] -------------------------------------------------
  // - [audio] ---------------------------------------------------------------
  const audio_on_clicked = useCallback(
    (enabled: boolean): void => {
      if (room && room.state === ConnectionState.Connected) {
        const new_state = !enabled;
        set_audio_enabled(new_state);
        saveAudioInputEnabled(new_state);
        new_state && saveAudioInputDeviceId(userChoices.audioDeviceId);
        // 发布事件
        publisher(SubjectKey.Audio, new_state);
      }
    },
    [saveAudioInputEnabled, saveAudioInputDeviceId],
  );
  // - [video] ---------------------------------------------------------------
  const video_on_clicked = useCallback(
    (enabled: boolean): void => {
      if (room && room.state === ConnectionState.Connected) {
        const new_state = !enabled;
        set_video_enabled(new_state);
        saveVideoInputEnabled(new_state);
        new_state && saveVideoInputDeviceId(userChoices.videoDeviceId);
        // 发布事件
        publisher(SubjectKey.Video, new_state);
      }
    },
    [saveVideoInputEnabled, saveVideoInputDeviceId],
  );
  // - [screen] --------------------------------------------------------------
  const screen_on_clicked = useCallback(
    (enabled: boolean): void => {
      if (room && room.state === ConnectionState.Connected) {
        const new_state = !enabled;
        set_screen_enabled(new_state);
        add_derivce_settings.screen.enabled = new_state;
        // 发布事件
        publisher(SubjectKey.Screen, new_state);
      }
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

  const save_changes = () => {
    let username = userChoices.username;
    let data = Object.assign(add_derivce_settings, {
      microphone: {
        other: volume,
      },
      video: {
        blur: video_blur,
      },
      screen: {
        blur: screen_blur,
      },
    }) as AddDeviceInfo;
    use_stored_set(username, { device: data });
    set_setting_visible(false);
    // 发布事件
    publisher(SubjectKey.Setting, data);

    messageApi.success('Changes saved successfully');
  };

  return (
    <div className={styles.controls}>
      {contextHolder}
      <div className={styles.controls_left}>
        <AudioToggle enabled={audio_enabled} onClicked={audio_on_clicked}></AudioToggle>
        <VideoToggle enabled={video_enabled} onClicked={video_on_clicked}></VideoToggle>
        <ScreenToggle enabled={screen_enabled} onClicked={screen_on_clicked}></ScreenToggle>
        <SettingToggle enabled={setting_visible} onClicked={setting_on_clicked}></SettingToggle>
        {visibleControls.chat && (
          <ChatToggle>
            <ChatIcon /> Chat
          </ChatToggle>
        )}
      </div>
      <div className={styles.controls_right}>
        <DisconnectButton>
          <LeaveIcon />
        </DisconnectButton>
      </div>
      <Drawer
        style={{ backgroundColor: '#1e1e1e', padding: 0 }}
        title="Settings"
        placement="right"
        closable={false}
        width={'40%'}
        open={setting_visible}
        extra={setting_drawer_header({
          on_clicked: () => set_setting_visible(false),
        })}
      >
        <div className={styles.setting_container}>
          <div className={styles.setting_box}>
            <div>Microphone volume for self:</div>
            <Slider
              defaultValue={volume}
              className={styles.common_space}
              onChange={(e) => set_volume(e)}
            />
          </div>

          <div className={styles.setting_box}>
            <span>Video Blur:</span>
            <Slider
              defaultValue={0.15}
              className={`${styles.common_space} ${styles.slider}`}
              value={video_blur}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) => {
                set_video_blur(e);
                setVideoBlur(e);
              }}
            />
          </div>
          <div className={styles.setting_box}>
            <span>Screen Blur:</span>
            <Slider
              defaultValue={0.15}
              className={`${styles.common_space} ${styles.slider}`}
              value={screen_blur}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) => {
                set_screen_blur(e);
                setVideoBlur(e);
              }}
            />
          </div>
          <div className={styles.setting_box} style={{overflow: 'hidden'}}> 
            <div>Blur Test:{Math.round(blurValue)}px</div>
            <img
              ref={video_track_ref}
              src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/blur_test.png`}
              height="220"
              style={{ marginBottom: '16px', filter: `blur(${blurValue}px)`, overflow: 'hidden' }}
            />
          </div>

          <div className={styles.setting_container_footer}>
            <Button type="primary" onClick={save_changes}>
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

const setting_drawer_header = ({ on_clicked }: { on_clicked: () => void }): ReactNode => {
  return (
    <div>
      <Button type="text" shape="circle" onClick={on_clicked}>
        <SvgResource type="close" color="#fff" svgSize={16}></SvgResource>
      </Button>
    </div>
  );
};
