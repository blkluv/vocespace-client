import { Button, Drawer, Tabs, TabsProps } from 'antd';
import { DEFAULT_DRAWER_PROP, DrawerCloser, DrawerHeader } from '../controls/drawer_tools';
import { useMemo, useState } from 'react';
import { AppTimer } from './timer';
import { useI18n } from '@/lib/i18n/i18n';
import { AppCountdown } from './countdown';
import { MessageInstance } from 'antd/es/message/interface';
import { AppTodo } from './todo_list';
import { AppKey, SpaceCountdown, SpaceInfo, SpaceTimer, SpaceTodo } from '@/lib/std/space';
// import { AppHistory } from './history';
import { useLocalParticipant } from '@livekit/components-react';
import { useRecoilState } from 'recoil';
import { AppsDataState, socket } from '@/app/[spaceName]/PageClientImpl';
import { api } from '@/lib/api';
import { WsBase } from '@/lib/std/device';

export interface AppDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  messageApi: MessageInstance;
  spaceInfo: SpaceInfo;
  space: string;
}

export function AppDrawer({ open, setOpen, messageApi, spaceInfo, space }: AppDrawerProps) {
  const [key, setKey] = useState<AppKey | 'history'>('todo');
  const [appData, setAppData] = useRecoilState(AppsDataState);
  const { t } = useI18n();

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'timer',
        label: t('more.app.timer.title'),
        children: (
          <AppTimer
            appData={appData.timer}
            setAppData={async (data) => {
              setAppData({ ...appData, timer: data });
            }}
          ></AppTimer>
        ),
        disabled: !spaceInfo.apps.includes('timer'),
      },
      {
        key: 'countdown',
        label: t('more.app.countdown.title'),
        children: (
          <AppCountdown
            messageApi={messageApi}
            appData={appData.countdown}
            setAppData={async (data) => setAppData({ ...appData, countdown: data })}
          ></AppCountdown>
        ),
        disabled: !spaceInfo.apps.includes('countdown'),
      },
      {
        key: 'todo',
        label: t('more.app.todo.title'),
        children: (
          <AppTodo
            messageApi={messageApi}
            appData={appData.todo}
            setAppData={async (data) => setAppData({ ...appData, todo: data })}
          />
        ),
        disabled: !spaceInfo.apps.includes('todo'),
      },
    ];
  }, [spaceInfo.apps, appData]);

  return (
    <Drawer
      {...DEFAULT_DRAWER_PROP}
      width={'640px'}
      open={open}
      onClose={() => setOpen(false)}
      title={<DrawerHeader title={'App'}></DrawerHeader>}
      extra={DrawerCloser({
        on_clicked: () => {
          setOpen(false);
        },
      })}
    >
      <Tabs
        activeKey={key}
        tabPosition="left"
        centered
        items={items}
        style={{ width: '100%', height: '100%' }}
        onChange={async (k: string) => {
          if (k === 'history') {
            socket.emit('update_user_status', {
              space,
            } as WsBase);
            setKey(k);
          } else {
            setKey(k as AppKey);
          }
        }}
      />
    </Drawer>
  );
}

export interface AppTabHeader {
  ty: AppKey;
  space: string;
  messageApi: MessageInstance;
}

// function AppTabHeader({ ty, space, messageApi }: AppTabHeader) {
//   const { t } = useI18n();
//   const { localParticipant } = useLocalParticipant();
//   const [appData, setAppData] = useRecoilState(AppsDataState);
//   const upload = async () => {
//     let spaceData: SpaceTimer | SpaceCountdown | SpaceTodo | undefined = undefined;
//     const defaultData = {
//       participantId: localParticipant.identity,
//       participantName: localParticipant.name,
//       timestamp: Date.now(),
//     };
//     switch (ty) {
//       case 'timer': {
//         spaceData = {
//           ...defaultData,
//           ...appData.timer,
//         } as SpaceTimer;
//         break;
//       }
//       case 'countdown': {
//         spaceData = {
//           ...defaultData,
//           value: appData.countdown.value,
//           duration: appData.countdown.duration ? appData.countdown.duration.toString() : null,
//           running: appData.countdown.running,
//           stopTimeStamp: appData.countdown.stopTimeStamp,
//         } as SpaceCountdown;
//         break;
//       }
//       case 'todo': {
//         spaceData = {
//           ...defaultData,
//           items: appData.todo,
//         } as SpaceTodo;
//         break;
//       }
//       default:
//         break;
//     }

//     if (spaceData) {
//       const response = await api.uploadSpaceApp(space, ty, spaceData);
//       if (response.ok) {
//         messageApi.success(t('more.app.upload.success'));
//       } else {
//         messageApi.error(t('more.app.upload.error'));
//       }
//     }
//   };

//   return (
//     <div
//       style={{
//         display: 'flex',
//         justifyContent: 'flex-end',
//         gap: '8px',
//         marginBottom: '16px',
//         width: '100%',
//       }}
//     >
//       <Button type="primary" onClick={upload}>
//         {t('more.app.upload.to_space')}
//       </Button>
//       <Button type="default">{t('more.app.upload.history')}</Button>
//     </div>
//   );
// }
