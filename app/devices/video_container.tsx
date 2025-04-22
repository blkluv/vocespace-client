import { is_web, src, UserStatus } from '@/lib/std';
import {
  CarouselLayout,
  Chat,
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
import { ConnectionState, Participant, RoomEvent, RpcInvocationData, Track } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { ControlBarExport, Controls } from './controls/bar';
import { useRecoilState } from 'recoil';
import { socket, userState } from '../rooms/[roomName]/PageClientImpl';
import { ParticipantItem } from '../pages/participant/tile';
import { useRoomSettings } from '@/lib/hooks/room_settings';
import { MessageInstance } from 'antd/es/message/interface';
import { NotificationInstance } from 'antd/es/notification/interface';
import { useI18n } from '@/lib/i18n/i18n';
import { EnhancedChat } from '../pages/chat/chat';
import { ModelBg, ModelRole } from '@/lib/std/virtual';

export function VideoContainer({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  noteApi,
  messageApi,
  ...props
}: VideoConferenceProps & { messageApi: MessageInstance; noteApi: NotificationInstance }) {
  const room = useMaybeRoomContext();
  const { t } = useI18n();
  const [device, setDevice] = useRecoilState(userState);
  const controlsRef = React.useRef<ControlBarExport>(null);
  const waveAudioRef = React.useRef<HTMLAudioElement>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [cacheWidgetState, setCacheWidgetState] = useState<WidgetState>();
  const { settings, updateSettings, fetchSettings, setSettings } = useRoomSettings(
    room?.name || '', // 房间 ID
    room?.localParticipant?.identity || '', // 参与者 ID
  );
  useEffect(() => {
    if (!room || room.state !== ConnectionState.Connected) return;

    const syncSettings = async () => {
      // 将当前参与者的基础设置发送到服务器 ----------------------------------------------------------
      await updateSettings({
        name: room.localParticipant.name || room.localParticipant.identity,
        blur: device.blur,
        volume: device.volume,
        status: UserStatus.Online,
        socketId: socket.id,
        virtual: {
          enabled: false,
          role: ModelRole.None,
          bg: ModelBg.ClassRoom,
        },
      });

      // const newSettings = await fetchSettings();
      // setSettings(newSettings);
    };

    syncSettings();

    // 监听服务器的提醒事件的响应 -------------------------------------------------------------------
    socket.on(
      'wave_response',
      (msg: { senderId: string; senderName: string; receiverId: string }) => {
        if (msg.receiverId === room.localParticipant.identity) {
          waveAudioRef.current?.play();
          noteApi.info({
            message: `${msg.senderName} ${t('common.wave_msg')}`,
          });
        }
      },
    );

    // 监听服务器的用户状态更新事件 -------------------------------------------------------------------
    socket.on('user_status_updated', async () => {
      // 调用fetchSettings
      await fetchSettings();
    });

    // 房间事件监听器 --------------------------------------------------------------------------------
    const onParticipantConnected = async (participant: Participant) => {
      await fetchSettings();
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

    return () => {
      socket.off('wave_response');
      socket.off('user_status_updated');
      socket.off('mouse_move_response');
      socket.off('mouse_remove_response');
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room?.state]);

  useEffect(() => {
    if (!room || room.state !== ConnectionState.Connected) return;
    room.remoteParticipants.forEach((rp) => {
      let volume = settings[rp.identity]?.volume / 100.0;
      if (isNaN(volume)) {
        volume = 1.0;
      }
      rp.setVolume(volume);
    });
  }, [room, settings]);

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
          if (device.volume == 0) {
            const newVolume = 80;
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
        setDevice((prev) => ({
          ...prev,
          blur: 0.15,
          screenBlur: 0.15,
        }));
        Object.assign(newStatus, { blur: 0.15, screenBlur: 0.15 });
        break;
      }
      case UserStatus.Busy: {
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
    socket.emit('update_user_status');
  };

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
                      settings={settings}
                      messageApi={messageApi}
                      setUserStatus={setUserStatus}
                    ></ParticipantItem>
                  </CarouselLayout>
                  {focusTrack && (
                    <ParticipantItem
                      setUserStatus={setUserStatus}
                      settings={settings}
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
              controls={{ chat: true, settings: !!SettingsComponent }}
              updateSettings={updateSettings}
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
}

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
