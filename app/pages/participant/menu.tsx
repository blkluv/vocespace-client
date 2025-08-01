import { SvgResource } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';
import { SpaceInfo } from '@/lib/std/space';
import { Dropdown, MenuProps, Modal, Slider } from 'antd';
import { Participant, Room, Track } from 'livekit-client';
import { useMemo, useState } from 'react';
import styles from '@/styles/controls.module.scss';
import { ControlType, WsControlParticipant, WsInviteDevice, WsTo } from '@/lib/std/device';
import { socket } from '@/app/[spaceName]/PageClientImpl';
import { src } from '@/lib/std';

export interface ControlRKeyMenuProps {
  disabled?: boolean;
  children: React.ReactNode;
  menu: MenuProps;
  onOpenChange: (open: boolean) => void;
  isRKey?: boolean;
}

export function ControlRKeyMenu({
  disabled = false,
  children,
  menu,
  onOpenChange,
  isRKey = false,
}: ControlRKeyMenuProps) {
  const trigger: ('click' | 'contextMenu' | 'hover')[] = isRKey ? ['contextMenu'] : ['click'];

  return (
    <Dropdown disabled={disabled} trigger={trigger} menu={menu} onOpenChange={onOpenChange}>
      {children}
    </Dropdown>
  );
}

export interface UseControlRKeyMenuProps {
  room?: Room;
  spaceInfo: SpaceInfo;
  selectedParticipant: Participant | null;
  setSelectedParticipant: (participant: Participant | null) => void;
  setOpenNameModal?: (open: boolean) => void;
  setUsername: (username: string) => void;
}

