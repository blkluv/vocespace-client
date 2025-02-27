import {
  isTrackReference,
  ParticipantLoop,
  TrackLoop,
  TrackReferenceOrPlaceholder,
  useCreateLayoutContext,
  useParticipants,
  usePinnedTracks,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useRef } from 'react';

export function ScreenTrack() {
  const tracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

  const screen_track = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare)[0];
  const participants = useParticipants();
  return (
    <>
      {screen_track ? (
        <TrackLoop tracks={tracks}>
          <ParticipantLoop participants={participants}>
            <VideoTrack trackRef={screen_track}></VideoTrack>
          </ParticipantLoop>
        </TrackLoop>
      ) : (
        <div>
          <h1>Screen Share</h1>
        </div>
      )}
    </>
  );
}

// export function ScreenSharer(){
//     const last_fouce_screen_track = useRef<TrackReferenceOrPlaceholder | null>(null);
//     const layoutContext = useCreateLayoutContext();
//     const focusTrack = usePinnedTracks(layoutContext)?.[0];
//     // [track for screen sharing] ------------------------------------------------
//     const track = useTracks([
//         {source: Track.Source.ScreenShare, withPlaceholder: false}
//     ]);

//     const screen_share_track = track.filter(
//         isTrackReference
//     )
//     .filter((track) => track.publication.source === Track.Source.ScreenShare);

//     useEffect(()=> {
//         if (
//             screen_share_track.some((track) => track.publication.isSubscribed) &&
//             last_fouce_screen_track.current === null
//         ){
//             alert(`Auto set screen share focus: ${screen_share_track[0]}`);

//         }else if(
//             last_fouce_screen_track.current&&
//             !screen_share_track.some(
//                 (track) =>
//                   track.publication.trackSid ===
//                   last_fouce_screen_track.current?.publication?.trackSid,
//               )

//         ){
//             alert('Auto clearing screen share focus.');
//             last_fouce_screen_track.current = null;
//         }

//         if ()

//     }, [
//         screen_share_track
//       .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
//       .join(),
//     ])

//     return (

//     );
// }
