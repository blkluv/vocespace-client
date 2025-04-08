import { Select } from 'antd';
import { SelectPrefix } from './select_prefix';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n';
import { UserStatus } from '@/lib/std';
import { useRecoilState } from 'recoil';
import { userState } from '@/app/rooms/[roomName]/PageClientImpl';
import { SvgResource, SvgType } from '@/app/resources/svg';
import styles from '@/styles/controls.module.scss';

export function StatusSelect({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  const [active, setActive] = useState('');
  const { t } = useI18n();
  const [state, setState] = useRecoilState(userState);
  const items: {
    title: string;
    icon: SvgType;
    value: string;
    desc: string;
  }[] = [
    {
      title: t('settings.general.status.online'),
      desc: t('settings.general.status.online_desc'),
      icon: 'online_dot',
      value: UserStatus.Online,
    },
    {
      title: t('settings.general.status.idot'),
      desc: t('settings.general.status.idot_desc'),
      icon: 'offline_dot',
      value: UserStatus.Idot,
    },
    {
      title: t('settings.general.status.busy'),
      desc: t('settings.general.status.busy_desc'),
      icon: 'busy_dot',
      value: UserStatus.Busy,
    },
    {
      title: t('settings.general.status.invisible'),
      desc: t('settings.general.status.invisible_desc'),
      icon: 'away_dot',
      value: UserStatus.Invisible,
    },
  ];

  const selectActive = (active: string) => {
    setActive(active);
    setState({
      ...state,
      status: active as UserStatus,
    });
  };

  return (
    <Select
      size="large"
      //   prefix={<SelectPrefix type="audio" color="#22CCEE" svgSize={16}></SelectPrefix>}
      className={className}
      defaultValue={state.status}
      options={items}
      value={active}
      onChange={selectActive}
      style={style}
      optionRender={(option) => (
        <div className={styles.status_item}>
          <SvgResource type={option.data.icon} svgSize={14}></SvgResource>
          <span>{option.data.title}</span>
          <div>{option.data.desc}</div>
        </div>
      )}
    ></Select>
  );
}
