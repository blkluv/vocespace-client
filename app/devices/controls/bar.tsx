import { useI18n } from '@/lib/i18n/i18n';
import {
  ChatIcon,
  DisconnectButton,
  LeaveIcon,
  MediaDeviceMenu,
  StartMediaButton,
  TrackToggle,
  useLocalParticipantPermissions,
  useMaybeLayoutContext,
  useMaybeRoomContext,
  usePersistentUserChoices,
  useTrackVolume,
} from '@livekit/components-react';
import { Button, Drawer, message, Modal } from 'antd';
import { Track } from 'livekit-client';
import * as React from 'react';
import { SettingToggle } from './setting_toggle';
import { SvgResource } from '@/app/resources/svg';
import styles from '@/styles/controls.module.scss';
import { Settings, SettingsExports, TabKey } from './settings';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { useRecoilState } from 'recoil';
import { socket, userState, virtualMaskState } from '@/app/rooms/[roomName]/PageClientImpl';
import { ParticipantSettings } from '@/lib/hooks/room_settings';
import { UserStatus } from '@/lib/std';
import { EnhancedChat } from '@/app/pages/chat/chat';
import { ChatToggle } from './chat_toggle';

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
      ...props
    }: ControlBarProps,
    ref,
  ) => {
    const { t } = useI18n();
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    const [settingVis, setSettingVis] = React.useState(false);
    const layoutContext = useMaybeLayoutContext();

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
    const [virtualEnabled, setVirtualEnabled] = React.useState(false);
    const [modelRole, setModelRole] = React.useState<ModelRole>(ModelRole.None);
    const [modelBg, setModelBg] = React.useState<ModelBg>(ModelBg.ClassRoom);
    const [compare, setCompare] = React.useState(false);
    const settingsRef = React.useRef<SettingsExports>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [device, setDevice] = useRecoilState(userState);
    const [volume, setVolume] = React.useState(device.volume);
    const [videoBlur, setVideoBlur] = React.useState(device.blur);
    const [screenBlur, setScreenBlur] = React.useState(device.screenBlur);
    const [virtualMask, setVirtualMask] = useRecoilState(virtualMaskState);
    const closeSetting = () => {
      setCompare(false);
      if (modelRole !== ModelRole.None) {
        setVirtualEnabled(true);
      } else {
        setVirtualEnabled(false);
      }
      if (settingsRef.current) {
        settingsRef.current.removeVideo();
      }
      setVirtualMask(false);
    };
    // 监听虚拟角色相关的变化 -------------------------------------------------
    React.useEffect(() => {
      setDevice({
        ...device,
        virtualRole: {
          enabled: virtualEnabled,
          role: modelRole,
          bg: modelBg,
        },
      });
      // 更新设置
      updateSettings({
        virtual: {
          enabled: virtualEnabled,
          role: modelRole,
          bg: modelBg,
        },
      }).then(() => {
        socket.emit('update_user_status');
      });
    }, [virtualEnabled, modelRole, modelBg]);
    const saveChanges = async (key: TabKey) => {
      let update;
      switch (key) {
        case 'general': {
          const new_name = settingsRef.current?.username;
          if (new_name) {
            saveUsername(new_name);
            if (room) {
              try {
                await room.localParticipant?.setMetadata(JSON.stringify({ name: new_name }));
                await room.localParticipant.setName(new_name);
                update = {
                  name: new_name,
                };
                messageApi.success(t('msg.success.user.username.change'));
              } catch (error) {
                messageApi.error(t('msg.error.user.username.change'));
              }
            }
          }
          break;
        }
        case 'audio': {
          setDevice({ ...device, volume });
          update = {
            volume,
          };
          break;
        }
        case 'video': {
          setDevice({ ...device, blur: videoBlur });
          update = {
            blur: videoBlur,
          };
          break;
        }
        case 'screen': {
          setDevice({ ...device, screenBlur });
          update = {
            screenBlur,
          };
          break;
        }
      }
      await updateSettings({ ...update });
      // 通知socket，进行状态的更新
      socket.emit('update_user_status');
    };

    const openSettings = (tab: TabKey) => {
      setKey(tab);
      setSettingVis(true);
    };

    React.useImperativeHandle(
      ref,
      () =>
        ({
          openSettings,
        } as ControlBarExport),
    );

    const setUserStatus = async (status: UserStatus) => {
      let newStatus = {
        status: status,
      };
      switch (status) {
        case UserStatus.Online: {
          if (room) {
            room.localParticipant.setMicrophoneEnabled(true);
            room.localParticipant.setCameraEnabled(true);
            room.localParticipant.setScreenShareEnabled(false);
            if (volume == 0) {
              const newVolume = 80;
              setVolume(newVolume);
              // 确保设备状态同步更新
              setDevice((prev) => ({
                ...prev,
                volume: newVolume,
              }));
              Object.assign(newStatus, { volume: newVolume });
            }
          }
          break;
        }
        case UserStatus.Leisure: {
          setVideoBlur(0.15);
          setScreenBlur(0.15);
          setDevice((prev) => ({
            ...prev,
            blur: 0.15,
            screenBlur: 0.15,
          }));
          Object.assign(newStatus, { blur: 0.15, screenBlur: 0.15 });
          break;
        }
        case UserStatus.Busy: {
          setVideoBlur(0.15);
          setScreenBlur(0.15);
          setVolume(0);
          setVirtualEnabled(false);
          setModelRole(ModelRole.None);
          setModelBg(ModelBg.ClassRoom);
          setDevice((prev) => ({
            ...prev,
            blur: 0.15,
            screenBlur: 0.15,
            volume: 0,
            virtualRole: {
              ...prev.virtualRole,
              enabled: false,
              bg: ModelBg.ClassRoom,
              role: ModelRole.None,
            },
          }));

          Object.assign(newStatus, { blur: 0.15, screenBlur: 0.15, volume: 0 });
          break;
        }
        case UserStatus.Offline: {
          if (room) {
            room.localParticipant.setMicrophoneEnabled(false);
            room.localParticipant.setCameraEnabled(false);
            room.localParticipant.setScreenShareEnabled(false);
            setDevice((prev) => ({
              ...prev,
              virtualRole: {
                ...prev.virtualRole,
                enabled: false,
                bg: ModelBg.ClassRoom,
                role: ModelRole.None,
              },
            }));
          }
          break;
        }
      }

      await updateSettings(newStatus);
      // 通知socket，进行状态的更新
      socket.emit('update_user_status');
    };

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
            onClicked={() => {
              // setVirtualEnabled(false);
              setSettingVis(true);
            }}
          ></SettingToggle>
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
                virtual={{
                  enabled: virtualEnabled,
                  setEnabled: setVirtualEnabled,
                  modelRole: modelRole,
                  setModelRole: setModelRole,
                  modelBg: modelBg,
                  setModelBg: setModelBg,
                  compare,
                  setCompare,
                }}
                ref={settingsRef}
                messageApi={messageApi}
                microphone={{
                  audio: {
                    volume: volume,
                    setVolume,
                  },
                }}
                camera={{
                  video: {
                    blur: videoBlur,
                    setVideoBlur,
                  },
                  screen: {
                    blur: screenBlur,
                    setScreenBlur,
                  },
                }}
                room={room.name}
                username={userChoices.username}
                tab={{ key, setKey }}
                saveChanges={saveChanges}
                setUserStatus={setUserStatus}
                localParticipant={room.localParticipant}
              ></Settings>
            )}
          </div>
        </Drawer>
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
