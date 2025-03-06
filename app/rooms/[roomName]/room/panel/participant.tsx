import {
  AudioTrack,
  isTrackReference,
  ParticipantName,
  ParticipantTile,
  PinState,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useFeatureContext,
  useMaybeLayoutContext,
  usePersistentUserChoices,
  VideoTrack,
} from '@livekit/components-react';
import { Track, TrackEvent } from 'livekit-client';
import { HTMLAttributes, useCallback, useEffect, useState } from 'react';
import { isTrackReferencePlaceholder } from '../video_container';
import { subject_map, SubjectKey, subscriber } from '@/lib/std/chanel';
import { Subscription } from 'rxjs';

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

  // [states] -----------------------------------------------------------------
  const [audio_enabled, set_audio_enabled] = useState(userChoices.audioEnabled);

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

  const handleAudioStateChange = useCallback((enabled: boolean) => {
    console.warn('接收到音频状态变化:', enabled);
    set_audio_enabled(enabled);
    saveAudioInputEnabled(enabled);
    
    console.error(trackReference.participant);
    // if (enabled) {
    //     trackReference.participant
    // }else{
    //     trackReference.publication?.handleMuted();
    // }
  }, []);

  useEffect(() => {
    const subscription = subscriber(SubjectKey.Audio, handleAudioStateChange);
    return () => subscription?.unsubscribe();
  }, [handleAudioStateChange]);

  // 监听状态变化
  useEffect(() => {
    console.warn('audio_enabled 状态实际变化为:', audio_enabled);
  }, [audio_enabled]);

  return (
    <ParticipantTile {...htmlProps}>
      {/* {isTrackReference(trackReference) &&
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
          <AudioTrack
            trackRef={trackReference}
            muted={!audio_enabled}
          />
        )
      )} */}
      {isTrackReference(trackReference) && (
        // <AudioTrack trackRef={trackReference} muted={!audio_enabled} />
        <VideoTrack trackRef={trackReference}></VideoTrack>
      )}
      <ParticipantName></ParticipantName>
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
