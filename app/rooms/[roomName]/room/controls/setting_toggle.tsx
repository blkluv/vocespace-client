import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { ToggleProps } from '@/lib/std/device';

export function SettingToggle({
  enabled,
  onClicked,
  showText = true,
}: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };

  return (
    <>
      {showText ? (
        <Button  variant="solid" color="default" size="large" onClick={on_clicked} style={{backgroundColor: '#1E1E1E', height : '44px', borderRadius: '8px'}}>
          <SvgResource type="setting" svgSize={16}></SvgResource>
          Settings
        </Button>
      ) : (
        <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
          <SvgResource type="setting" svgSize={16}></SvgResource>
        </Button>
      )}
    </>
  );
}
