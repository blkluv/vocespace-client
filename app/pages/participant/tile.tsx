import { isTrackReferencePlaceholder } from '@/app/devices/video_container';

import { useVideoBlur } from '@/lib/std/device';
import {
  AudioTrack,
  ConnectionQualityIndicator,
  isTrackReference,
  LockLockedIcon,
  ParticipantName,
  ParticipantPlaceholder,
  ParticipantTile,
  ParticipantTileProps,
  PinState,
  ScreenShareIcon,
  TrackMutedIndicator,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useFeatureContext,
  useIsEncrypted,
  useLocalParticipant,
  useMaybeLayoutContext,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import React, { useEffect } from 'react';
import { PName } from './name';

export function ParticipantItem({
  trackRef,
  blurs,
}: ParticipantTileProps & { blurs: Record<string, { blur: number }> }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const trackReference = useEnsureTrackRef(trackRef);
  const {localParticipant} = useLocalParticipant();
  const isEncrypted = useIsEncrypted(trackReference.participant);
  const layoutContext = useMaybeLayoutContext();
  const autoManageSubscription = useFeatureContext()?.autoSubscription;
  const { blurValue, setVideoBlur } = useVideoBlur({
    videoRef,
    initialBlur: blurs[trackReference.participant.identity]?.blur || 0,
  });
  
  useEffect(()=>{
    if (blurs && trackReference.participant.identity !== localParticipant.identity) {
      setVideoBlur(blurs[trackReference.participant.identity]?.blur || 0);
    }
  }, [blurs])

  const handleSubscribe = React.useCallback(
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

  return (
    <ParticipantTile>
      {isTrackReference(trackReference) &&
      (trackReference.publication?.kind === 'video' ||
        trackReference.source === Track.Source.Camera ||
        trackReference.source === Track.Source.ScreenShare) ? (
        <VideoTrack
          ref={videoRef}
          style={{
            filter: `blur(${blurValue}px)`,
          }}
          trackRef={trackReference}
          onSubscriptionStatusChanged={handleSubscribe}
          manageSubscription={autoManageSubscription}
        />
      ) : (
        isTrackReference(trackReference) && (
          <AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
        )
      )}
      <div className="lk-participant-placeholder">
        <ParticipantPlaceholder />
      </div>
      <div className="lk-participant-metadata">
        <div className="lk-participant-metadata-item">
          {trackReference.source === Track.Source.Camera ? (
            <>
              {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
              <TrackMutedIndicator
                trackRef={{
                  participant: trackReference.participant,
                  source: Track.Source.Microphone,
                }}
                show={'muted'}
              ></TrackMutedIndicator>
              <ParticipantName />
              
              {/* {trackReference.participant.name && (
                <PName name={trackReference.participant.name}></PName>
              )} */}
            </>
          ) : (
            <>
              <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
              <ParticipantName>&apos;s screen</ParticipantName>
            </>
          )}
        </div>
        <ConnectionQualityIndicator className="lk-participant-metadata-item" />
      </div>
    </ParticipantTile>
  );
}

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
