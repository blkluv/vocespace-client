import { SvgResource } from '@/app/resources/svg';
import { Button, Collapse, CollapseProps, Popover, theme } from 'antd';
import { useEffect, useState } from 'react';
import styles from '@/styles/apps.module.scss';
import { AppTimer } from './timer';
import { AppCountdown } from './countdown';
import { AppTodo } from './todo_list';
import { MessageInstance } from 'antd/es/message/interface';
import { CloudUploadOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useI18n } from '@/lib/i18n/i18n';
import { AppKey, SpaceCountdown, SpaceInfo, SpaceTimer, SpaceTodo } from '@/lib/std/space';
import { api } from '@/lib/api';
import { useLocalParticipant } from '@livekit/components-react';
import { useRecoilState } from 'recoil';
import { AppsDataState } from '@/app/[spaceName]/PageClientImpl';

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
        content={<FlotAppItem messageApi={messageApi} apps={spaceInfo.apps} space={space} />}
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
}

function FlotAppItem({ messageApi, apps, space }: FlotAppItemProps) {
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

  const toggleCollapse = (key: 'timer' | 'countdown' | 'todo') => {
    setActiveKey((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const upload = async (key: AppKey) => {
    let spaceData: SpaceTimer | SpaceCountdown | SpaceTodo | undefined = undefined;
    const defaultData = {
      participantId: localParticipant.identity,
      participantName: localParticipant.name,
      timestamp: Date.now(),
    };
    switch (key) {
      case 'timer': {
        spaceData = {
          ...defaultData,
          ...appData.timer,
        } as SpaceTimer;
        break;
      }
      case 'countdown': {
        spaceData = {
          ...defaultData,
          value: appData.countdown.value,
          duration: appData.countdown.duration ? appData.countdown.duration.toString() : null,
          running: appData.countdown.running,
          stopTimeStamp: appData.countdown.stopTimeStamp,
        } as SpaceCountdown;
        break;
      }
      case 'todo': {
        spaceData = {
          ...defaultData,
          items: appData.todo,
        } as SpaceTodo;
        break;
      }
      default:
        break;
    }

    if (spaceData) {
      const response = await api.uploadSpaceApp(space, key, spaceData);
      if (response.ok) {
        messageApi.success(t('more.app.upload.success'));
      } else {
        messageApi.error(t('more.app.upload.error'));
      }
    }
  };

  const items: CollapseProps['items'] = [
    {
      key: 'timer',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '22px',
            width: '100%',
            gap: 8,
            paddingLeft: 8,
          }}
        >
          <CloudUploadOutlined
            onClick={(e) => {
              e.stopPropagation();
              upload('timer');
            }}
          ></CloudUploadOutlined>
          {activeKey.includes('timer') ? '' : t('more.app.timer.title')}
        </div>
      ),
      children: <AppTimer size="small"></AppTimer>,
      style: itemStyle,
    },
    {
      key: 'countdown',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '22px',
            width: '100%',
            gap: 8,
            paddingLeft: 8,
          }}
        >
          <CloudUploadOutlined
            onClick={(e) => {
              e.stopPropagation();
              upload('countdown');
            }}
          ></CloudUploadOutlined>
          {activeKey.includes('countdown') ? '' : t('more.app.countdown.title')}
        </div>
      ),
      children: <AppCountdown messageApi={messageApi} size="small"></AppCountdown>,
      style: itemStyle,
    },
    {
      key: 'todo',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '22px',
            width: '100%',
            gap: 8,
            paddingLeft: 8,
          }}
        >
          <CloudUploadOutlined
            onClick={(e) => {
              e.stopPropagation();
              upload('todo');
            }}
          ></CloudUploadOutlined>
          {activeKey.includes('todo') ? '' : t('more.app.todo.title')}
        </div>
      ),
      children: <AppTodo messageApi={messageApi}></AppTodo>,
      style: itemStyle,
    },
  ];

  return (
    <Collapse
      bordered={false}
      activeKey={activeKey}
      onChange={(keys) => setActiveKey(keys as string[])}
      expandIcon={({ isActive }) => (isActive ? <MinusCircleOutlined /> : <PlusCircleOutlined />)}
      expandIconPosition="end"
      items={items.filter((item) => apps.includes(item.key as AppKey))}
    />
  );
}
