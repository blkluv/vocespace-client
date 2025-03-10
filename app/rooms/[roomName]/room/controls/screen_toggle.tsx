import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { ToggleProps } from '@/lib/std/device';

export function ScreenToggle({ enabled, onClicked, showText = true }: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };

  return (
    <>
      {showText ? (
        <Button variant="solid" color="default" size="large" onClick={on_clicked} style={{backgroundColor: '#1E1E1E', height : '44px', borderRadius: '8px'}}>
          {enabled ? (
            <SvgResource type="screen" svgSize={16}></SvgResource>
          ) : (
            <SvgResource type="screen_close" svgSize={16}></SvgResource>
          )}
          Share screen
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
