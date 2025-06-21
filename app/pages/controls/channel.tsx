'use client';

import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import styles from '@/styles/channel.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { SvgResource } from '@/app/resources/svg';
import { Avatar, Badge, Button, Collapse, CollapseProps, Input, Modal, Tag, theme } from 'antd';
import { connect_endpoint, randomColor } from '@/lib/std';
import {
  BankOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { ParticipantItemType, ParticipantList } from '../participant/list';
import { GridLayout } from '@livekit/components-react';
import { MessageInstance } from 'antd/es/message/interface';
import { ChildRoom } from '@/lib/std/room';

interface ChannelProps {
  roomName: string;
  onlineCount: number;
  mainParticipants: ParticipantItemType[];
  // subParticipants: ParticipantItemType[];
  ownerId?: string;
  mainContext: ReactNode;
  subContext: ReactNode;
  messageApi: MessageInstance;
  childRooms: ChildRoom[];
  participantId: string;
  fetchSettings: () => Promise<void>;
}

const CONNECT_ENDPOINT = connect_endpoint('/api/room-settings');

export function Channel({
  roomName,
  onlineCount,
  mainParticipants,
  ownerId = '',
  messageApi,
  mainContext,
  subContext,
  childRooms,
  participantId,
  fetchSettings
}: ChannelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const [selected, setSelected] = useState<'main' | 'sub'>('main');
  const [roomCreateModalOpen, setRoomCreateModalOpen] = useState(false);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  const [childRoomName, setChildRoomName] = useState('');
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
    await fetchSettings();
  };
  const deleteChildRoom = async () => {
    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    url.searchParams.append('roomId', roomName);
    url.searchParams.append('childRoom', childRoomName);
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
      await fetchSettings();
    }
  };

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
  const subChildren: CollapseProps['items'] = useMemo(() => {
    return childRooms.map((room) => ({
      key: 'sub',
      label: (
        <div className={styles.room_header_wrapper}>
          <BankOutlined />
          {room.name}
        </div>
      ),
      children:
        // <ParticipantList
        //   participants={subParticipants}
        //   ownerId={ownerId}
        //   size="default"
        // ></ParticipantList>
        subContext,
      style: subStyle,
      extra: (
        <div className={styles.room_header_extra}>
          <Badge count={room.participants.length} color="#22CCEE" showZero size="small" />
          <PlusCircleOutlined onClick={() => addIntoRoom(room.name)} />
          <DeleteOutlined onClick={deleteChildRoom} />
        </div>
      ),
    }));
  }, [subContext, childRooms]);

  const mainItems: CollapseProps['items'] = useMemo(() => {
    return [
      {
        key: 'main',
        label: (
          <div className={styles.room_header_wrapper}>
            <BankOutlined />
            {t('channel.menu.main')} &nbsp;
            {roomName}
          </div>
        ),
        children:
          // <ParticipantList
          //   participants={mainParticipants}
          //   ownerId={ownerId}
          //   size="default"
          // ></ParticipantList>
          mainContext,
        style: panelStyle,
        extra: (
          <div className={styles.room_header_extra}>
            <Badge count={mainParticipants.length} color="#22CCEE" showZero size="small" />
            <PlusCircleOutlined onClick={() => {}} />
          </div>
        ),
      },
      {
        key: 'sub_main',
        label: (
          <div className={styles.room_header_wrapper}>
            <BankOutlined />
            {t('channel.menu.sub')}
          </div>
        ),
        children: (
          <Collapse
            bordered={false}
            defaultActiveKey={['sub']}
            expandIcon={() => <></>}
            style={{ background: token.colorBgContainer }}
            items={subChildren}
          />
        ),
        style: panelStyle,
      },
    ];
  }, [mainContext, subChildren]);

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
              expandIconPosition="end"
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
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
