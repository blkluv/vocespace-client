'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';
import styles from '@/styles/channel.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { SvgResource } from '@/app/resources/svg';
import {
  Badge,
  Button,
  Collapse,
  CollapseProps,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  Tag,
  theme,
} from 'antd';
import { connect_endpoint } from '@/lib/std';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { GridLayout, TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { MessageInstance } from 'antd/es/message/interface';
import { RoomSettings } from '@/lib/std/room';
import { ParticipantTileMini } from '../participant/mini';

interface ChannelProps {
  roomName: string;
  messageApi: MessageInstance;
  participantId: string;
  onUpdate: () => Promise<void>;
  tracks: TrackReferenceOrPlaceholder[];
  settings: RoomSettings;
}

const CONNECT_ENDPOINT = connect_endpoint('/api/room-settings');

export function Channel({
  roomName,
  settings,
  messageApi,
  participantId,
  onUpdate,
  tracks,
}: ChannelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const [selected, setSelected] = useState<'main' | 'sub'>('main');
  const [roomCreateModalOpen, setRoomCreateModalOpen] = useState(false);
  const [deleteChildRoomName, setDeleteChildRoomName] = useState('');
  const childRooms = useMemo(() => {
    return settings.children || [];
  }, [settings.children]);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  const [childRoomName, setChildRoomName] = useState('');
  const onlineCount = useMemo(() => {
    return Object.keys(settings.participants).length;
  }, [settings.participants]);

  const createChildRoom = async () => {
    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    url.searchParams.append('childRoom', 'true');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomName,
        childRoomName,
      }),
    });
    if (!response.ok) {
      messageApi.error({
        content: t('channel.create.error'),
        duration: 2,
      });
      return;
    } else {
      messageApi.success({
        content: t('channel.create.success'),
        duration: 2,
      });
      setRoomCreateModalOpen(false);
    }
   await onUpdate();
  };

  const deleteChildRoom = async () => {
    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    url.searchParams.append('roomId', roomName);
    url.searchParams.append('childRoom', deleteChildRoomName);
    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });
    if (!response.ok) {
      messageApi.error({
        content: t('channel.delete.error'),
        duration: 2,
      });
      return;
    } else {
      messageApi.success({
        content: t('channel.delete.success'),
        duration: 2,
      });
      setDeleteChildRoomName('');
     await onUpdate();
    }
  };

  const leaveChildRoom = async () => {
    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    url.searchParams.append('leaveChildRoom', 'true');
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomName,
        childRoom: deleteChildRoomName,
        participantId,
      }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      messageApi.error({
        content: error,
        duration: 2,
      });
    } else {
      messageApi.success({
        content: t('channel.leave.success'),
        duration: 2,
      });
      setDeleteChildRoomName('');
     await onUpdate();
    }
  };

  const addIntoRoom = async (room: string) => {
    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: roomName,
        childRoom: room,
        participantId,
      }),
    });
    if (!response.ok) {
      const { error } = await response.json();
      messageApi.error({
        content: error,
        duration: 2,
      });
      return;
    } else {
      messageApi.success({
        content: t('channel.join.success'),
        duration: 2,
      });
     await onUpdate();
    }
  };

  const joinMainRoom = async () => {};

  const subContextItems: MenuProps['items'] = [
    {
      key: 'setting',
      label: t('channel.menu.setting'),
    },
    {
      key: 'delete',
      label: t('channel.menu.delete'),
      onClick: deleteChildRoom,
    },
    {
      key: 'leave',
      label: t('channel.menu.leave'),
      onClick: leaveChildRoom,
    },
  ];

  const panelStyle: React.CSSProperties = {
    marginBottom: 0,
    background: '#1e1e1e',
    borderRadius: 0,
    border: 'none',
    padding: '0px',
  };

  const subStyle: React.CSSProperties = {
    marginBottom: 0,
    background: selected == 'sub' ? '#2a2a2a' : '#1e1e1e',
    borderRadius: 0,
    border: 'none',
  };

  const mainContext: ReactNode = useMemo(() => {
    let allChildParticipants = childRooms.reduce((acc, room) => {
      return acc.concat(room.participants);
    }, [] as string[]);

    // 从tracks中将所有子房间的参与者过滤掉
    let mainTracks = tracks.filter(
      (track) => !allChildParticipants.includes(track.participant.identity),
    );

    return (
      <GridLayout tracks={mainTracks} style={{ height: '120px' }}>
        <ParticipantTileMini settings={settings}></ParticipantTileMini>
      </GridLayout>
    );
  }, [tracks, childRooms, settings]);

  const subContext = useCallback(
    (name: string): ReactNode => {
      let childRoom = childRooms.find((room) => room.name === name);

      if (!childRoom) {
        return <></>;
      }

      let subTracks = tracks.filter((track) =>
        childRoom.participants.includes(track.participant.identity),
      );

      return (
        <GridLayout tracks={subTracks} style={{ height: '120px' }}>
          <ParticipantTileMini settings={settings}></ParticipantTileMini>
        </GridLayout>
      );
    },
    [tracks, childRooms, settings],
  );

  const subChildren: CollapseProps['items'] = useMemo(() => {
    return childRooms.map((room) => ({
      key: 'sub',
      label: (
        <Dropdown
          trigger={['contextMenu']}
          menu={{ items: subContextItems }}
          onOpenChange={(open) => {
            if (open) {
              setDeleteChildRoomName(room.name);
            }
          }}
        >
          <div className={styles.room_header_wrapper}>
            <VideoCameraOutlined />
            {room.name}
          </div>
        </Dropdown>
      ),
      children: subContext(room.name),
      style: subStyle,
      extra: (
        <div className={styles.room_header_extra}>
          <button onClick={() => addIntoRoom(room.name)} className="vocespace_button">
            <PlusCircleOutlined />
            {t('channel.menu.join')}
          </button>
        </div>
      ),
    }));
  }, [subContext, childRooms, deleteChildRoomName]);

  const mainItems: CollapseProps['items'] = useMemo(() => {
    return [
      {
        key: 'main',
        label: (
          <div className={styles.room_header_wrapper}>
            <VideoCameraOutlined />
            {t('channel.menu.main')} &nbsp;
            {roomName}
          </div>
        ),
        children: mainContext,
        style: panelStyle,
        extra: (
          <div className={styles.room_header_extra}>
            <button onClick={joinMainRoom} className="vocespace_button">
              <PlusCircleOutlined />
              {t('channel.menu.join')}
            </button>
          </div>
        ),
      },
      {
        key: 'sub_main',
        label: (
          <div className={styles.room_header_wrapper}>
            <VideoCameraOutlined />
            {t('channel.menu.sub')}
          </div>
        ),
        children: (
          <Collapse
            bordered={false}
            defaultActiveKey={['sub']}
            expandIcon={() => undefined}
            style={{ background: token.colorBgContainer }}
            items={subChildren}
          />
        ),
        style: panelStyle,
        extra: <Badge count={childRooms.length} color="#22CCEE" showZero size="small" />,
      },
    ];
  }, [mainContext, subChildren, childRooms]);

  if (collapsed) {
    return (
      <div className={`${styles.container} ${styles.collapsed}`}>
        <Button type="text" onClick={toggleCollapse} icon={<MenuUnfoldOutlined />}></Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.roomInfo}>
              {/* <SvgResource.Hash className={styles.roomIcon} /> */}
              <span className={styles.roomName}>{roomName}</span>
            </div>
            <div className={styles.headerActions}>
              <Tag color="#22CCEE">{onlineCount} 在线</Tag>
              <Button
                className={styles.collapseButton}
                onClick={toggleCollapse}
                icon={<MenuFoldOutlined />}
                type="text"
              ></Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.main}>
          {/* Main Room */}
          <div>
            <Collapse
              bordered={false}
              defaultActiveKey={['main']}
              expandIcon={() => undefined}
              style={{ background: token.colorBgContainer }}
              items={mainItems}
            />
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <Button
            onClick={() => {
              setRoomCreateModalOpen(true);
            }}
            type="primary"
            style={{ width: '100%' }}
            icon={<SvgResource type="add" svgSize={16} />}
          >
            <span>创建子房间</span>
          </Button>
        </div>
      </div>
      <Modal
        open={roomCreateModalOpen}
        title="创建子房间"
        onCancel={() => {
          setRoomCreateModalOpen(false);
        }}
        onOk={createChildRoom}
      >
        <p>创建子房间后，您可以邀请其他参与者加入该子房间。子房间可以用于特定的讨论或活动。</p>
        <p>
          在子房间中，主房间依然可见，您可以随时返回主房间进行交流。对于主房间的参与者，他们无法听到子房间的讨论内容，但可以看到子房间的存在。
        </p>
        <Input
          placeholder="请输入子房间名称"
          style={{
            outline: '1px solid #22CCEE',
          }}
          value={childRoomName}
          onChange={(e) => {
            setChildRoomName(e.target.value);
          }}
        ></Input>
      </Modal>
    </>
  );
}