export function useControlRKeyMenu({
  room,
  spaceInfo,
  selectedParticipant,
  setSelectedParticipant,
  setOpenNameModal,
  setUsername,
}: UseControlRKeyMenuProps) {
  const { t } = useI18n();
  // 必要的状态和Owner的确定 -------------------------------------------------------------------
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [isCamDisabled, setIsCamDisabled] = useState(false);
  const [isScreenShareDisabled, setIsScreenShareDisabled] = useState(false);
  const [volume, setVolume] = useState(0.0);
  const [blurVideo, setBlurVideo] = useState(0.0);
  const [blurScreen, setBlurScreen] = useState(0.0);
  const isOwner = useMemo(() => {
    return spaceInfo.ownerId === room?.localParticipant.identity;
  }, [spaceInfo.ownerId, room?.localParticipant.identity]);

  // 处理音量、模糊视频和模糊屏幕的调整------------------------------------------------------------
  const handleAdjustment = (
    key: 'control.volume' | 'control.blur_video' | 'control.blur_screen',
  ) => {
    if (room?.localParticipant && selectedParticipant && isOwner) {
      let wsTo = {
        room: room.name,
        senderName: room.localParticipant.name,
        senderId: room.localParticipant.identity,
        receiverId: selectedParticipant.identity,
        socketId: spaceInfo.participants[selectedParticipant.identity].socketId,
      } as WsTo;
      if (key === 'control.volume') {
        socket.emit('control_participant', {
          ...wsTo,
          type: ControlType.Volume,
          volume,
        } as WsControlParticipant);
      } else if (key === 'control.blur_video') {
        socket.emit('control_participant', {
          ...wsTo,
          type: ControlType.BlurVideo,
          blur: blurVideo,
        } as WsControlParticipant);
      } else if (key === 'control.blur_screen') {
        socket.emit('control_participant', {
          ...wsTo,
          type: ControlType.BlurScreen,
          blur: blurScreen,
        } as WsControlParticipant);
      }
    }
  };

  const optItems: MenuProps['items'] = useMemo(() => {
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
            icon: <SvgResource type="audio_close" svgSize={16} />,
            disabled: !isOwner ? true : !isMicDisabled,
          },
          {
            key: 'control.mute_video',
            label: (
              <span style={{ marginLeft: '8px' }}>
                {t('more.participant.set.control.mute.video')}
              </span>
            ),
            icon: <SvgResource type="video_close" svgSize={16} />,
            disabled: !isOwner ? true : !isCamDisabled,
          },
          {
            key: 'control.volume',
            label: (
              <div>
                <div className={styles.inline_flex}>
                  <SvgResource type="volume" svgSize={16} />
                  <span style={{ marginLeft: '8px' }}>
                    {t('more.participant.set.control.volume')}
                  </span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Slider
                    disabled={!isOwner}
                    min={0.0}
                    max={100.0}
                    step={1.0}
                    value={volume}
                    onChange={(e) => {
                      setVolume(e);
                    }}
                    onChangeComplete={(e) => {
                      setVolume(e);
                      handleAdjustment('control.volume');
                    }}
                  ></Slider>
                </div>
              </div>
            ),
            disabled: !isOwner,
          },
          {
            key: 'control.blur_video',
            label: (
              <div>
                <div className={styles.inline_flex}>
                  <SvgResource type="blur" svgSize={16} />
                  <span style={{ marginLeft: '8px' }}>
                    {t('more.participant.set.control.blur.video')}
                  </span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Slider
                    disabled={!isOwner}
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={blurVideo}
                    onChange={(e) => {
                      setBlurVideo(e);
                    }}
                    onChangeComplete={(e) => {
                      setBlurVideo(e);
                      handleAdjustment('control.blur_video');
                    }}
                  ></Slider>
                </div>
              </div>
            ),
            disabled: !isOwner,
          },
          {
            key: 'control.blur_screen',
            label: (
              <div>
                <div className={styles.inline_flex}>
                  <SvgResource type="blur" svgSize={16} />
                  <span style={{ marginLeft: '8px' }}>
                    {t('more.participant.set.control.blur.screen')}
                  </span>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Slider
                    disabled={!isOwner}
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={blurScreen}
                    onChange={(e) => {
                      setBlurScreen(e);
                    }}
                    onChangeComplete={(e) => {
                      setBlurScreen(e);
                      handleAdjustment('control.blur_screen');
                    }}
                  ></Slider>
                </div>
              </div>
            ),
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
              <span style={{ marginLeft: '8px' }}>
                {t('more.participant.set.safe.remove.title')}
              </span>
            ),
            icon: <SvgResource type="leave" svgSize={16} />,
            disabled: !isOwner,
          },
        ],
      },
    ];
  }, [isCamDisabled, isMicDisabled, isOwner, isScreenShareDisabled, volume, blurVideo, blurScreen]);

  const handleOptClick: MenuProps['onClick'] = (e) => {
    if (room?.localParticipant && selectedParticipant) {
      let device = Track.Source.Unknown;
      let wsTo = {
        room: room.name,
        senderName: room.localParticipant.name,
        senderId: room.localParticipant.identity,
        receiverId: selectedParticipant.identity,
        socketId: spaceInfo.participants[selectedParticipant.identity].socketId,
      } as WsTo;

      const inviteDevice = () => {
        socket.emit('invite_device', {
          ...wsTo,
          device,
        } as WsInviteDevice);
      };

      switch (e.key) {
        case 'invite.wave': {
          socket.emit('wave', wsTo);
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
        case 'safe.remove':
          {
            Modal.confirm({
              title: t('more.participant.set.safe.remove.title'),
              content: t('more.participant.set.safe.remove.desc'),
              okText: t('more.participant.set.safe.remove.confirm'),
              cancelText: t('more.participant.set.safe.remove.cancel'),
              onOk: () => {
                socket.emit('remove_participant', wsTo);
              },
            });
          }
          break;
        case 'control.change_name': {
          setOpenNameModal && setOpenNameModal(true);
          break;
        }
        case 'control.mute_audio': {
          socket.emit('control_participant', {
            ...wsTo,
            type: ControlType.MuteAudio,
          } as WsControlParticipant);
          break;
        }
        case 'control.mute_video': {
          socket.emit('control_participant', {
            ...wsTo,
            type: ControlType.MuteVideo,
          } as WsControlParticipant);
          break;
        }
        case 'control.trans': {
          socket.emit('control_participant', {
            ...wsTo,
            type: ControlType.Transfer,
          } as WsControlParticipant);
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
    setUsername(participant.name || participant.identity);
    setBlurVideo(spaceInfo.participants[participant.identity]?.blur || 0.0);
    setBlurScreen(spaceInfo.participants[participant.identity]?.screenBlur || 0.0);
    setVolume(spaceInfo.participants[participant.identity]?.volume || 0.0);
  };

  return {
    optItems,
    handleOptClick,
    optOpen,
    isOwner,
  };
}
