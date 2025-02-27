import { AudioTrack, TrackReference, useLocalParticipant, useTracks } from '@livekit/components-react';
import { isLocalParticipant, Track } from 'livekit-client';

export function AudioTracker() {
  // [tracks] ------------------------------------------------------------------------------
  const tracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]).filter(
    (ref) => !isLocalParticipant(ref.participant) && ref.publication.kind === Track.Kind.Audio,
  );
  // [userinfos] ------------------------------------------------------------------------------
  const [] = use

  return <AudioRenderer tracks={tracks} />;
}

/**
 * Wrapper for rendering audio tracks base on livekit::AudioTrack
 */
function AudioRenderer({ tracks }: { tracks: TrackReference[] }) {
  return (
    <div style={{ display: 'none' }}>
      {tracks.map((trackRef) => (
        <AudioTrack
          key={trackRef.publication.trackSid}
          trackRef={trackRef}
          volume={volume}
          muted={false}
        />
      ))}
    </div>
  );
}
