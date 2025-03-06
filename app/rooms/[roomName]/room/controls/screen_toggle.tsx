import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { ToggleProps } from '@/lib/std/device';

export function ScreenToggle({ enabled, onClicked }: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };
  return (
    <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
      {enabled ? (
        <SvgResource type="screen"></SvgResource>
      ) : (
        <SvgResource type="screen_close"></SvgResource>
      )}
    </Button>
  );
}
