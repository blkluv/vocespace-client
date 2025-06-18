'use client';

import { useState } from 'react';
import styles from '@/styles/channel.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { SvgResource } from '@/app/resources/svg';
import { Avatar, Button, Tag } from 'antd';
import { randomColor } from '@/lib/std';
import { MenuFoldOutlined } from '@ant-design/icons';

interface ChannelProps {
  roomName: string;
  onlineCount: number;
  mainRoomUsers: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
  }>;
  subRooms: Array<{
    id: string;
    name: string;
    users: Array<{
      id: string;
      name: string;
      avatar?: string;
      status: 'online' | 'away' | 'busy' | 'offline';
    }>;
    isActive: boolean;
  }>;
  currentRoom: 'main' | string; // 'main' for main room, or sub room id
  onJoinMainRoom: () => void;
  onJoinSubRoom: (roomId: string) => void;
  onLeaveSubRoom: () => void;
  onCreateSubRoom: () => void;
  onSubRoomSettings: (roomId: string) => void;
}

export function Channel({
  roomName,
  onlineCount,
  mainRoomUsers,
  subRooms,
  currentRoom,
  onJoinMainRoom,
  onJoinSubRoom,
  onLeaveSubRoom,
  onCreateSubRoom,
  onSubRoomSettings,
}: ChannelProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(['main']));

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

  const renderUserList = (
    users: Array<{ id: string; name: string; avatar?: string; status: string }>,
  ) => (
    <div className={styles.userList}>
      {users.map((user) => (
        <div key={user.id} className={styles.userItem}>
          <div className={`${styles.userAvatar} ${styles[`status_${user.status}`]}`}>
            {user.avatar ? (
              <Avatar
                style={{
                  backgroundColor: randomColor(user.name),
                }}
              >
                {user.name.substring(0, 3)}
              </Avatar>
            ) : (
              <div className={styles.avatarPlaceholder}>{user.name.charAt(0).toUpperCase()}</div>
            )}
            <div className={styles.statusIndicator} />
          </div>
          <span className={styles.userName}>{user.name}</span>
        </div>
      ))}
    </div>
  );

  if (collapsed) {
    return (
      <div className={`${styles.container} ${styles.collapsed}`}>
        <button className={styles.expandButton} onClick={toggleCollapse}>
          {/* <SvgResource.ChevronRight /> */}
        </button>
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
        <div className={styles.roomSection}>
          <div className={styles.roomHeader} onClick={() => toggleRoomExpansion('main')}>
            <div className={styles.roomHeaderLeft}>
              {/* <SvgResource.ChevronDown
                className={`${styles.expandIcon} ${
                  expandedRooms.has('main') ? styles.expanded : ''
                }`}
              />
              <SvgResource.Hash className={styles.roomTypeIcon} /> */}
              <span className={styles.roomHeaderTitle}>主房间</span>
            </div>
            <div className={styles.roomHeaderActions}>
              {currentRoom !== 'main' && (
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinMainRoom();
                  }}
                  title="返回主房间"
                >
                  {/* <SvgResource.ArrowLeft /> */}
                </button>
              )}
            </div>
          </div>
          {expandedRooms.has('main') && (
            <div className={`${styles.roomContent} ${currentRoom === 'main' ? styles.active : ''}`}>
              {renderUserList(mainRoomUsers)}
            </div>
          )}
        </div>

        {/* Sub Rooms */}
        {subRooms.map((subRoom) => (
          <div key={subRoom.id} className={styles.roomSection}>
            <div className={styles.roomHeader} onClick={() => toggleRoomExpansion(subRoom.id)}>
              <div className={styles.roomHeaderLeft}>
                <SvgResource type="add" />
                <SvgResource type="channel" />
                <span className={styles.roomHeaderTitle}>{subRoom.name}</span>
              </div>
              <div className={styles.roomHeaderActions}>
                {currentRoom === subRoom.id && (
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeaveSubRoom();
                    }}
                    title="离开子房间"
                  >
                    <SvgResource type="leave" />
                  </button>
                )}
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubRoomSettings(subRoom.id);
                  }}
                  title="房间设置"
                >
                  <SvgResource type="setting" />
                </button>
              </div>
            </div>
            {expandedRooms.has(subRoom.id) && (
              <div
                className={`${styles.roomContent} ${
                  currentRoom === subRoom.id ? styles.active : ''
                }`}
                onClick={() => currentRoom !== subRoom.id && onJoinSubRoom(subRoom.id)}
              >
                {renderUserList(subRoom.users)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className={styles.bottom}>
        <button className={styles.createRoomButton} onClick={onCreateSubRoom}>
          <SvgResource type="add" />
          <span>创建子房间</span>
        </button>
      </div>
    </div>
  );
}
