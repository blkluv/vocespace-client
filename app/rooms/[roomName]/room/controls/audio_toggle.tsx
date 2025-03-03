import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { useRef, useState } from 'react';
import { useMaybeRoomContext, useTrackToggle } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function AudioToggle({
  enabled,
  onClicked,
}: {
  enabled: boolean;
  onClicked: (enabled: boolean) => void;
}) {

  

  const on_clicked = () => {
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