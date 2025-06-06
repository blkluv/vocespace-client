import {
  connect_endpoint,
  getServerIp,
  is_web,
  src,
  UserDefineStatus,
  UserStatus,
} from '@/lib/std';
import {
  CarouselLayout,
  ConnectionStateToast,
  FocusLayoutContainer,
  GridLayout,
  isTrackReference,
  LayoutContextProvider,
  RoomAudioRenderer,
  TrackReference,
  useCreateLayoutContext,
  useMaybeRoomContext,
  usePinnedTracks,
  useTracks,
  VideoConferenceProps,
  WidgetState,
} from '@livekit/components-react';
import {
  ConnectionState,
  LocalTrackPublication,
  Participant,
  ParticipantEvent,
  RoomEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ControlBarExport, Controls } from './bar';
import { useRecoilState } from 'recoil';
import { ParticipantItem } from '../participant/tile';
import { useRoomSettings } from '@/lib/hooks/room_settings';
import { MessageInstance } from 'antd/es/message/interface';
import { NotificationInstance } from 'antd/es/notification/interface';
import { useI18n } from '@/lib/i18n/i18n';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { licenseState, socket, userState } from '@/app/rooms/[roomName]/PageClientImpl';
import { useRouter } from 'next/navigation';
import { ControlType, WsControlParticipant, WsInviteDevice, WsTo } from '@/lib/std/device';
import { Button } from 'antd';

export interface VideoContainerProps extends VideoConferenceProps {
  messageApi: MessageInstance;
  noteApi: NotificationInstance;
}

