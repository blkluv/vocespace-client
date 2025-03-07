import {
  isTrackReference,
  ParticipantName,
  ParticipantTile,
  PinState,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useFeatureContext,
  useMaybeLayoutContext,
  useMaybeRoomContext,
  usePersistentUserChoices,
  VideoTrack,
} from '@livekit/components-react';
import { ConnectionQuality, Room, Track } from 'livekit-client';
import { HTMLAttributes, useCallback, useEffect, useRef, useState } from 'react';
import { isTrackReferencePlaceholder } from '../video_container';
import { publisher, SubjectKey, subscriber } from '@/lib/std/chanel';
import styles from '@/styles/participant.module.scss';
import { use_add_user_device } from '@/lib/hooks/store/user_choices';
import { useVideoBlur } from '@/lib/std/device';
import { SvgResource } from '../../pre_join/resources';
import { Button } from 'antd';

interface ParticipantItemProps extends HTMLAttributes<HTMLDivElement> {
  trackRef?: TrackReferenceOrPlaceholder;
}

export function ParticipantItem({ trackRef, ...htmlProps }: ParticipantItemProps) {
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: false, preventLoad: false });
  const room = useMaybeRoomContext();
  // [refs] ------------------------------------------------------------------
  const video_track_ref = useRef<HTMLVideoElement>(null);
  // [states] -----------------------------------------------------------------
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);
  const [video_enabled, set_video_enabled] = useState(userChoices.videoEnabled);

  const add_derivce_settings = use_add_user_device(
    room?.localParticipant.name || userChoices.username,
  );
  const { blurValue, setVideoBlur } = useVideoBlur({
    videoRef: video_track_ref,
    initialBlur: add_derivce_settings.video.blur,
  });

  const [screen_enabled, set_screen_enabled] = useState(add_derivce_settings.screen.enabled);
  const trackReference = useEnsureTrackRef(trackRef);
  const layoutContext = useMaybeLayoutContext();
  const autoManageSubscription = useFeatureContext()?.autoSubscription;
  const handleSubscribe = useCallback(
    (subscribed: boolean) => {
      if (
        trackReference.source &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isTrackReferencePinned(trackReference, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [trackReference, layoutContext],
  );

  // [toggle state] -----------------------------------------------------
  // - [audio] ----------------------------------------------------------
  const handleAudioStateChange = useCallback((enabled: boolean) => {
    console.warn('接收到音频状态变化:', enabled);
    if (room) {
      set_audio_enabled(enabled);
      saveAudioInputEnabled(enabled);
      enableAudioTrack(room, enabled);
    }
  }, []);
  // - [video] ----------------------------------------------------------
  const handleVideoStateChange = useCallback((enabled: boolean) => {
    console.warn('接收到视频状态变化:', enabled);
    if (room) {
      set_video_enabled(enabled);
      saveVideoInputEnabled(enabled);
      enableVideoTrack(room, enabled);
    }
  }, []);
  // - [screen] ---------------------------------------------------------
  const handleScreenStateChange = useCallback((enabled: boolean) => {
    console.warn('接收到屏幕状态变化:', enabled);

    if (room && enabled) {
      set_screen_enabled(enabled);
      enableScreenTrack(room, enabled);
    }
  }, []);

  useEffect(() => {
    const audio_subscription = subscriber(SubjectKey.Audio, handleAudioStateChange);
    const video_subscription = subscriber(SubjectKey.Video, handleVideoStateChange);
    const screen_subscription = subscriber(SubjectKey.Screen, handleScreenStateChange);
    return () => {
      audio_subscription?.unsubscribe();
      video_subscription?.unsubscribe();
      screen_subscription?.unsubscribe();
    };
  }, [handleAudioStateChange, handleVideoStateChange, handleScreenStateChange]);

  // [focus] -------------------------------------------------------------
  const focus_on = () => {
    // 发布焦点事件
    publisher(SubjectKey.Focus, {
      track_ref: trackReference,
      video_blur: add_derivce_settings.video.blur,
    });
  };

  // 监听状态变化
  useEffect(() => {
    console.warn('audio_enabled 状态实际变化为:', audio_enabled);
  }, [audio_enabled]);

  return (
    <ParticipantTile {...htmlProps} className={styles.tile}>
      {isTrackReference(trackReference) && video_enabled && (
        // <AudioTrack trackRef={trackReference} muted={!audio_enabled} />
        <VideoTrack
          ref={video_track_ref}
          trackRef={trackReference}
          style={{
            filter: `blur(${blurValue}px)`,
          }}
        ></VideoTrack>
      )}
      <div className={styles.tile_name}>
        <ParticipantName></ParticipantName>
        <div className={styles.tile_name_tools}>
          <Button
            type="text"
            size="small"
            style={{ backgroundColor: 'transparent' }}
            onClick={focus_on}
          >
            <SvgResource svgSize={16} type="focus"></SvgResource>
          </Button>
          <SvgResource svgSize={16} type="wave"></SvgResource>
        </div>
      </div>
    </ParticipantTile>
  );
}

/**
 * Check if the `TrackReference` is pinned.
 */
export function isTrackReferencePinned(
  trackReference: TrackReferenceOrPlaceholder,
  pinState: PinState | undefined,
): boolean {
  if (typeof pinState === 'undefined') {
    return false;
  }
  if (isTrackReference(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        isTrackReference(pinnedTrackReference) &&
        pinnedTrackReference.publication.trackSid === trackReference.publication.trackSid,
    );
  } else if (isTrackReferencePlaceholder(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        isTrackReferencePlaceholder(pinnedTrackReference) &&
        pinnedTrackReference.source === trackReference.source,
    );
  } else {
    return false;
  }
}

/// 开启｜静音 音频轨道
function enableAudioTrack(room: Room, enabled: boolean) {
  const audioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
  if (audioTrack) {
    enabled ? audioTrack.unmute() : audioTrack.mute();
  } else {
    if (room.localParticipant.connectionQuality != ConnectionQuality.Unknown) {
      room.localParticipant.setMicrophoneEnabled(enabled);
    }
  }
}

function enableVideoTrack(room: Room, enabled: boolean) {
  const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
  if (videoTrack) {
    enabled ? videoTrack.unmute() : videoTrack.mute();
  } else {
    if (room.localParticipant.connectionQuality != ConnectionQuality.Unknown) {
      room.localParticipant.setCameraEnabled(enabled);
    }
  }
}

function enableScreenTrack(room: Room, enabled: boolean) {
  const screenTrack = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
  if (screenTrack) {
    enabled ? screenTrack.unmute() : screenTrack.mute();
  } else {
    if (!enabled) {
      return;
    }

    if (room.localParticipant.connectionQuality != ConnectionQuality.Unknown && enabled) {
      room.localParticipant.setScreenShareEnabled(enabled);
    }
  }
}
