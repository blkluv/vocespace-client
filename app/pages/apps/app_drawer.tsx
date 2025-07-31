import { Drawer, Tabs, TabsProps } from 'antd';
import { DEFAULT_DRAWER_PROP, DrawerCloser, DrawerHeader } from '../controls/drawer_tools';
import { useMemo, useState } from 'react';
import { AppTimer } from './timer';
import { useI18n } from '@/lib/i18n/i18n';
import { AppCountdown } from './countdown';
import { MessageInstance } from 'antd/es/message/interface';
import { AppTodo } from './todo_list';
import { AppKey, SpaceInfo } from '@/lib/std/space';

export interface AppDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  messageApi: MessageInstance;
  spaceInfo: SpaceInfo;
}

export function AppDrawer({ open, setOpen, messageApi, spaceInfo }: AppDrawerProps) {
  const [key, setKey] = useState<AppKey>('todo');
  const {t} = useI18n();

  const items: TabsProps['items'] = useMemo(()=> {
    return [
    {
      key: 'timer',
      label: t('more.app.timer.title'),
      children: <AppTimer></AppTimer>,
      disabled: !spaceInfo.apps.includes('timer')
    },
    {
      key: 'countdown',
      label: t('more.app.countdown.title'),
      children: <AppCountdown messageApi={messageApi}></AppCountdown>,
      disabled: !spaceInfo.apps.includes('countdown')
    },
    {
      key: 'todo',
      label: t('more.app.todo.title'),
      children: <AppTodo messageApi={messageApi}></AppTodo>,
      disabled: !spaceInfo.apps.includes('todo')
    },
  ];
  }, [spaceInfo.apps]);

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
        onChange={(k: string) => {
          setKey(k as AppKey);
        }}
      />
    </Drawer>
  );
}
