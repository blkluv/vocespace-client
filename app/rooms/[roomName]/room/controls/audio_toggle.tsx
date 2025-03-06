import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { useMaybeRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function AudioToggle({
  enabled,
  onClicked,
}: {
  enabled: boolean;
  onClicked: (enabled: boolean) => void;
}) {
  const room = useMaybeRoomContext();
  const track = room?.localParticipant.getTrackPublication(Track.Source.Microphone);

  const on_clicked = () => {
    if (track) {
      if (enabled) {
        track.mute();
      } else {
        track.unmute();
      }
    }
    onClicked(enabled);
  };

  return (
    <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
      {enabled ? (
        <SvgResource type="audio"></SvgResource>
      ) : (
        <SvgResource type="audio_close"></SvgResource>
      )}
    </Button>
  );
}
