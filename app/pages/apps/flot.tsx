import { SvgResource } from '@/app/resources/svg';
import { Button, Collapse, CollapseProps, Popover, Tabs, TabsProps, theme } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/styles/apps.module.scss';
import { AppTimer } from './timer';
import { AppCountdown } from './countdown';
import { AppTodo } from './todo_list';
import { MessageInstance } from 'antd/es/message/interface';
import {
  CloudUploadOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useI18n } from '@/lib/i18n/i18n';
import {
  AppAuth,
  AppKey,
  castCountdown,
  castTimer,
  castTodo,
  Countdown,
  SpaceCountdown,
  SpaceInfo,
  SpaceTimer,
  SpaceTodo,
  Timer,
  TodoItem,
} from '@/lib/std/space';
import { api } from '@/lib/api';
import { useLocalParticipant } from '@livekit/components-react';
import { useRecoilState } from 'recoil';
import { AppsDataState, socket } from '@/app/[spaceName]/PageClientImpl';
import { WsBase } from '@/lib/std/device';

export interface FlotLayoutProps {
  style?: React.CSSProperties;
  messageApi: MessageInstance;
  openApp: boolean;
  spaceInfo: SpaceInfo;
  space: string;
}

export function FlotLayout({ style, messageApi, openApp, spaceInfo, space }: FlotLayoutProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openApp && open) {
      setOpen(false);
    }
  }, [open, openApp]);

  return (
    <div style={style} className={styles.flot_layout}>
      <Popover
        open={open}
        placement="leftTop"
        content={
          <FlotAppItem
            messageApi={messageApi}
            apps={spaceInfo.apps}
            space={space}
            spaceInfo={spaceInfo}
          />
        }
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

interface FlotAppItemProps {
  messageApi: MessageInstance;
  apps: AppKey[];
  space: string;
  spaceInfo: SpaceInfo;
}

export interface TimerProp {
  data: Timer;
  setData: (data: Timer) => Promise<void>;
}

export interface CountdownProp {
  data: Countdown;
  setData: (data: Countdown) => Promise<void>;
}  
export interface TodoProp {
  data: TodoItem[];
  setData: (data: TodoItem[]) => Promise<void>;
}

function FlotAppItem({ messageApi, apps, space, spaceInfo }: FlotAppItemProps) {
  const [activeKey, setActiveKey] = useState<string[]>(['timer', 'countdown', 'todo']);
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { localParticipant } = useLocalParticipant();
  const [appData, setAppData] = useRecoilState(AppsDataState);

  const itemStyle: React.CSSProperties = {
    marginBottom: 8,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusSM,
    border: 'none',
  };

  const selfAuth = useMemo(() => {
    if (spaceInfo.participants[localParticipant.identity]) {
      return spaceInfo.participants[localParticipant.identity].auth;
    }
    return 'none';
  }, [spaceInfo.participants]);

  const toggleCollapse = (key: 'timer' | 'countdown' | 'todo') => {
    setActiveKey((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const upload = async (key: AppKey, data: SpaceTimer | SpaceCountdown | SpaceTodo) => {
    let participantId = localParticipant.identity;
    if (selfAuth === 'none') return;
    const response = await api.uploadSpaceApp(space, participantId, key, data);
    if (response.ok) {
      socket.emit('update_user_status', {
        space,
      } as WsBase);
      messageApi.success(t('more.app.upload.success'));
    } else {
      messageApi.error(t('more.app.upload.error'));
    }
  };

  const setSelfTimerData = async (timer: Timer) => {
    setAppData((prev) => ({
      ...prev,
      timer,
    }));
    await upload('timer', {
      ...timer,
      timestamp: Date.now(),
    } as SpaceTimer);
  };

  const setRemoteTimerData = async (auth: AppAuth, participantId: string, timer: Timer) => {
    if (auth !== 'write') return;
    // 通过API更新
    // const response = await api.updateParticipantApp(participantId, 'timer', timer);
  };

  const setSelfCountdownData = async (countdown: Countdown) => {
    setAppData((prev) => ({
      ...prev,
      countdown,
    }));
    await upload('countdown', {
      ...countdown,
      timestamp: Date.now(),
    } as SpaceCountdown);
  };

  const setSelfTodoData = async (todo: TodoItem[]) => {
    setAppData((prev) => ({
      ...prev,
      todo,
    }));
    await upload('todo', {
      items: todo,
      timestamp: Date.now(),
    } as SpaceTodo);
  };

  const updateAppSync = async (key: AppKey) => {
    const response = await api.updateSpaceAppSync(space, localParticipant.identity, key);
    if (response.ok) {
      socket.emit('update_user_status', {
        space,
      } as WsBase);
      messageApi.success(t('more.app.settings.sync.update.success'));
    } else {
      messageApi.error(t('more.app.settings.sync.update.error'));
    }
  };

  const showSyncIcon = (isRemote: boolean, key: AppKey) => {
    return isRemote ? (
      <span></span>
    ) : spaceInfo.participants[localParticipant.identity].sync.includes(key) ? (
      <TeamOutlined
        onClick={(e) => {
          e.stopPropagation();
          updateAppSync(key);
        }}
      />
    ) : (
      <UserOutlined
        onClick={(e) => {
          e.stopPropagation();
          updateAppSync(key);
        }}
      />
    );
  };

  const createItems = (
    timer?: TimerProp,
    countdown?: CountdownProp,
    todo?: TodoProp,
    isRemote = false,
  ): CollapseProps['items'] => {
    let items: CollapseProps['items'] = [];
    timer &&
      items.push({
        key: 'timer',
        label: (
          <div style={{ height: 22, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {showSyncIcon(isRemote, 'timer')}
            {activeKey.includes('timer') ? '' : t('more.app.timer.title')}
          </div>
        ),
        children: (
          <AppTimer size="small" appData={timer.data} setAppData={timer.setData}></AppTimer>
        ),
        style: itemStyle,
      });

    countdown &&
      items.push({
        key: 'countdown',
        label: (
          <div style={{ height: 22, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {showSyncIcon(isRemote, 'countdown')}
            {activeKey.includes('countdown') ? '' : t('more.app.countdown.title')}
          </div>
        ),
        children: (
          <AppCountdown
            messageApi={messageApi}
            size="small"
            appData={countdown.data}
            setAppData={countdown.setData}
          />
        ),
        style: itemStyle,
      });

    todo &&
      items.push({
        key: 'todo',
        label: (
          <div style={{ height: 22, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {showSyncIcon(isRemote, 'todo')}
            {activeKey.includes('todo') ? '' : t('more.app.todo.title')}
          </div>
        ),
        children: <AppTodo messageApi={messageApi} appData={todo.data} setAppData={todo.setData} />,
        style: itemStyle,
      });
    return items;
  };

  const selfItems: CollapseProps['items'] = useMemo(() => {
    // items.filter((item) => apps.includes(item.key as AppKey))
    let timer: TimerProp | undefined = undefined;
    if (apps.includes('timer')) {
      timer = {
        data: appData.timer,
        setData: setSelfTimerData,
      };
    }
    let countdown: CountdownProp | undefined = undefined;
    if (apps.includes('countdown')) {
      countdown = {
        data: appData.countdown,
        setData: setSelfCountdownData,
      };
    }
    let todo: TodoProp | undefined = undefined;
    if (apps.includes('todo')) {
      todo = {
        data: appData.todo,
        setData: setSelfTodoData,
      };
    }

    const items = createItems(timer, countdown, todo);

    if (!items) {
      return [];
    }

    return items;
  }, [apps, activeKey, appData]);

  const tabItems: TabsProps['items'] = useMemo(() => {
    let remoteParticipantKeys = Object.keys(spaceInfo.participants).filter((k) => {
      return k !== localParticipant.identity;
    });

    const remoteAppDatas = remoteParticipantKeys.map((key) => {
      return {
        id: key,
        name: spaceInfo.participants[key].name,
        auth: spaceInfo.participants[key].auth,
        sync: spaceInfo.participants[key].sync,
        appDatas: spaceInfo.participants[key].appDatas,
      };
    });
    let res = [
      {
        key: 'self',
        label: t('more.app.tab.self'),
        children: (
          <Collapse
            bordered={false}
            activeKey={activeKey}
            onChange={(keys) => setActiveKey(keys as string[])}
            expandIcon={({ isActive }) =>
              isActive ? <MinusCircleOutlined /> : <PlusCircleOutlined />
            }
            expandIconPosition="end"
            items={selfItems}
          />
        ),
      },
    ];

    if (remoteAppDatas.length > 0) {
      remoteAppDatas.forEach((v) => {
        if (v.sync) {
          let castedTimer = castTimer(v.appDatas.timer);
          let castedCountdown = castCountdown(v.appDatas.countdown);
          let castedTodo = castTodo(v.appDatas.todo);

          let timer: TimerProp | undefined = undefined;
          if (castedTimer) {
            timer = {
              data: castedTimer,
              setData: async (data) => {
                // update the timer data
                await setRemoteTimerData(v.auth, v.id, data);
              },
            };
          }
          let countdown: CountdownProp | undefined = undefined;
          if (castedCountdown) {
            countdown = {
              data: castedCountdown,
              setData: async (data) => {
                // update the countdown data
              },
            };
          }
          let todo: TodoProp | undefined = undefined;
          if (castedTodo) {
            todo = {
              data: castedTodo,
              setData: async (data) => {
                // update the todo data
                console.warn(data);
              },
            };
          }

          let remoteItems = createItems(timer, countdown, todo, true);

          res.push({
            key: v.id,
            label: v.name,
            children:
              v.auth === 'none' ? (
                <div>{t('more.app.tab.no_auth')}</div>
              ) : (
                <Collapse
                  bordered={false}
                  onChange={(keys) => setActiveKey(keys as string[])}
                  expandIcon={({ isActive }) =>
                    isActive ? <MinusCircleOutlined /> : <PlusCircleOutlined />
                  }
                  expandIconPosition="end"
                  items={remoteItems}
                />
              ),
          });
        }
      });
    }

    return res;
  }, [spaceInfo, selfItems, activeKey]);

  return <Tabs size="small" items={tabItems}></Tabs>;
}
