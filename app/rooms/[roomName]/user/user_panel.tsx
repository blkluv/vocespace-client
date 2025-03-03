import {
  TrackRefContextIfNeeded,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  FocusLayout,
  ParticipantContextIfNeeded,
  ParticipantName,
  isTrackReference,
  VideoTrack,
  AudioTrack,
  useMaybeLayoutContext,
  PinState,
  useFeatureContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useCallback } from 'react';
import { isTrackReferencePlaceholder } from '../room/video_container';

export function UserPanel({ trackRef }: UserPanelProps) {
  const layoutContext = useMaybeLayoutContext();
  const trackReference = useEnsureTrackRef(trackRef);
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
  const autoManageSubscription = useFeatureContext()?.autoSubscription;

  return (
    <div>
      <TrackRefContextIfNeeded trackRef={trackReference}>
        <ParticipantContextIfNeeded participant={trackReference.participant}>
          {isTrackReference(trackReference) &&
          (trackReference.publication?.kind === 'video' ||
            trackReference.source === Track.Source.Camera ||
            trackReference.source === Track.Source.ScreenShare) ? (
            <VideoTrack
              trackRef={trackReference}
              onSubscriptionStatusChanged={handleSubscribe}
              manageSubscription={autoManageSubscription}
            />
          ) : (
            isTrackReference(trackReference) && (
              <AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
            )
          )}
          <ParticipantName></ParticipantName>
        </ParticipantContextIfNeeded>
      </TrackRefContextIfNeeded>
    </div>
  );
}

export interface UserPanelProps {
  trackRef?: TrackReferenceOrPlaceholder;
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
