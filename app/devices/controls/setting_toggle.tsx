import { Button } from 'antd';
import { ToggleProps } from '@/lib/std/device';
import { SvgResource } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';

export function SettingToggle({ enabled, onClicked, showText = true }: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };
  const {t} =useI18n();

  return (
    <>
      {showText ? (
        <Button
          variant="solid"
          color="default"
          size="large"
          onClick={on_clicked}
          style={{ backgroundColor: '#1E1E1E', height: '44px', borderRadius: '8px' }}
        >
          <SvgResource type="setting" svgSize={16}></SvgResource>
          {t('common.setting')}
        </Button>
      ) : (
        <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
          <SvgResource type="setting" svgSize={16}></SvgResource>
        </Button>
      )}
    </>
  );
}
