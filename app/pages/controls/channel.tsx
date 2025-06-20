'use client';

import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import styles from '@/styles/channel.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { SvgResource } from '@/app/resources/svg';
import { Avatar, Badge, Button, Collapse, CollapseProps, Tag, theme } from 'antd';
import { randomColor } from '@/lib/std';
import {
  BankOutlined,
  CaretRightOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { ParticipantItemType, ParticipantList } from '../participant/list';
import { GridLayout } from '@livekit/components-react';

interface ChannelProps {
  roomName: string;
  onlineCount: number;
  mainParticipants: ParticipantItemType[];
  subParticipants: ParticipantItemType[];
  ownerId?: string;
  currentRoom: 'main' | string; // 'main' for main room, or sub room id
  onJoinMainRoom: () => void;
  onJoinSubRoom: (roomId: string) => void;
  onLeaveSubRoom: () => void;
  onCreateSubRoom: () => void;
  onSubRoomSettings: (roomId: string) => void;
  mainContext: ReactNode;
}

export function Channel({
  roomName,
  onlineCount,
  mainParticipants,
  subParticipants,
  currentRoom,
  onJoinMainRoom,
  onJoinSubRoom,
  onLeaveSubRoom,
  onCreateSubRoom,
  onSubRoomSettings,
  ownerId = '',
  mainContext,
}: ChannelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(['main']));
  const { token } = theme.useToken();
  const [selected, setSelected] = useState<'main' | 'sub'>('main');
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleRoomExpansion = (roomId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  const panelStyle: React.CSSProperties = {
    marginBottom: 0,
    background: '#1e1e1e',
    borderRadius: 0,
    border: 'none',
  };
  const subStyle: React.CSSProperties = {
    marginBottom: 0,
    background: selected == 'sub' ? '#2a2a2a' : '#1e1e1e',
    borderRadius: 0,
    border: 'none',
  };
  const subChildren: CollapseProps['items'] = [
    {
      key: 'sub',
      label: (
        <div className={styles.room_header_wrapper}>
          <BankOutlined />
          {t('channel.menu.sub')}
        </div>
      ),
      children: (
        <ParticipantList
          participants={subParticipants}
          ownerId={ownerId}
          size="default"
        ></ParticipantList>
      ),
      style: subStyle,
      extra: (
        <div className={styles.room_header_extra}>
          <Badge count={subParticipants.length} color="#22CCEE" showZero size="small" />
          <PlusCircleOutlined onClick={() => {}} />
        </div>
      ),
    },
  ];
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
            expandIconPosition="end"
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
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
          onClick={onCreateSubRoom}
          type="primary"
          style={{ width: '100%' }}
          icon={<SvgResource type="add" svgSize={16} />}
        >
          <span>创建子房间</span>
        </Button>
      </div>
    </div>
  );
}
