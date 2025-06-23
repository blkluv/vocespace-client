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
import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { isTrackReferencePinned } from './tile';
import { ParticipantSettings } from '@/lib/std/room';

export interface ParticipantTileMiniProps extends ParticipantTileProps {
  participants?: ParticipantSettings[];
}

export const ParticipantTileMini = forwardRef<HTMLDivElement, ParticipantTileMiniProps>(
  ({ trackRef, participants }: ParticipantTileMiniProps, ref) => {
    const trackReference = useEnsureTrackRef(trackRef);
    const videoRef = useRef<HTMLVideoElement>(null);
    const layoutContext = useMaybeLayoutContext();
    const autoManageSubscription = useFeatureContext()?.autoSubscription;

    console.warn(trackReference.participant);

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
        if (trackReference.source === Track.Source.Camera) {
          return (
            <VideoTrack
              ref={videoRef}
              // style={{
              //   WebkitFilter: videoFilter,
              //   filter: videoFilter,
              //   transition: 'filter 0.2s ease-in-out',
              //   zIndex: '11',
              // }}
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
    }, [trackReference, videoRef]);

    

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
