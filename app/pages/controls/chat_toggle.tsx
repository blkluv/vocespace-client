import { Button } from 'antd';
import { ToggleProps } from '@/lib/std/device';
import { SvgResource } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';
import { useMemo } from 'react';

export function ChatToggle({ enabled, onClicked, showText = true }: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };
  const { t } = useI18n();

  const showTextOrHide = useMemo(() => {
    if (window.innerWidth < 760) {
      return false;
    } else {
      return showText;
    }
  }, [window.innerWidth]);

  return (
    <>
      {showTextOrHide ? (
        <Button
          variant="solid"
          color="default"
          size="large"
          onClick={on_clicked}
          style={{ backgroundColor: '#1E1E1E', height: '44px', borderRadius: '8px' }}
        >
          <SvgResource type="chat" svgSize={18}></SvgResource>
          {t('common.chat')}
        </Button>
      ) : (
        <Button  variant="solid" color="default" size="large" onClick={on_clicked}  style={{ backgroundColor: '#1E1E1E', height: '38px', borderRadius: '8px' }}>
          <SvgResource type="chat" svgSize={18}></SvgResource>
        </Button>
      )}
    </>
  );
}