export interface VideoContainerExports {
  removeLocalSettings: () => Promise<void>;
}
const IP = process.env.SERVER_NAME ?? getServerIp() ?? 'localhost';
const ROOM_API_URL = connect_endpoint('/api/room');
export const VideoContainer = forwardRef<VideoContainerExports, VideoContainerProps>(
  (
    {
      chatMessageFormatter,
      chatMessageDecoder,
      chatMessageEncoder,
      SettingsComponent,
      noteApi,
      messageApi,
      ...props
    }: VideoContainerProps,
    ref,
  ) => {
    const room = useMaybeRoomContext();

    const [init, setInit] = useState(true);
    const { t } = useI18n();
    const [uState, setUState] = useRecoilState(userState);
    const [uLicenseState, setULicenseState] = useRecoilState(licenseState);
    const controlsRef = React.useRef<ControlBarExport>(null);
    const waveAudioRef = React.useRef<HTMLAudioElement>(null);
    const [isFocus, setIsFocus] = useState(false);
    const [cacheWidgetState, setCacheWidgetState] = useState<WidgetState>();
    const router = useRouter();
    const { settings, updateSettings, fetchSettings, clearSettings, updateOwnerId, updateRecord } =
      useRoomSettings(
        room?.name || '', // 房间 ID
        room?.localParticipant?.identity || '', // 参与者 ID
      );
    useEffect(() => {
      if (!room || room.state !== ConnectionState.Connected) return;

      const syncSettings = async () => {
        // 将当前参与者的基础设置发送到服务器 ----------------------------------------------------------
        await updateSettings({
          name: room.localParticipant.name || room.localParticipant.identity,
          blur: uState.blur,
          screenBlur: uState.screenBlur,
          volume: uState.volume,
          status: UserStatus.Online,
          socketId: socket.id,
          virtual: {
            enabled: false,
            role: ModelRole.None,
            bg: ModelBg.ClassRoom,
          },
        });
      };

      if (init) {
        syncSettings().then(() => {
          // 新的用户更新到服务器之后，需要给每个参与者发送一个websocket事件，通知他们更新用户状态
          socket.emit('update_user_status');
        });
        setInit(false);
      }

      // license 检测 -----------------------------------------------------------------------------
      const checkLicense = async () => {
        let url = `https://space.voce.chat/api/license/${IP}`;
        const response = await fetch(url, {
          method: 'GET',
        });
        if (response.ok) {
          const { id, email, domains, created_at, expires_at, ilimit, value } =
            await response.json();
          setULicenseState((prev) => ({
            ...prev,
            id,
            email,
            domains,
            created_at,
            expires_at,
            ilimit,
            value,
          }));
        }
      };

      if (uLicenseState.value !== '') {
        if (!(IP === 'localhost' || IP.startsWith('192.168.'))) {
          checkLicense();
        }
      } else {
        let value = window.localStorage.getItem('license');
        if (value && value !== '') {
          setULicenseState((prev) => ({
            ...prev,
            value,
          }));
        }
      }

      // 监听服务器的提醒事件的响应 -------------------------------------------------------------------
      socket.on('wave_response', (msg: WsTo) => {
        if (msg.receiverId === room.localParticipant.identity && msg.room === room.name) {
          waveAudioRef.current?.play();
          noteApi.info({
            message: `${msg.senderName} ${t('common.wave_msg')}`,
          });
        }
      });

      // 监听服务器的用户状态更新事件 -------------------------------------------------------------------
      socket.on('user_status_updated', async () => {
        // 调用fetchSettings
        await fetchSettings();
      });

      // 房间事件监听器 --------------------------------------------------------------------------------
      const onParticipantConnected = async (participant: Participant) => {
        console.warn('onParticipantConnected', participant);
        // 通过许可证判断人数，free为5人，pro为20人，若超过则拒绝加入并给出提示
        let user_limit = 5;
        if (uLicenseState.id && uLicenseState.value! == '') {
          if (uLicenseState.ilimit === 'pro') {
            user_limit = 20;
          }
        }

        if (room.remoteParticipants.size > user_limit) {
          if (room.localParticipant.identity === participant.identity) {
            messageApi.error({
              content: t('common.full_user'),
              duration: 3,
            });
            room.disconnect(true);
          }
          return;
        }
      };
      const onParticipantDisConnected = async (participant: Participant) => {
        socket.emit('mouse_remove', {
          room: room.name,
          senderName: participant.name || participant.identity,
          senderId: participant.identity,
          receiverId: '',
          receSocketId: '',
        });
        // do clearSettings but use leave participant
        await clearSettings(participant.identity);
      };
      // 监听远程参与者连接事件 --------------------------------------------------------------------------
      room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
      // room.on(RoomEvent.TrackSub)
      // 监听本地用户开关摄像头事件 ----------------------------------------------------------------------
      const onTrackHandler = (track: TrackPublication) => {
        if (track.source === Track.Source.Camera) {
          // 需要判断虚拟形象是否开启，若开启则需要关闭
          if (
            uState.virtual.enabled ||
            settings.participants[room.localParticipant.identity]?.virtual.enabled
          ) {
            setUState((prev) => ({
              ...prev,
              virtual: {
                ...prev.virtual,
                enabled: false,
              },
            }));
            updateSettings({
              virtual: {
                ...uState.virtual,
                enabled: false,
              },
            }).then(() => {
              socket.emit('update_user_status');
            });
          }
        }
      };

      // [用户定义新状态] ----------------------------------------------------------------------
      socket.on('new_user_status_response', (msg: { status: UserDefineStatus[]; room: string }) => {
        if (room.name === msg.room) {
          setUState((prev) => ({
            ...prev,
            roomStatus: msg.status,
          }));
        }
      });

      room.localParticipant.on(ParticipantEvent.TrackMuted, onTrackHandler);
      room.on(RoomEvent.ParticipantDisconnected, onParticipantDisConnected);

      // [用户邀请事件] -------------------------------------------------------------------------
      socket.on('invite_device_response', (msg: WsInviteDevice) => {
        if (msg.receiverId === room.localParticipant.identity && msg.room === room.name) {
          let device_str;
          let open: () => Promise<LocalTrackPublication | undefined>;
          switch (msg.device) {
            case Track.Source.Camera:
              device_str = '摄像头';
              open = () => room.localParticipant.setCameraEnabled(true);
              break;
            case Track.Source.Microphone:
              device_str = '麦克风';
              open = () => room.localParticipant.setMicrophoneEnabled(true);
              break;
            case Track.Source.ScreenShare:
              device_str = '屏幕共享';
              open = () => room.localParticipant.setScreenShareEnabled(true);
              break;
            default:
              return;
          }

          const btn = (
            <Button
              type="primary"
              size="small"
              onClick={async () => {
                await open();
                noteApi.destroy();
              }}
            >
              {t('common.open')}
            </Button>
          );

          noteApi.info({
            message: `${msg.senderName} ${t('msg.info.invite_device')} ${device_str}`,
            duration: 5,
            btn,
          });
        }
      });
      // [用户被移除出房间] ----------------------------------------------------------------
      socket.on('remove_participant_response', async (msg: WsTo) => {
        if (msg.receiverId === room.localParticipant.identity && msg.room === room.name) {
          await onParticipantDisConnected(room.localParticipant);
          messageApi.error({
            content: t('msg.info.remove_participant'),
            duration: 3,
          });
          room.disconnect(true);
          router.push('/');
          socket.emit('update_user_status');
        }
      });
      // [用户控制事件] -------------------------------------------------------------------
      socket.on('control_participant_response', async (msg: WsControlParticipant) => {
        if (msg.receiverId === room.localParticipant.identity && msg.room === room.name) {
          switch (msg.type) {
            case ControlType.ChangeName: {
              await room.localParticipant?.setMetadata(JSON.stringify({ name: msg.username! }));
              await room.localParticipant.setName(msg.username!);
              await updateSettings({
                name: msg.username!,
              });
              messageApi.success(t('msg.success.user.username.change'));
              socket.emit('update_user_status');
              break;
            }
            case ControlType.MuteAudio: {
              await room.localParticipant.setMicrophoneEnabled(false);
              messageApi.success(t('msg.success.device.mute.audio'));
              break;
            }
            case ControlType.MuteVideo: {
              await room.localParticipant.setCameraEnabled(false);
              messageApi.success(t('msg.success.device.mute.video'));
              break;
            }
            case ControlType.Transfer: {
              const success = await updateOwnerId(room.localParticipant.identity);
              if (success) {
                messageApi.success(t('msg.success.user.transfer'));
              }
              socket.emit('update_user_status');
              break;
            }
            case ControlType.Volume: {
              setUState((prev) => ({
                ...prev,
                volume: msg.volume!,
              }));
              await updateSettings({
                volume: msg.volume!,
              });
              socket.emit('update_user_status');
              break;
            }
            case ControlType.BlurVideo: {
              setUState((prev) => ({
                ...prev,
                blur: msg.blur!,
              }));
              await updateSettings({
                blur: msg.blur!,
              });
              socket.emit('update_user_status');
              break;
            }
            case ControlType.BlurScreen: {
              setUState((prev) => ({
                ...prev,
                screenBlur: msg.blur!,
              }));
              await updateSettings({
                screenBlur: msg.blur!,
              });
              socket.emit('update_user_status');
              break;
            }
          }
        }
      });

      return () => {
        socket.off('wave_response');
        socket.off('user_status_updated');
        socket.off('mouse_move_response');
        socket.off('mouse_remove_response');
        socket.off('new_user_status_response');
        socket.off('invite_device_response');
        socket.off('remove_participant_response');
        socket.off('control_participant_response');
        room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
        room.off(ParticipantEvent.TrackMuted, onTrackHandler);
        room.off(RoomEvent.ParticipantDisconnected, onParticipantDisConnected);
      };
    }, [room?.state, room?.localParticipant, uState, init, uLicenseState, IP]);

    useEffect(() => {
      if (!room || room.state !== ConnectionState.Connected) return;
      room.remoteParticipants.forEach((rp) => {
        let volume = settings.participants[rp.identity]?.volume / 100.0;
        if (isNaN(volume)) {
          volume = 1.0;
        }
        rp.setVolume(volume);
      });
    }, [room, settings]);

    useEffect(() => {
      // 当settings.status发生变化时，更新用户状态 --------------------------------------------------
      if (settings.status) {
        setUState((prev) => ({
          ...prev,
          roomStatus: settings.status!,
        }));
      }
    }, [settings.status]);

    const [widgetState, setWidgetState] = React.useState<WidgetState>({
      showChat: false,
      unreadMessages: 0,
      showSettings: false,
    });
    const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);
    // [track] -----------------------------------------------------------------------------------------------------
    const tracks = useTracks(
      [
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.ScreenShare, withPlaceholder: false },
      ],
      { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
    );
    // [widget update and layout adjust] --------------------------------------------------------------------------
    const widgetUpdate = (state: WidgetState) => {
      if (cacheWidgetState && cacheWidgetState == state) {
        return;
      } else {
        setCacheWidgetState(state);
        setWidgetState(state);
      }
    };

    const layoutContext = useCreateLayoutContext();

    const screenShareTracks = tracks
      .filter(isTrackReference)
      .filter((track) => track.publication.source === Track.Source.ScreenShare);

    const focusTrack = usePinnedTracks(layoutContext)?.[0];
    const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

    React.useEffect(() => {
      // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
      if (
        screenShareTracks.some((track) => track.publication.isSubscribed) &&
        lastAutoFocusedScreenShareTrack.current === null
      ) {
        setIsFocus(true);
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
        lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
      } else if (
        lastAutoFocusedScreenShareTrack.current &&
        !screenShareTracks.some(
          (track) =>
            track.publication.trackSid ===
            lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
        )
      ) {
        layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
        lastAutoFocusedScreenShareTrack.current = null;
      }
      if (focusTrack && !isTrackReference(focusTrack)) {
        const updatedFocusTrack = tracks.find(
          (tr) =>
            tr.participant.identity === focusTrack.participant.identity &&
            tr.source === focusTrack.source,
        );
        if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
          layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
        }
      }
    }, [
      screenShareTracks
        .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
        .join(),
      focusTrack?.publication?.trackSid,
      tracks,
    ]);

    const toSettingGeneral = () => {
      controlsRef.current?.openSettings('general');
    };
    // [user status] ------------------------------------------------------------------------------------------
    const setUserStatus = async (status: UserStatus | string) => {
      let newStatus = {
        status,
      };
      switch (status) {
        case UserStatus.Online: {
          if (room) {
            room.localParticipant.setMicrophoneEnabled(true);
            room.localParticipant.setCameraEnabled(true);
            room.localParticipant.setScreenShareEnabled(false);
            if (uState.volume == 0) {
              const newVolume = 80;
              setUState((prev) => ({
                ...prev,
                status: UserStatus.Online,
                volume: newVolume,
              }));
              Object.assign(newStatus, { volume: newVolume });
            }
          }
          break;
        }
        case UserStatus.Leisure: {
          setUState((prev) => ({
            ...prev,
            blur: 0.15,
            status: UserStatus.Leisure,
            screenBlur: 0.15,
          }));
          Object.assign(newStatus, { blur: 0.15, screenBlur: 0.15 });
          break;
        }
        case UserStatus.Busy: {
          setUState((prev) => ({
            ...prev,
            status: UserStatus.Busy,
            blur: 0.15,
            screenBlur: 0.15,
            volume: 0,
            virtual: {
              ...prev.virtual,
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
            setUState((prev) => ({
              ...prev,
              status: UserStatus.Offline,
              virtual: {
                ...prev.virtual,
                enabled: false,
                bg: ModelBg.ClassRoom,
                role: ModelRole.None,
              },
            }));
          }
          break;
        }
        default: {
          if (room) {
            const statusSettings = uState.roomStatus.find((item) => item.id === status);
            if (statusSettings) {
              setUState((prev) => ({
                ...prev,
                status,
                volume: statusSettings.volume,
                blur: statusSettings.blur,
                screenBlur: statusSettings.screenBlur,
              }));
              Object.assign(newStatus, {
                volume: statusSettings.volume,
                blur: statusSettings.blur,
                screenBlur: statusSettings.screenBlur,
              });
            }
          }
          break;
        }
      }
      await updateSettings(newStatus);
      socket.emit('update_user_status');
    };

    useImperativeHandle(ref, () => ({
      removeLocalSettings: () => clearSettings(),
    }));

    return (
      <div className="lk-video-conference" {...props}>
        {is_web() && (
          <LayoutContextProvider
            value={layoutContext}
            // onPinChange={handleFocusStateChange}
            onWidgetChange={widgetUpdate}
          >
            <div className="lk-video-conference-inner">
              {!focusTrack ? (
                <div className="lk-grid-layout-wrapper">
                  <GridLayout tracks={tracks}>
                    <ParticipantItem
                      room={room?.name}
                      settings={settings}
                      toSettings={toSettingGeneral}
                      messageApi={messageApi}
                      setUserStatus={setUserStatus}
                    ></ParticipantItem>
                  </GridLayout>
                </div>
              ) : (
                <div className="lk-focus-layout-wrapper">
                  <FocusLayoutContainer>
                    <CarouselLayout tracks={carouselTracks}>
                      <ParticipantItem
                        room={room?.name}
                        settings={settings}
                        toSettings={toSettingGeneral}
                        messageApi={messageApi}
                        setUserStatus={setUserStatus}
                      ></ParticipantItem>
                    </CarouselLayout>
                    {focusTrack && (
                      <ParticipantItem
                        room={room?.name}
                        setUserStatus={setUserStatus}
                        settings={settings}
                        toSettings={toSettingGeneral}
                        trackRef={focusTrack}
                        messageApi={messageApi}
                        isFocus={isFocus}
                      ></ParticipantItem>
                    )}
                  </FocusLayoutContainer>
                </div>
              )}
              <Controls
                ref={controlsRef}
                setUserStatus={setUserStatus}
                controls={{ chat: true, settings: !!SettingsComponent }}
                updateSettings={updateSettings}
                roomSettings={settings}
                fetchSettings={fetchSettings}
                updateRecord={updateRecord}
              ></Controls>
            </div>
            {SettingsComponent && (
              <div
                className="lk-settings-menu-modal"
                style={{ display: widgetState.showSettings ? 'block' : 'none' }}
              >
                <SettingsComponent />
              </div>
            )}
          </LayoutContextProvider>
        )}
        <RoomAudioRenderer />
        <ConnectionStateToast />
        <audio
          ref={waveAudioRef}
          style={{ display: 'none' }}
          src={src('/audios/vocespacewave.m4a')}
        ></audio>
      </div>
    );
  },
);

export function isEqualTrackRef(
  a?: TrackReferenceOrPlaceholder,
  b?: TrackReferenceOrPlaceholder,
): boolean {
  if (a === undefined || b === undefined) {
    return false;
  }
  if (isTrackReference(a) && isTrackReference(b)) {
    return a.publication.trackSid === b.publication.trackSid;
  } else {
    return getTrackReferenceId(a) === getTrackReferenceId(b);
  }
}

export function getTrackReferenceId(trackReference: TrackReferenceOrPlaceholder | number) {
  if (typeof trackReference === 'string' || typeof trackReference === 'number') {
    return `${trackReference}`;
  } else if (isTrackReferencePlaceholder(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.source}_placeholder`;
  } else if (isTrackReference(trackReference)) {
    return `${trackReference.participant.identity}_${trackReference.publication.source}_${trackReference.publication.trackSid}`;
  } else {
    throw new Error(`Can't generate a id for the given track reference: ${trackReference}`);
  }
}

export function isTrackReferencePlaceholder(
  trackReference?: TrackReferenceOrPlaceholder,
): trackReference is TrackReferencePlaceholder {
  if (!trackReference) {
    return false;
  }
  return (
    trackReference.hasOwnProperty('participant') &&
    trackReference.hasOwnProperty('source') &&
    typeof trackReference.publication === 'undefined'
  );
}

export type TrackReferenceOrPlaceholder = TrackReference | TrackReferencePlaceholder;

export type TrackReferencePlaceholder = {
  participant: Participant;
  publication?: never;
  source: Track.Source;
};
