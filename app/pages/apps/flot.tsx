import { SvgResource } from '@/app/resources/svg';
import { Button, Popover } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/styles/apps.module.scss';
import { AppTimer } from './timer';
import { AppCountdown } from './countdown';
import { AppTodo } from './todo_list';
import { MessageInstance } from 'antd/es/message/interface';

export interface FlotLayoutProps {
  style?: React.CSSProperties;
  messageApi: MessageInstance;
  openApp: boolean
}

export function FlotLayout({ style, messageApi, openApp }: FlotLayoutProps) {
  const [open, setOpen] = useState(false);

  useEffect(()=>{
    if (openApp && open) {
        setOpen(false);
    }
  },[open, openApp]);

  const content = useMemo(() => {
    return (
      <div className={styles.flot_content}>
        <AppTimer size="small"></AppTimer>
        <AppCountdown messageApi={messageApi} size="small"></AppCountdown>
        <AppTodo messageApi={messageApi}></AppTodo>
      </div>
    );
  }, []);

  return (
    <div style={style} className={styles.flot_layout}>
      <Popover
        open={open}
        placement="leftTop"
        content={content}
        styles={{
          body: {
            background: '#1a1a1a90',
            width: '300px',
          },
        }}
      >
        <Button
          onClick={() => {
            if (openApp) return;
            setOpen(!open);
          }}
          type="text"
          style={{ height: '100%', width: '100%' }}
          icon={<SvgResource type="app" svgSize={16}></SvgResource>}
        ></Button>
      </Popover>
    </div>
  );
}
