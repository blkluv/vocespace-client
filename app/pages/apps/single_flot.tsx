import { useEffect, useState } from 'react';
import { FlotLayoutProps } from './flot';
import styles from '@/styles/apps.module.scss';
import { Button, Popover } from 'antd';
import { AppKey, Countdown, Timer, TodoItem } from '@/lib/std/space';
import { AppTimer } from './timer';
import { MessageInstance } from 'antd/es/message/interface';
import { AppCountdown } from './countdown';
import { AppTodo } from './todo_list';
import { useRecoilState } from 'recoil';
import { SingleAppDataState } from '@/app/[spaceName]/PageClientImpl';

export interface SingleFlotLayoutProps extends FlotLayoutProps {
  appKey?: AppKey;
}

export function SingleFlotLayout({
  style,
  messageApi,
  openApp,
  spaceInfo,
  space,
  appKey,
}: SingleFlotLayoutProps) {
  return (
    <div style={style} className={styles.flot_layout}>
      <Popover
        open={openApp}
        placement="leftTop"
        content={<SingleFlotAppItem appKey={appKey} messageApi={messageApi}></SingleFlotAppItem>}
        styles={{
          body: {
            background: '#1a1a1a90',
            width: '300px',
          },
        }}
      >
      </Popover>
    </div>
  );
}

export interface SingleFlotAppItemProps {
  appKey?: AppKey;
  messageApi: MessageInstance;
}

export function SingleFlotAppItem({ appKey, messageApi }: SingleFlotAppItemProps) {
  const [appData, setAppData] = useRecoilState(SingleAppDataState);
  
  const setTimerAppData = async (data: Timer) => {};

  const setCountdownAppData = async (data: Countdown) => {};

  const setTodoAppData = async (data: TodoItem[]) => {

  };

  if (appKey === 'timer') {
    return (
      <AppTimer
        size="small"
        appData={appData.targetApp as Timer}
        setAppData={setTimerAppData}
      ></AppTimer>
    );
  } else if (appKey === 'countdown') {
    return <AppCountdown
      messageApi={messageApi}
      size="small"
      appData={appData.targetApp as Countdown}
      setAppData={setCountdownAppData}
    />;
  } else if (appKey === 'todo') {
    return <AppTodo
      messageApi={messageApi}
      appData={appData.targetApp as TodoItem[]}
      setAppData={setTodoAppData}
    />;
  }else{
    return <div>无</div>
  }
}
