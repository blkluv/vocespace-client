import {
  AudioTrack,
  isTrackReference,
  ParticipantPlaceholder,
  ParticipantTile,
  ParticipantTileProps,
  useEnsureTrackRef,
  useFeatureContext,
  useMaybeLayoutContext,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { isTrackReferencePinned } from './tile';
import { ParticipantSettings, RoomSettings } from '@/lib/std/room';
import { useVideoBlur } from '@/lib/std/device';

export interface ParticipantTileMiniProps extends ParticipantTileProps {
  participants?: ParticipantSettings[];
  settings: RoomSettings;
}

export const ParticipantTileMini = forwardRef<HTMLDivElement, ParticipantTileMiniProps>(
  ({ trackRef, participants, settings }: ParticipantTileMiniProps, ref) => {
    const trackReference = useEnsureTrackRef(trackRef);
    const videoRef = useRef<HTMLVideoElement>(null);
    const layoutContext = useMaybeLayoutContext();
    const autoManageSubscription = useFeatureContext()?.autoSubscription;

    const { blurValue, setVideoBlur } = useVideoBlur({
      videoRef,
      initialBlur: 0.0,
    });

    useEffect(() => {
      if (settings.participants && Object.keys(settings.participants).length > 0) {
        if (trackReference.source === Track.Source.Camera) {
          setVideoBlur(settings.participants[trackReference.participant.identity]?.blur ?? 0.0);
        } else {
          setVideoBlur(
            settings.participants[trackReference.participant.identity]?.screenBlur ?? 0.0,
          );
        }
        // setLoading(false);
      }
    }, [settings.participants, trackReference]);

    const videoFilter = useMemo(() => {
      return settings.participants[trackReference.participant.identity]?.virtual?.enabled ?? false
        ? `none`
        : `blur(${blurValue}px)`;
    }, [settings.participants, trackReference.participant.identity, blurValue]);

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

    const deviceTrack = useMemo(() => {
      if (isTrackReference(trackReference)) {
        if (
          trackReference.source === Track.Source.Camera ||
          trackReference.source === Track.Source.ScreenShare
        ) {
          return (
            <VideoTrack
              ref={videoRef}
              style={{
                WebkitFilter: videoFilter,
                filter: videoFilter,
                transition: 'filter 0.2s ease-in-out',
                zIndex: '11',
              }}
              trackRef={trackReference}
              onSubscriptionStatusChanged={handleSubscribe}
              manageSubscription={autoManageSubscription}
            />
          );
        } else {
          return (
            <AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
          );
        }
      }
    }, [trackReference, videoRef, videoFilter]);

    return (
      <ParticipantTile ref={ref} trackRef={trackReference}>
        {deviceTrack}
        <div className="lk-participant-placeholder" style={{ border: '1px solid #111' }}>
          <ParticipantPlaceholder />
        </div>
      </ParticipantTile>
    );
  },
);
