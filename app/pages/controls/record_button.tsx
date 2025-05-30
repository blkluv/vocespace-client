import { Button } from 'antd';

import { SvgResource } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';
import { useMemo, useState } from 'react';

export function RecordButton({ showText = true }: { showText?: boolean }) {
  const [isRecord, setIsRecord] = useState(false);
  const { t } = useI18n();

  const showTextOrHide = useMemo(() => {
    // 判断窗口的宽度是否大于760px, 如果小于则需要隐藏文字
    if (window.innerWidth < 760) {
      return false;
    } else {
      return showText;
    }
  }, [window.innerWidth]);

  const record = () => {};

  return (
    <>
      {showTextOrHide ? (
        <Button
          variant="solid"
          color="default"
          size="large"
          onClick={record}
          style={{ backgroundColor: '#1E1E1E', height: '44px', borderRadius: '8px' }}
        >
          <SvgResource type="record" svgSize={16}></SvgResource>
          {isRecord ? t('common.record.stop') : t('common.record.start')}
        </Button>
      ) : (
        <Button
          variant="solid"
          color="default"
          size="large"
          onClick={record}
          style={{ backgroundColor: '#1E1E1E', height: '38px', borderRadius: '8px' }}
        >
          <SvgResource type="record" svgSize={16}></SvgResource>
        </Button>
      )}
    </>
  );
}
