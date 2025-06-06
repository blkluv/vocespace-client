import { Button, Dropdown, MenuProps, Space } from 'antd';

import { SvgResource } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';
import { useMemo, useState } from 'react';

export interface MoreButtonProps {
  showText?: boolean;
  setOpenMore: (open: boolean) => void;
  setOpenRecord: (open: boolean) => void;
  setMoreType: (type: 'record' | 'participant') => void;
  onClickManage?: () => void;
}

export function MoreButton({
  showText = true,
  setOpenMore,
  setMoreType,
  onClickManage,
  setOpenRecord
}: MoreButtonProps) {
  const { t } = useI18n();

  const showTextOrHide = useMemo(() => {
    // 判断窗口的宽度是否大于760px, 如果小于则需要隐藏文字
    if (window.innerWidth < 760) {
      return false;
    } else {
      return showText;
    }
  }, [window.innerWidth]);

  const items: MenuProps['items'] = [
    // 录屏功能
    {
      label: <div style={{ marginLeft: '8px' }}>{t('more.record.start')}</div>,
      key: 'record',
      icon: <SvgResource type="record" svgSize={16} />,
    },
    // 参与者管理功能
    {
      label: <div style={{ marginLeft: '8px' }}>{t('more.participant.title')}</div>,
      key: 'participant',
      icon: <SvgResource type="user" svgSize={16} />,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'record':
        // Handle record action
        setMoreType('record');
        setOpenRecord(true);
        break;
      case 'participant':
        // Handle participant action
        if (onClickManage) {
          onClickManage();
        }
        setMoreType('participant');
        setOpenMore(true);
        break;
      default:
        console.log('Unknown action');
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <>
      <Dropdown menu={menuProps} trigger={['click']}>
        <Button
          style={{
            backgroundColor: '#1E1E1E',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            color: '#fff',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <SvgResource type="more" svgSize={16}></SvgResource>
            {showTextOrHide && t('more.title')}
            <SvgResource type="down" svgSize={16}></SvgResource>
          </div>
        </Button>
      </Dropdown>
    </>
  );
}
