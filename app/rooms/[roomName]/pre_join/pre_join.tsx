import { Option } from '@/lib/std';
import styles from '@/styles/pre_join.module.scss';
import {
  LocalUserChoices,
  usePersistentUserChoices,
  usePreviewTracks,
} from '@livekit/components-react';
import {
  facingModeFromLocalTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  Track,
  TrackProcessor,
} from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SvgResource } from './resources';
import { Button, Input, Slider, Switch } from 'antd';
import { DevicesSelector } from '@/app/api/devices/device_selector';
import { count_video_blur, default_device, MediaDeviceKind } from '@/lib/std/device';
import { ScreenPreview } from '@/app/api/devices/screen_preview';
import { use_add_user_device, use_stored_set } from '@/lib/hooks/store/user_choices';

/**
 * The PreJoin Page component should use before user enter into the room.
 * @override livekit-react/PreJoin
 * @author syf20020816
 */
export function PreJoin({
  defaults = {},
  persistUserChoices = true,
  videoProcessor,
  onSubmit,
  onError,
}: PreJoinProps) {
  // [ref] ----------------------------------------------------------------
  const audio_ref = useRef();
  const audio_play_ref = useRef<HTMLAudioElement>(null);
  // [user choices] ----------------------------------------------------------------
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({
    defaults: defaults,
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  });

  const [user_choices, set_user_choices] = useState(initialUserChoices);
  const [device_settings, set_device_settings] = useState(
    use_add_user_device(user_choices.username),
  );
  // [enables] ---------------------------------------------------------------------
  const [audio_enabled, set_audio_enabled] = useState(true);
  const [video_enabled, set_video_enabled] = useState(true);
  const [audio_device_id, set_audio_device_id] = useState(user_choices.audioDeviceId);
  const [video_device_id, set_video_device_id] = useState(user_choices.videoDeviceId);
  const [username, set_username] = useState(user_choices.username);
  // [tracks] ---------------------------------------------------------------------
  const tracks = usePreviewTracks(
    {
      audio: audio_enabled ? { deviceId: initialUserChoices.audioDeviceId } : false,
      video: video_enabled
        ? { deviceId: initialUserChoices.videoDeviceId, processor: videoProcessor }
        : false,
    },
    onError,
  );

  const audio_track = useMemo<LocalAudioTrack | undefined>((): LocalAudioTrack | undefined => {
    return tracks?.filter((track) => track.kind === Track.Kind.Audio)[0] as LocalAudioTrack;
  }, [tracks]);
  // [other settings] -------------------------------------------------------------
  const [video_blur, set_video_blur] = useState(device_settings.video.blur);
  const [screen_blur, set_screen_blur] = useState(device_settings.screen.blur);
  const [volume_self, set_volume_self] = useState(device_settings.microphone.self);
  const [volume_others, set_volume_others] = useState(device_settings.microphone.other);
  // [save user choices] ----------------------------------------------------------------
  useEffect(() => {
    saveAudioInputEnabled(audio_enabled);
  }, [audio_enabled, saveAudioInputEnabled]);

  useEffect(() => {
    saveVideoInputEnabled(video_enabled);
  }, [video_enabled, saveVideoInputEnabled]);

  useEffect(() => {
    saveAudioInputDeviceId(audio_device_id);
  }, [audio_device_id, saveAudioInputDeviceId]);

  useEffect(() => {
    saveVideoInputDeviceId(video_device_id);
  }, [video_device_id, saveVideoInputDeviceId]);

  useEffect(() => {
    saveUsername(username);
  }, [username, saveUsername]);
  // [about video] ----------------------------------------------------------------
  const video_ref = useRef(null);
  const video_el = useRef<HTMLVideoElement>(null);
  const video_track = useMemo<LocalVideoTrack | undefined>((): LocalVideoTrack | undefined => {
    return tracks?.filter((track) => track.kind === Track.Kind.Video)[0] as LocalVideoTrack;
  }, [tracks]);

  const facing_mode = useMemo(() => {
    if (video_track) {
      const { facingMode } = facingModeFromLocalTrack(video_track);
      return facingMode;
    } else {
      return 'undefined';
    }
  }, [video_track]);

  useEffect(() => {
    if (video_el.current && video_track) {
      video_track.unmute();
      video_track.attach(video_el.current);
    }

    return () => {
      video_track?.detach();
    };
  }, [video_track]);

  // [switch for audio and video] -------------------------------------------------
  const enable_audio = (e: boolean) => {
    set_audio_enabled(e);
  };
  // [start meeting] --------------------------------------------------------------
  const start_meeting = () => {
    // do validate
    if (username !== '') {
      // 这里除了需要跳转进入房间，还需要将用户的非livekit管理的其他信息存储到localStorage中
      // 以便下次进入时可以直接使用
      use_stored_set(username, {
        device: {
          microphone: {
            enabled: audio_enabled,
            self: volume_self,
            other: volume_others,
          },
          video: {
            enabled: video_enabled,
            blur: video_blur,
          },
          screen: {
            enabled: false,
            blur: screen_blur,
          },
        },
      });

      // do on submit to room
      if (onSubmit) {
        onSubmit(user_choices);
      } else {
        // show err
        onError ? onError(new Error('onSubmit is not defined')) : alert('onSubmit is not defined');
      }
    } else {
      onError
        ? onError(new Error('Please enter your username'))
        : alert('Please enter your username');
    }
  };

  // set new user choices for livekit
  useEffect(() => {
    const new_user_choices = {
      username: username,
      videoEnabled: video_enabled,
      videoDeviceId: video_device_id,
      audioEnabled: audio_enabled,
      audioDeviceId: audio_device_id,
    };
    set_user_choices(new_user_choices);
  }, [username, video_enabled, video_device_id, audio_enabled, audio_device_id]);

  // [reset settings] -------------------------------------------------------------
  const reset_settings = () => {
    set_video_blur(0.15);
    set_screen_blur(0.15);
    set_volume_self(100);
    set_volume_others(20);
    set_audio_enabled(true);
    set_video_enabled(true);
    set_username('');
  };
  // [play] ------------------------------------------------------------------------
  const play_sound = (play: Play) => {
    if (!audio_play_ref) return;

    let volume = 0;
    if (play === Play.AudioSelf) {
      volume = volume_self;
    } else {
      volume = volume_others;
    }

    if (audio_play_ref.current?.paused) {
      audio_play_ref.current.currentTime = 0;
      audio_play_ref.current.volume = volume / 100.0;
      audio_play_ref.current?.play();
    } else {
      audio_play_ref.current?.pause();
    }
  };

  return (
    <div className={styles.pre_join}>
      <header className={styles['pre_join_header']}>
        <h1>Join Voce Space</h1>
        <h3>Please set up your device and personal information</h3>
      </header>
      <main className={styles['pre_join_main']}>
        <div className={styles['pre_join_main_device']}>
          <div className={styles['pre_join_main_device_left']}>
            <div>
              <header>
                <div className={styles['pre_join_main_device_tool']}>
                  <SvgResource type="audio" />
                  <span>Audio</span>
                </div>
                <Switch
                  defaultChecked={audio_enabled}
                  className={styles.remove_bg}
                  value={audio_enabled}
                  onChange={enable_audio}
                ></Switch>
              </header>
              <div className={styles.adjust_settings}>
                <div className="flex_box">
                  <div>Microphone volume for self:</div>
                  <Button
                    style={{ padding: '0' }}
                    type="text"
                    onClick={() => {
                      play_sound(Play.AudioSelf);
                    }}
                  >
                    <SvgResource type="play"></SvgResource>
                  </Button>
                </div>

                <Slider
                  min={0.0}
                  max={100.0}
                  step={1}
                  value={volume_self}
                  defaultValue={100}
                  className={styles.common_space}
                  onChange={(e) => set_volume_self(e)}
                />
              </div>
              <div className={styles.adjust_settings}>
                <div className="flex_box">
                  <div>Microphone volume for others:</div>
                  <Button
                    style={{ padding: '0' }}
                    type="text"
                    onClick={() => {
                      play_sound(Play.AudioOthers);
                    }}
                  >
                    <SvgResource type="play"></SvgResource>
                  </Button>
                </div>
                <Slider
                  min={0.0}
                  max={100.0}
                  step={1}
                  value={volume_others}
                  defaultValue={20}
                  className={styles.common_space}
                  onChange={(e) => set_volume_others(e)}
                />
              </div>
              <div className={styles.adjust_settings}>
                <div>Microphone selection:</div>
                <DevicesSelector
                  ref={audio_ref}
                  enabled={audio_enabled}
                  track={audio_track}
                  err={onError}
                  kind={MediaDeviceKind.AudioInput}
                ></DevicesSelector>
              </div>
            </div>
            <div>
              <header>
                <div className={styles['pre_join_main_device_tool']}>
                  <SvgResource type="video" />
                  <span>Video</span>
                </div>
                <Switch
                  defaultChecked={video_enabled}
                  className={styles.remove_bg}
                  value={video_enabled}
                  onChange={(e) => {
                    set_video_enabled(e);
                  }}
                ></Switch>
              </header>
              <div className={styles.adjust_settings}>
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
                  }}
                />
              </div>
              <div className={styles.adjust_settings}>
                <div>Video selection:</div>
                <DevicesSelector
                  ref={video_ref}
                  enabled={video_enabled}
                  track={video_track}
                  err={onError}
                  kind={MediaDeviceKind.VideoInput}
                ></DevicesSelector>
              </div>
            </div>
            <div>
              <header>
                <div className={styles['pre_join_main_device_tool']}>
                  <SvgResource type="user" />
                  <span>Username</span>
                </div>
              </header>
              <Input
                style={{ marginTop: '24px', color: '#000' }}
                placeholder="Please enter your username"
                value={username}
                onChange={(e) => set_username(e.target.value)}
              />
            </div>
          </div>
          <div className={styles['pre_join_main_device_right']}>
            <div className={styles['pre_join_main_device_right_video']}>
              {video_track && video_enabled && (
                <video
                  style={{
                    height: '100%',
                    width: '100%',
                    filter: `blur(${count_video_blur(video_blur, {
                      height: video_el.current?.height || 360,
                      width: video_el.current?.width || 320,
                    })}px)`,
                  }}
                  ref={video_el}
                  data-lk-facing-mode={facing_mode}
                />
              )}
              {(!video_track || !video_enabled) && (
                <div className={styles['pre_join_main_device_right_video_empty']}>
                  <img
                    height={48}
                    src={`/images/vocespace.svg`}
                    alt=""
                  />
                  <p>Video Share</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles['pre_join_main_info']}></div>
      </main>
      <footer>
        <button className={styles.settings_reset} onClick={reset_settings}>
          Reset Settings
        </button>
        <Button
          type="primary"
          style={{
            width: '40%',
            fontSize: '16px',
            padding: '20px',
            maxWidth: '320px',
          }}
          onClick={start_meeting}
        >
          Join Meeting
        </Button>
      </footer>
      <audio
        ref={audio_play_ref}
        src={`/audios/pre_test.mp3`}
        style={{ display: 'none' }}
      ></audio>
    </div>
  );
}

interface PreJoinProps {
  defaults?: Option<LocalUserChoices>;
  persistUserChoices?: boolean;
  videoProcessor?: TrackProcessor<Track.Kind.Video>;
  onError?: (error: Error) => void;
  onSubmit?: (values: LocalUserChoices) => void;
}

enum Play {
  AudioSelf = 'audio-self',
  AudioOthers = 'audio-others',
}
