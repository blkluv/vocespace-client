import { Button } from 'antd';
import { SvgResource } from '../../pre_join/resources';

export function SettingToggle({
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
      <SvgResource type="setting"></SvgResource>
    </Button>
  );
}
