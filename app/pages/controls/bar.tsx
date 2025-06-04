import { useI18n } from '@/lib/i18n/i18n';
import {
  ChatIcon,
  DisconnectButton,
  LeaveIcon,
  MediaDeviceMenu,
  StartMediaButton,
  TrackMutedIndicator,
  TrackReferenceOrPlaceholder,
  TrackToggle,
  useEnsureTrackRef,
  useLocalParticipantPermissions,
  useMaybeLayoutContext,
  useMaybeRoomContext,
  usePersistentUserChoices,
  useTrackVolume,
} from '@livekit/components-react';
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Dropdown,
  List,
  MenuProps,
  message,
  Modal,
  Select,
} from 'antd';
import { Participant, Track } from 'livekit-client';
import * as React from 'react';
import { SettingToggle } from './setting_toggle';
import { SvgResource } from '@/app/resources/svg';
import styles from '@/styles/controls.module.scss';
import { Settings, SettingsExports, TabKey } from './settings';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { useRecoilState } from 'recoil';
import { socket, userState, virtualMaskState } from '@/app/rooms/[roomName]/PageClientImpl';
import { ParticipantSettings, RoomSettings } from '@/lib/hooks/room_settings';
import { randomColor, src, UserStatus } from '@/lib/std';
import { EnhancedChat } from '@/app/pages/chat/chat';
import { ChatToggle } from './chat_toggle';
import { RecordButton } from './record_button';
import { MoreButton } from './more_button';
import Search from 'antd/es/input/Search';
import { WsInviteDevice } from '@/lib/std/device';

/** @public */
export type ControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  chat?: boolean;
  screenShare?: boolean;
  leave?: boolean;
  settings?: boolean;
};

/** @public */
export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  variation?: 'minimal' | 'verbose' | 'textOnly';
  controls?: ControlBarControls;
  /**
   * If `true`, the user's device choices will be persisted.
   * This will enable the user to have the same device choices when they rejoin the room.
   * @defaultValue true
   * @alpha
   */
  saveUserChoices?: boolean;
  updateSettings: (newSettings: Partial<ParticipantSettings>) => Promise<boolean | undefined>;
  setUserStatus: (status: UserStatus | string) => Promise<void>;
  roomSettings: RoomSettings;
}

export interface ControlBarExport {
  openSettings: (key: TabKey) => void;
}

