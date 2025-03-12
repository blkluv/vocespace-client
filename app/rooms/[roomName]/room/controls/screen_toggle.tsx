import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { State, ToggleProps } from '@/lib/std/device';
import { useCallback, useEffect, useState } from 'react';

export function ScreenToggle({ enabled, onClicked, showText = true, bg_color }: ToggleProps & {bg_color: string}) {

  const on_clicked = () => {
    onClicked(enabled);
  };

  return (
    <>
      {showText ? (
        <Button
          variant="solid"
          color="default"
          size="large"
          onClick={on_clicked}
          style={{ backgroundColor: bg_color, height: '44px', borderRadius: '8px' }}
        >
          {enabled ? (
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              <SvgResource type="screen_close" svgSize={16}></SvgResource>
              <div style={{ marginLeft: '12px' }}>Stop screen share</div>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              <SvgResource type="screen" svgSize={16}></SvgResource>
              <div style={{ marginLeft: '12px' }}>Share screen</div>
            </div>
          )}
        </Button>
      ) : (
        <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
          {enabled ? (
            <SvgResource type="screen" svgSize={16}></SvgResource>
          ) : (
            <SvgResource type="screen_close" svgSize={16}></SvgResource>
          )}
        </Button>
      )}
    </>
  );
}
