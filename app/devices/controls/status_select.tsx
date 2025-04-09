import { Select, SelectProps } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n';
import { UserStatus } from '@/lib/std';
import { useRecoilState } from 'recoil';
import { userState } from '@/app/rooms/[roomName]/PageClientImpl';
import { SvgResource, SvgType } from '@/app/resources/svg';
import styles from '@/styles/controls.module.scss';

interface Item {
  title: string;
  icon: SvgType;
  value: string;
  desc: string;
}

export function StatusSelect({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  
  const { t } = useI18n();
  const [state, setState] = useRecoilState(userState);
  const [active, setActive] = useState(state.status);
  const items: Item[] = [
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
    setActive(active as UserStatus);
    setState({
      ...state,
      status: active as UserStatus,
    });
  };

  const renderedItem: SelectProps['optionRender'] = (option) => {
    return (
      <div className={styles.status_item}>
        <SvgResource type={option.data.icon} svgSize={14}></SvgResource>
        <span>{option.data.title}</span>
        <div>{option.data.desc}</div>
      </div>
    );
  };

  const tagRender: SelectProps['labelRender'] = (option) => {
    const item = items.find((item) => item.value === option.value);

    return (
      <div className={styles.status_item}>
        <SvgResource type={item?.icon as SvgType} svgSize={14}></SvgResource>
        <span>{item?.title}</span>
      </div>
    );
  };

  return (
    <Select
      size="large"
      className={className}
      defaultValue={state.status}
      options={items}
      value={active}
      onChange={selectActive}
      style={style}
      labelRender={tagRender}
      optionRender={renderedItem}
    ></Select>
  );
}