/**
 * The `ControlBar` prefab gives the user the basic user interface to control their
 * media devices (camera, microphone and screen share), open the `Chat` and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `TrackToggle`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ControlBar />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const Controls = React.forwardRef<ControlBarExport, ControlBarProps>(
  (
    {
      variation,
      controls,
      saveUserChoices = true,
      onDeviceError,
      updateSettings,
      setUserStatus,
      roomSettings,
      ...props
    }: ControlBarProps,
    ref,
  ) => {
    const { t } = useI18n();
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    const [settingVis, setSettingVis] = React.useState(false);
    const layoutContext = useMaybeLayoutContext();
    const inviteTextRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (layoutContext?.widget.state?.showChat !== undefined) {
        setIsChatOpen(layoutContext?.widget.state?.showChat);
      }
    }, [layoutContext?.widget.state?.showChat]);
    const isTooLittleSpace = useMediaQuery(`(max-width: ${isChatOpen ? 1000 : 760}px)`);

    const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose';
    variation ??= defaultVariation;

    const visibleControls = { leave: true, ...controls };

    const localPermissions = useLocalParticipantPermissions();

    if (!localPermissions) {
      visibleControls.camera = false;
      visibleControls.chat = false;
      visibleControls.microphone = false;
      visibleControls.screenShare = false;
    } else {
      visibleControls.camera ??= localPermissions.canPublish;
      visibleControls.microphone ??= localPermissions.canPublish;
      visibleControls.screenShare ??= localPermissions.canPublish;
      visibleControls.chat ??= localPermissions.canPublishData && controls?.chat;
    }

    const showIcon = React.useMemo(
      () => variation === 'minimal' || variation === 'verbose',
      [variation],
    );
    const showText = React.useMemo(
      () => variation === 'textOnly' || variation === 'verbose',
      [variation],
    );

    const browserSupportsScreenSharing = supportsScreenSharing();

    const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(false);

    const onScreenShareChange = React.useCallback(
      (enabled: boolean) => {
        setIsScreenShareEnabled(enabled);
      },
      [setIsScreenShareEnabled],
    );

    const htmlProps = { className: 'lk-control-bar', ...props };

    const {
      userChoices,
      saveAudioInputEnabled,
      saveVideoInputEnabled,
      saveAudioInputDeviceId,
      saveVideoInputDeviceId,
      saveUsername,
    } = usePersistentUserChoices({ preventSave: !saveUserChoices });

    const microphoneOnChange = React.useCallback(
      (enabled: boolean, isUserInitiated: boolean) =>
        isUserInitiated ? saveAudioInputEnabled(enabled) : null,
      [saveAudioInputEnabled],
    );

    const cameraOnChange = React.useCallback(
      (enabled: boolean, isUserInitiated: boolean) =>
        isUserInitiated ? saveVideoInputEnabled(enabled) : null,
      [saveVideoInputEnabled],
    );

    // settings ------------------------------------------------------------------------------------------
    const room = useMaybeRoomContext();
    const [key, setKey] = React.useState<TabKey>('general');
    const settingsRef = React.useRef<SettingsExports>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [uState, setUState] = useRecoilState(userState);
    const [virtualMask, setVirtualMask] = useRecoilState(virtualMaskState);
    const closeSetting = async () => {
      if (settingsRef.current && room) {
        settingsRef.current.removeVideo();
        // 更新用户名 ------------------------------------------------------
        const newName = settingsRef.current.username;
        if (
          newName !== '' &&
          newName !== (room.localParticipant?.name || room.localParticipant.identity)
        ) {
          saveUsername(newName);
          await room.localParticipant?.setMetadata(JSON.stringify({ name: newName }));
          await room.localParticipant.setName(newName);
          messageApi.success(t('msg.success.user.username.change'));
        } else if (newName == (room.localParticipant?.name || room.localParticipant.identity)) {
        } else {
          messageApi.error(t('msg.error.user.username.change'));
        }
        // 更新其他设置 ------------------------------------------------
        const { volume, screenBlur, blur, virtual } = settingsRef.current.state;

        setUState((prev) => ({
          ...prev,
          volume,
          screenBlur,
          blur,
          virtual,
        }));
        await updateSettings(settingsRef.current.state);
        // 通知socket，进行状态的更新 -----------------------------------
        socket.emit('update_user_status');
        socket.emit('reload_virtual', {
          identity: room.localParticipant.identity,
          roomId: room.name,
          reloading: false,
        });
      }
      setVirtualMask(false);
    };

    // 打开设置面板 -----------------------------------------------------------
    const openSettings = async (tab: TabKey) => {
      setKey(tab);
      setSettingVis(true);
      if (settingsRef.current && tab === 'video') {
        await settingsRef.current.startVideo();
      }
    };

    React.useImperativeHandle(
      ref,
      () =>
        ({
          openSettings,
        } as ControlBarExport),
    );

    // [chat] -----------------------------------------------------------------------------------------------------
    const [chatOpen, setChatOpen] = React.useState(false);
    const onChatClose = () => {
      setChatOpen(false);
    };
    const sendFileConfirm = (onOk: () => Promise<void>) => {
      Modal.confirm({
        title: t('common.send'),
        content: t('common.send_file_or'),
        onOk,
      });
    };

    // [more] -----------------------------------------------------------------------------------------------------
    const [openMore, setOpenMore] = React.useState(false);
    const [moreType, setMoreType] = React.useState<'record' | 'participant'>('record');
    const [openShareModal, setOpenShareModal] = React.useState(false);
    const [isMicDisabled, setIsMicDisabled] = React.useState(false);
    const [isCamDisabled, setIsCamDisabled] = React.useState(false);
    const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
    const [isScreenShareDisabled, setIsScreenShareDisabled] = React.useState(false);
    const participantList = React.useMemo(() => {
      return Object.entries(roomSettings.participants);
    }, [roomSettings]);
    const isOwner = React.useMemo(() => {
      return roomSettings.ownerId === room?.localParticipant.identity;
    }, [roomSettings.ownerId, room?.localParticipant.identity]);
    const optItems: MenuProps['items'] = React.useMemo(() => {
      return [
        {
          label: t('more.participant.set.invite.title'),
          key: 'invite',
          type: 'group',
          children: [
            {
              key: 'invite.audio',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.invite.audio')}</span>
              ),
              icon: <SvgResource type="audio" svgSize={16} />,
              disabled: isMicDisabled,
            },
            {
              key: 'invite.video',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.invite.video')}</span>
              ),
              icon: <SvgResource type="video" svgSize={16} />,
              disabled: isCamDisabled,
            },
            {
              key: 'invite.wave',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.invite.wave')}</span>
              ),
              icon: <SvgResource type="wave" svgSize={16} />,
            },
            {
              key: 'invite.share',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.invite.share')}</span>
              ),
              icon: <SvgResource type="screen" svgSize={16} />,
              disabled: isScreenShareDisabled,
            },
          ],
        },
        {
          label: t('more.participant.set.control.title'),
          key: 'control',
          type: 'group',
          children: [
            {
              key: 'control.trans',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.control.trans')}</span>
              ),
              icon: <SvgResource type="switch" svgSize={16} />,
              disabled: !isOwner,
            },
            {
              key: 'control.change_name',
              label: (
                <span style={{ marginLeft: '8px' }}>
                  {t('more.participant.set.control.change_name')}
                </span>
              ),
              icon: <SvgResource type="user" svgSize={16} />,
              disabled: !isOwner,
            },
            {
              key: 'control.mute_audio',
              label: (
                <span style={{ marginLeft: '8px' }}>
                  {t('more.participant.set.control.mute.audio')}
                </span>
              ),
              icon: <SvgResource type="volume" svgSize={16} />,
              disabled: !isOwner,
            },
          ],
        },
        {
          label: t('more.participant.set.safe.title'),
          key: 'safe',
          type: 'group',
          children: [
            {
              key: 'safe.remove',
              label: (
                <span style={{ marginLeft: '8px' }}>{t('more.participant.set.safe.remove')}</span>
              ),
              icon: <SvgResource type="leave" svgSize={16} />,
              disabled: !isOwner,
            },
          ],
        },
      ];
    }, [isCamDisabled, isMicDisabled, isOwner, isScreenShareDisabled]);

    const handleOptClick: MenuProps['onClick'] = (e) => {
      console.warn('handleOptClick', e);
      if (room?.localParticipant && selectedParticipant) {
        let device = Track.Source.Unknown;
        const inviteDevice = () => {
          socket.emit('invite_device', {
            room: room.name,
            senderName: room.localParticipant.name,
            senderId: room.localParticipant.identity,
            receiverId: selectedParticipant.identity,
            socketId: roomSettings.participants[selectedParticipant.identity].socketId,
            device,
          } as WsInviteDevice);
        };

        switch (e.key) {
          case 'invite.wave': {
            socket.emit('wave', {
              room: room.name,
              senderName: room.localParticipant.name,
              senderId: room.localParticipant.identity,
              receiverId: selectedParticipant.identity,
              socketId: roomSettings.participants[selectedParticipant.identity].socketId,
            });
            const audioSrc = src('/audios/vocespacewave.m4a');
            const audio = new Audio(audioSrc);
            audio.volume = 1.0;
            audio.play().then(() => {
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.remove();
              }, 2000);
            });
            break;
          }
          case 'invite.audio': {
            device = Track.Source.Microphone;
            inviteDevice();
            break;
          }
          case 'invite.video': {
            device = Track.Source.Camera;
            inviteDevice();
            break;
          }
          case 'invite.share': {
            device = Track.Source.ScreenShare;
            inviteDevice();
            break;
          }
          default:
            break;
        }
      }
    };

    const optOpen = (open: boolean, participant: Participant) => {
      if (!open) {
        return;
      }
      setIsMicDisabled(participant.isMicrophoneEnabled);
      setIsCamDisabled(participant.isCameraEnabled);
      setIsScreenShareDisabled(participant.isScreenShareEnabled);
      setSelectedParticipant(participant);
    };

    const optMenu = {
      items: optItems,
      onClick: handleOptClick,
    };

    return (
      <div {...htmlProps} className={styles.controls}>
        {contextHolder}
        <div className={styles.controls_left}>
          {visibleControls.microphone && (
            <div className="lk-button-group">
              <TrackToggle
                source={Track.Source.Microphone}
                showIcon={showIcon}
                onChange={microphoneOnChange}
                onDeviceError={(error) =>
                  onDeviceError?.({ source: Track.Source.Microphone, error })
                }
              >
                {showText && t('common.device.microphone')}
              </TrackToggle>
              <div className="lk-button-group-menu">
                <MediaDeviceMenu
                  kind="audioinput"
                  onActiveDeviceChange={(_kind, deviceId) =>
                    saveAudioInputDeviceId(deviceId ?? 'default')
                  }
                />
              </div>
            </div>
          )}
          {visibleControls.camera && (
            <div className="lk-button-group">
              <TrackToggle
                source={Track.Source.Camera}
                showIcon={showIcon}
                onChange={cameraOnChange}
                onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
              >
                {showText && t('common.device.camera')}
              </TrackToggle>
              <div className="lk-button-group-menu">
                <MediaDeviceMenu
                  kind="videoinput"
                  onActiveDeviceChange={(_kind, deviceId) =>
                    saveVideoInputDeviceId(deviceId ?? 'default')
                  }
                />
              </div>
            </div>
          )}
          {visibleControls.screenShare && browserSupportsScreenSharing && (
            <TrackToggle
              source={Track.Source.ScreenShare}
              captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
              showIcon={showIcon}
              onChange={onScreenShareChange}
              onDeviceError={(error) =>
                onDeviceError?.({ source: Track.Source.ScreenShare, error })
              }
            >
              {showText &&
                (isScreenShareEnabled ? t('common.stop_share') : t('common.share_screen'))}
            </TrackToggle>
          )}
          {visibleControls.chat && (
            <ChatToggle
              enabled={chatOpen}
              onClicked={() => {
                setChatOpen(!chatOpen);
              }}
            ></ChatToggle>
          )}

          <SettingToggle
            enabled={settingVis}
            onClicked={async () => {
              // setVirtualEnabled(false);
              setSettingVis(true);
            }}
          ></SettingToggle>
          <MoreButton setOpenMore={setOpenMore} setMoreType={setMoreType}></MoreButton>
        </div>

        {visibleControls.leave && (
          <DisconnectButton>
            {showIcon && <LeaveIcon />}
            {showText && t('common.leave')}
          </DisconnectButton>
        )}
        {/* <StartMediaButton /> */}
        {room && (
          <EnhancedChat
            messageApi={messageApi}
            open={chatOpen}
            setOpen={setChatOpen}
            onClose={onChatClose}
            room={room}
            sendFileConfirm={sendFileConfirm}
          ></EnhancedChat>
        )}
        <Drawer
          style={{ backgroundColor: '#111', padding: 0, margin: 0, color: '#fff' }}
          title={t('common.setting')}
          placement="right"
          closable={false}
          width={'640px'}
          open={settingVis}
          onClose={() => {
            setSettingVis(false);
            closeSetting();
          }}
          extra={setting_drawer_header({
            on_clicked: () => {
              setSettingVis(false);
              closeSetting();
            },
          })}
        >
          <div className={styles.setting_container}>
            {room && (
              <Settings
                ref={settingsRef}
                close={settingVis}
                messageApi={messageApi}
                room={room.name}
                username={userChoices.username}
                tab={{ key, setKey }}
                // saveChanges={saveChanges}
                setUserStatus={setUserStatus}
                localParticipant={room.localParticipant}
              ></Settings>
            )}
          </div>
        </Drawer>
        <Drawer
          style={{ backgroundColor: '#111', padding: 0, margin: 0, color: '#fff' }}
          styles={{
            body: {
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            },
          }}
          title={
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <SvgResource type="user" svgSize={16}></SvgResource>
              <span>{t('more.participant.manage')}</span>
            </div>
          }
          placement="right"
          closable={false}
          width={'540px'}
          open={openMore}
          onClose={() => {
            setOpenMore(false);
            // closeSetting();
          }}
          extra={setting_drawer_header({
            on_clicked: () => {
              setOpenMore(false);
              // closeSetting();
            },
          })}
        >
          <div className={styles.setting_container}>
            {moreType === 'participant' && (
              <div className={styles.setting_container_more}>
                <hr />
                <div className={styles.setting_container_more_header}>
                  <Select
                    showSearch
                    placeholder={t('more.participant.search')}
                    allowClear
                    style={{ width: 'calc(100% - 60px)' }}
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={participantList.map((item) => ({
                      label: item[1].name,
                      value: item[0],
                    }))}
                  ></Select>
                  <Button type="primary" onClick={() => setOpenShareModal(true)}>
                    <SvgResource type="user_add" svgSize={16}></SvgResource>
                  </Button>
                </div>
                {room && (
                  <List
                    itemLayout="horizontal"
                    dataSource={participantList}
                    renderItem={(item, index) => (
                      <List.Item>
                        <div className={styles.particepant_item}>
                          <div className={styles.particepant_item_left}>
                            <Avatar
                              size={'large'}
                              style={{
                                backgroundColor: randomColor(item[1].name),
                              }}
                            >
                              {item[1].name.substring(0, 2)}
                            </Avatar>
                            <span>{item[1].name}</span>
                            {roomSettings.ownerId !== '' && item[0] === roomSettings.ownerId && (
                              <span className={styles.particepant_item_owner}>
                                ( {t('more.participant.manager')} )
                              </span>
                            )}
                          </div>
                          {room.getParticipantByIdentity(item[0]) && (
                            <div className={styles.particepant_item_right}>
                              <TrackMutedIndicator
                                trackRef={{
                                  participant: room.getParticipantByIdentity(item[0])!,
                                  source: Track.Source.Microphone,
                                }}
                                show={'always'}
                              ></TrackMutedIndicator>
                              <TrackMutedIndicator
                                trackRef={{
                                  participant: room.getParticipantByIdentity(item[0])!,
                                  source: Track.Source.Camera,
                                }}
                                show={'always'}
                              ></TrackMutedIndicator>
                              {room.localParticipant.identity !== item[0] && (
                                <Dropdown
                                  menu={optMenu}
                                  trigger={['click']}
                                  onOpenChange={(open) =>
                                    optOpen(open, room.getParticipantByIdentity(item[0])!)
                                  }
                                >
                                  <Button shape="circle" type="text">
                                    <SvgResource type="more2" svgSize={16}></SvgResource>
                                  </Button>
                                </Dropdown>
                              )}
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </Drawer>
        <Modal
          open={openShareModal}
          onCancel={() => setOpenShareModal(false)}
          title={t('more.participant.invite.title')}
          okText={t('more.participant.invite.ok')}
          cancelText={t('more.participant.invite.cancel')}
          onOk={async () => {
            await navigator.clipboard.writeText(
              inviteTextRef.current?.innerText ||
                `${t('more.participant.invite.link')}: ${window.location.href}`,
            );
            setOpenShareModal(false);
          }}
        >
          <div className={styles.invite_container} ref={inviteTextRef}>
            <div className={styles.invite_container_item}>
              {room?.localParticipant.name} &nbsp;
              {t('more.participant.invite.texts.0')}
            </div>
            <div className={styles.invite_container_item}>
              <div className={styles.invite_container_item_justify}>
                {t('more.participant.invite.texts.1')}
                {t('more.participant.invite.web')}
                {t('more.participant.invite.add')}
              </div>
              <div>
                {t('more.participant.invite.link')}: {window.location.href}
              </div>
            </div>
            <div className={styles.invite_container_item}>
              <div className={styles.invite_container_item_justify}>
                {t('more.participant.invite.texts.2')}
                <strong>{`${window.location.href}`}</strong>
                {t('more.participant.invite.add')}
              </div>
              <div>
                {t('more.participant.invite.room')}: {room?.name}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
);

export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = React.useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}

export function supportsScreenSharing(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    !!navigator.mediaDevices.getDisplayMedia
  );
}

export const setting_drawer_header = ({
  on_clicked,
}: {
  on_clicked: () => void;
}): React.ReactNode => {
  return (
    <div>
      <Button type="text" shape="circle" onClick={on_clicked}>
        <SvgResource type="close" color="#fff" svgSize={16}></SvgResource>
      </Button>
    </div>
  );
};
