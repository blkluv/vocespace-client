'use client';

import { forwardRef, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Popover,
  Radio,
  Tag,
  theme,
} from 'antd';
import { connect_endpoint } from '@/lib/std';
import {
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { GridLayout, TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { MessageInstance } from 'antd/es/message/interface';
import { ChildRoom, RoomSettings } from '@/lib/std/room';
import { ParticipantTileMini } from '../participant/mini';
import { GLayout } from '../layout/grid';
import { CheckboxGroupProps } from 'antd/es/checkbox';
import { createRoom, deleteRoom } from '@/lib/hooks/channel';

interface ChannelProps {
  roomName: string;
  messageApi: MessageInstance;
  participantId: string;
  onUpdate: () => Promise<void>;
  tracks: TrackReferenceOrPlaceholder[];
  settings: RoomSettings;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isActive?: boolean;
}

export interface ChannelExports {}

const CONNECT_ENDPOINT = connect_endpoint('/api/room-settings');

type RoomPrivacy = 'public' | 'private';

export const Channel = forwardRef<ChannelExports, ChannelProps>(
  (
    {
      roomName,
      settings,
      messageApi,
      participantId,
      onUpdate,
      tracks,
      collapsed,
      setCollapsed,
      isActive = false,
    }: ChannelProps,
    ref,
  ) => {
    const { t } = useI18n();

    const { token } = theme.useToken();
    const [selected, setSelected] = useState<'main' | 'sub'>('main');
    const [roomCreateModalOpen, setRoomCreateModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<ChildRoom | null>(null);
    const [mainJoinVis, setMainJoinVis] = useState<'hidden' | 'visible'>('hidden');
    const [roomJoinVis, setRoomJoinVis] = useState<number | null>(null);
    const [selfRoomName, setSelfRoomName] = useState<string>(() => {
      // 需要从settings中获取当前用户所在的子房间
      const childRoom = settings.children?.find((room) => {
        return room.participants.includes(participantId);
      });
      return childRoom ? childRoom.name : roomName;
    });
    const [subActiveKey, setSubActiveKey] = useState<string[]>([]);
    const [mainActiveKey, setMainActiveKey] = useState<string[]>(['main', 'sub']);
    const [roomPrivacy, setRoomPrivacy] = useState<RoomPrivacy>('public');
    const roomPrivacyOptions: CheckboxGroupProps<string>['options'] = [
      {
        label: t('channel.modal.privacy.public.title'),
        value: 'public',
      },
      {
        label: t('channel.modal.privacy.private.title'),
        value: 'private',
      },
    ];

    const childRooms = useMemo(() => {
      return settings.children || [];
    }, [settings.children]);
    const toggleCollapse = () => {
      setCollapsed(!collapsed);
    };
    const [childRoomName, setChildRoomName] = useState('');

    useEffect(() => {
      if (selfRoomName) {
        setSubActiveKey([selfRoomName]);
      }
      return () => {
        setSubActiveKey([]);
      };
    }, [selfRoomName]);

    const createChildRoom = async () => {
      if (childRoomName.trim() === '') {
        messageApi.error({
          content: t('channel.create.empty_name'),
          duration: 2,
        });
        return;
      }

      const response = await createRoom({
        hostRoom: roomName,
        roomName: childRoomName,
        ownerId: participantId,
        isPrivate: roomPrivacy === 'private',
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
      if (!selectedRoom) return;

      // 使用socket提醒所有子房间的参与者返回主房间 TODO
      // 暂时处理为：当房间中还有人就不能删除子房间
      if (
        (settings.children.find((room) => room.name === selectedRoom.name)?.participants.length ||
          0) > 0
      ) {
        messageApi.error({
          content: t('channel.delete.remain'),
          duration: 2,
        });
        return;
      }

      const response = await deleteRoom({
        roomName,
        selectedRoomName: selectedRoom.name,
      });

      if (!response.ok) {
        messageApi.error({
          content: t('channel.delete.error'),
          duration: 2,
        });
        return;
      } else {
        setSelectedRoom(null);
        await onUpdate();
        messageApi.success({
          content: t('channel.delete.success'),
          duration: 2,
        });
      }
    };

    const leaveChildRoom = async (room?: string) => {
      if (!selectedRoom && !room) return;

      const url = new URL(CONNECT_ENDPOINT, window.location.origin);
      url.searchParams.append('leaveChildRoom', 'true');
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomName,
          childRoom: room || selectedRoom?.name,
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
        setSelfRoomName(roomName);
        // setMainActiveKey(['main', 'sub']);
        setSubActiveKey([]);
        setSelectedRoom(null);
        await onUpdate();
        messageApi.success({
          content: t('channel.leave.success'),
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
        // 进入子房间后 subActiveKey 就是当前子房间的key
        setSelfRoomName(room);
        // setMainActiveKey(['sub']);
        await onUpdate();
        messageApi.success({
          content: t('channel.join.success'),
          duration: 2,
        });
      }
    };

    const joinMainRoom = async () => {
      // 设置为当前自己所在的房间
      await leaveChildRoom(selfRoomName);
    };

    const subContextItems: MenuProps['items'] = [
      {
        key: 'rename',
        label: t('channel.menu.rename'),
        disabled: selectedRoom?.ownerId !== participantId,
      },
      {
        key: 'delete',
        label: t('channel.menu.delete'),
        onClick: deleteChildRoom,
        disabled: selectedRoom?.ownerId !== participantId,
      },
      {
        key: 'leave',
        label: t('channel.menu.leave'),
        onClick: () => leaveChildRoom(),
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
        <GLayout tracks={mainTracks} style={{ height: '120px', position: 'relative' }}>
          <ParticipantTileMini settings={settings}></ParticipantTileMini>
        </GLayout>
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
          <GLayout tracks={subTracks} style={{ height: '120px', position: 'relative' }}>
            <ParticipantTileMini settings={settings}></ParticipantTileMini>
          </GLayout>
        );
      },
      [tracks, childRooms, settings],
    );

    const subChildren: CollapseProps['items'] = useMemo(() => {
      return childRooms.map((room, index) => ({
        key: room.name,
        label: (
          <div
            className={styles.room_header_wrapper}
            onMouseEnter={() => {
              setRoomJoinVis(index);
            }}
            onMouseLeave={() => {
              setRoomJoinVis(null);
            }}
          >
            <Dropdown
              trigger={['contextMenu']}
              menu={{ items: subContextItems }}
              onOpenChange={(open) => {
                if (open) {
                  setSelectedRoom(room);
                }
              }}
            >
              <div
                className={styles.room_header_wrapper_title}
                onClick={() => {
                  setSubActiveKey((prev) => {
                    if (prev.includes(room.name)) {
                      return prev.filter((r) => r !== room.name);
                    } else {
                      prev.push(room.name);
                    }
                    return prev;
                  });
                }}
              >
                {room.isPrivate ? <LockOutlined /> : <VideoCameraOutlined />}
                {room.name}
              </div>
            </Dropdown>
            <div
              className={styles.room_header_extra}
              style={{ visibility: roomJoinVis === index ? 'visible' : 'hidden' }}
            >
              <button onClick={() => addIntoRoom(room.name)} className="vocespace_button">
                <PlusCircleOutlined />
                {t('channel.menu.join')}
              </button>
            </div>
          </div>
        ),
        children: subContext(room.name),
        style: subStyle,
      }));
    }, [subContext, childRooms, selectedRoom, selfRoomName, roomJoinVis]);

    const mainItems: CollapseProps['items'] = useMemo(() => {
      return [
        {
          key: 'main',
          label: (
            <div
              className={styles.room_header_wrapper}
              onMouseEnter={() => {
                setMainJoinVis('visible');
              }}
              onMouseLeave={() => {
                setMainJoinVis('hidden');
              }}
            >
              <div
                className={styles.room_header_wrapper_title}
                onClick={() => {
                  setMainActiveKey((prev) => {
                    if (prev.includes('main')) {
                      return [];
                    }
                    return ['main', 'sub'];
                  });
                }}
              >
                <VideoCameraOutlined />
                <span>{t('channel.menu.main')}</span>
              </div>

              <div className={styles.room_header_extra} style={{ visibility: mainJoinVis }}>
                <button onClick={joinMainRoom} className="vocespace_button">
                  <PlusCircleOutlined />
                  {t('channel.menu.join')}
                </button>
              </div>
            </div>
          ),
          children: mainContext,
          style: panelStyle,
        },
        {
          key: 'sub',
          label: (
            <div className={styles.room_header_wrapper}>
              <div className={styles.room_header_wrapper_title}>
                {/* <VideoCameraOutlined /> */}
                <span>{t('channel.menu.sub')}</span>
              </div>
              <div className={styles.room_header_extra} style={{ height: '30px' }}>
                <button
                  className="vocespace_button_text"
                  style={{ height: '100%' }}
                  onClick={() => {
                    setRoomCreateModalOpen(true);
                  }}
                >
                  <PlusCircleOutlined></PlusCircleOutlined>
                </button>
              </div>
            </div>
          ),
          children: (
            <Collapse
              bordered={false}
              defaultActiveKey={subActiveKey}
              activeKey={subActiveKey}
              expandIcon={() => undefined}
              style={{ background: token.colorBgContainer }}
              items={subChildren}
            />
          ),
          style: panelStyle,
        },
      ];
    }, [mainContext, subChildren, childRooms, subActiveKey, mainJoinVis]);

    if (collapsed) {
      return (
        <div
          className={`${styles.container} ${styles.collapsed}`}
          style={{
            width: isActive ? 'fit-content' : '0px',
          }}
        >
          <Button
            type="text"
            onClick={toggleCollapse}
            icon={<MenuUnfoldOutlined />}
            style={{
              backgroundColor: '#1a1a1a',
              height: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              paddingTop: 20,
            }}
          ></Button>
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
                <Tag color="#22CCEE">{Object.keys(settings.participants).length} 在线</Tag>
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
                defaultActiveKey={['main', 'sub']}
                activeKey={mainActiveKey}
                expandIcon={() => undefined}
                style={{ background: token.colorBgContainer }}
                items={mainItems}
              />
            </div>
          </div>

          {/* Bottom */}
          {/* <div className={styles.bottom}>
          <Button
            onClick={() => {
              setRoomCreateModalOpen(true);
            }}
            type="primary"
            style={{ width: '100%' }}
            icon={<SvgResource type="add" svgSize={16} />}
          >
            <span>{t('channel.menu.create')}</span>
          </Button>
        </div> */}
        </div>
        <Modal
          open={roomCreateModalOpen}
          title={t('channel.modal.title')}
          onCancel={() => {
            setRoomCreateModalOpen(false);
          }}
          onOk={createChildRoom}
          okText={t('channel.modal.ok')}
          cancelText={t('channel.modal.cancel')}
        >
          <p>{t('channel.modal.desc.0')}</p>
          <p>{t('channel.modal.desc.1')}</p>
          <Input
            placeholder={t('channel.modal.placeholder')}
            style={{
              outline: '1px solid #22CCEE',
            }}
            value={childRoomName}
            onChange={(e) => {
              setChildRoomName(e.target.value);
            }}
          ></Input>
          <div className={styles.modal_item}>
            <Popover
              content={
                <div style={{ maxWidth: 200 }}>
                  <p>{t('channel.modal.privacy.public.desc')}</p>
                  <p>{t('channel.modal.privacy.private.desc')}</p>
                </div>
              }
              title={t('channel.modal.privacy.title')}
            >
              <span className={styles.modal_item_label}>
                <LockOutlined />
                {t('channel.modal.privacy.title')}:
              </span>
            </Popover>
            <Radio.Group
              options={roomPrivacyOptions}
              defaultValue={roomPrivacy}
              value={roomPrivacy}
              onChange={(e) => {
                setRoomPrivacy(e.target.value as RoomPrivacy);
              }}
            />
          </div>
        </Modal>
      </>
    );
  },
);
