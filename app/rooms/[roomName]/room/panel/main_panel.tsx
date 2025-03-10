import {
  isTrackReference,
  TrackReferenceOrPlaceholder,
  VideoTrack,
} from '@livekit/components-react';
import styles from '@/styles/main_panel.module.scss';
import { Room, Track } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SubjectKey, subscriber } from '@/lib/std/chanel';
import { ScreenFocus, useVideoBlur } from '@/lib/std/device';
/**
 * # Main panel for the room
 * 主面板是位于房间中心区域的主要显示区域，用于显示主要内容。
 * 在主面板中通常会显示：
 * 1. 演讲者视频（若未开启屏幕分享，但开启了视频分享，并基于权限，允许视频作为主面板）
 * 2. 屏幕分享（若开启了屏幕分享，且权限允许的情况下）
 * 3. 素材（若房间的owner在构建房间时提供了主面板素材）
 * 4. 房间信息（房间名称、房间号、房间密码、房间创建者、房间创建时间等）(当前版本进行实现)
 */
export function MainPanel({ room, initialTrack }: { room: Room, initialTrack: TrackReferenceOrPlaceholder }) {
  const video_track_ref = useRef<HTMLVideoElement>(null);
  const [focus, set_focus] = useState(false);
  const [track, set_track] = useState<TrackReferenceOrPlaceholder| undefined>(initialTrack);
  const { blurValue, setVideoBlur } = useVideoBlur({
    videoRef: video_track_ref,
    initialBlur: 0,
  });

  const handleFocus = useCallback(
    ({ track_ref, video_blur }: ScreenFocus) => {
      set_focus(true);
      set_track(track_ref);
      setVideoBlur(video_blur || 0);
    },
    [set_focus, set_track, setVideoBlur],
  );
  // - [video] ----------------------------------------------------------
  const handleVideoStateChange = useCallback((enabled: boolean) => {
    if (!enabled) {
      set_focus(false);
    }
  }, []);
  // - [screen] ---------------------------------------------------------
  const handleScreenStateChange = useCallback((enabled: boolean) => {
    if (!enabled) {
      set_focus(false);
    }
  }, []);

  useEffect(() => {
    const video_subscription = subscriber(SubjectKey.Video, handleVideoStateChange);
    const screen_subscription = subscriber(SubjectKey.Screen, handleScreenStateChange);
    const subscription = subscriber(SubjectKey.Focus, handleFocus);
    return () => {
      subscription?.unsubscribe();
      video_subscription?.unsubscribe();
      screen_subscription?.unsubscribe();
    };
  }, [handleFocus]);

  return (
    <div className={styles.main_panel}>
      {focus &&
      isTrackReference(track) &&
      (track.source == Track.Source.ScreenShare || track?.source == Track.Source.Camera) ? (
        <VideoTrack
          ref={video_track_ref}
          trackRef={track}
          style={{
            filter: `blur(${blurValue}px)`,
          }}
        ></VideoTrack>
      ) : (
        <div>
          Main Panel
          <p>Room Id: {room.name}</p>
        </div>
      )}
    </div>
  );
}
