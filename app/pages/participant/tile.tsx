import { isTrackReferencePlaceholder } from '@/app/devices/video_container';
import { useVideoBlur } from '@/lib/std/device';
import {
  AudioTrack,
  ConnectionQualityIndicator,
  isTrackReference,
  LayoutContext,
  LockLockedIcon,
  ParticipantName,
  ParticipantPlaceholder,
  ParticipantTile,
  ParticipantTileProps,
  PinState,
  ScreenShareIcon,
  TrackMutedIndicator,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useFeatureContext,
  useIsEncrypted,
  useLocalParticipant,
  useMaybeLayoutContext,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import React, { useEffect } from 'react';
import VirtualRoleCanvas from '../virtual_role/live2d';
import { useRecoilState } from 'recoil';
import { socket, userState } from '@/app/rooms/[roomName]/PageClientImpl';
import styles from '@/styles/controls.module.scss';
import { SvgResource, SvgType } from '@/app/resources/svg';
import { Dropdown, MenuProps } from 'antd';
import { useI18n } from '@/lib/i18n/i18n';
import { randomColor, UserStatus } from '@/lib/std';
import { MessageInstance } from 'antd/es/message/interface';
import { RoomSettings } from '@/lib/hooks/room_settings';

export interface ParticipantItemProps extends ParticipantTileProps {
  settings: RoomSettings;
  setUserStatus: (status: UserStatus) => Promise<void>;
  toSettings?: () => void;
  messageApi: MessageInstance;
  isFocus?: boolean;
}

export const ParticipantItem: (
  props: ParticipantItemProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = React.forwardRef<HTMLDivElement, ParticipantItemProps>(
  function ParticipantItem(
    {
      trackRef,
      settings,
      toSettings,
      messageApi,
      setUserStatus,
      isFocus
    }: ParticipantItemProps,
    ref,
  ) {
    const { t } = useI18n();
    const { localParticipant } = useLocalParticipant();
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [uState, setUState] = useRecoilState(userState);
    const trackReference = useEnsureTrackRef(trackRef);
    const isEncrypted = useIsEncrypted(trackReference.participant);
    const layoutContext = useMaybeLayoutContext();
    const autoManageSubscription = useFeatureContext()?.autoSubscription;
    const [lastMousePos, setLastMousePos] = React.useState({ x: 0, y: 0 });
    // 存储所有观众的鼠标位置
    const [remoteCursors, setRemoteCursors] = React.useState<{
      [participantId: string]: {
        x: number;
        y: number;
        name: string;
        color: string;
        timestamp: number;
      };
    }>({});
    const { blurValue, setVideoBlur } = useVideoBlur({
      videoRef,
      initialBlur: 100.0,
    });
    const [loading, setLoading] = React.useState(true);
    useEffect(() => {
      if (settings && Object.keys(settings).length > 0) {
        if (trackReference.source === Track.Source.Camera) {
          setVideoBlur(settings[trackReference.participant.identity]?.blur ?? 0.15);
        } else {
          setVideoBlur(settings[trackReference.participant.identity]?.screenBlur ?? 0.15);
        }
        setLoading(false);
      }
    }, [settings, trackReference.source]);

    const handleSubscribe = React.useCallback(
      (subscribed: boolean) => {
        if (
          trackReference.source &&
          !subscribed &&
          layoutContext &&
          layoutContext.pin.dispatch &&
          isTrackReferencePinned(trackReference, layoutContext.pin.state)
        ) {
          layoutContext.pin.dispatch({ msg: 'clear_pin' });
        }
      },
      [trackReference, layoutContext],
    );

    const deviceTrack = React.useMemo(() => {
      console.log(isTrackReference(trackReference), loading, trackReference.source);
      if (isTrackReference(trackReference) && !loading) {
        if (trackReference.source === Track.Source.Camera) {
          return (
            <div style={{ height: '100%', width: '100%' }}>
              <VideoTrack
                ref={videoRef}
                style={{
                  filter: `blur(${blurValue}px)`,
                  visibility:
                    uState.virtualRole.enabled &&
                    settings[trackReference.participant.identity]?.virtual
                      ? 'hidden'
                      : 'visible',
                }}
                trackRef={trackReference}
                onSubscriptionStatusChanged={handleSubscribe}
                manageSubscription={autoManageSubscription}
              />
              {uState.virtualRole.enabled &&
                settings[trackReference.participant.identity]?.virtual && (
                  <div className={styles.virtual_video_box_canvas}>
                    <VirtualRoleCanvas
                      video_ele={videoRef}
                      model_bg={uState.virtualRole.bg}
                      model_role={uState.virtualRole.role}
                      enabled={uState.virtualRole.enabled}
                      messageApi={messageApi}
                      trackRef={trackReference}
                    ></VirtualRoleCanvas>
                  </div>
                )}
            </div>
          );
        } else if (trackReference.source === Track.Source.ScreenShare) {
          // 包含远程鼠标位置
          return (
            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
              <VideoTrack
                ref={videoRef}
                style={{
                  filter: `blur(${blurValue}px)`,
                }}
                trackRef={trackReference}
                onSubscriptionStatusChanged={handleSubscribe}
                manageSubscription={autoManageSubscription}
              />
              {isFocus &&
                trackReference.participant.identity === localParticipant.identity &&
                Object.entries(remoteCursors).map(([participantId, cursor]) => {
                  // 计算视频元素上的绝对位置
                  const videoRect = videoRef.current?.getBoundingClientRect();
                  if (!videoRect) return null;

                  const absoluteX = cursor.x * videoRect.width;
                  const absoluteY = cursor.y * videoRect.height;
                  // console.warn(absoluteX, absoluteY);
                  // 检查时间戳，如果超过10秒没有更新，则不显示
                  // const now = Date.now();
                  // if (now - cursor.timestamp > 10000) return null;

                  return (
                    <div
                      key={participantId}
                      className={styles.remote_cursor}
                      style={{
                        position: 'absolute',
                        left: `${absoluteX}px`,
                        top: `${absoluteY}px`,
                        pointerEvents: 'none', // 确保鼠标事件穿透
                        zIndex: 1000,
                        transform: 'translate(-50%, -50%)', // 使鼠标指针居中
                      }}
                    >
                      {/* 鼠标指针 */}
                      <div className={styles.cursor_icon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M7 2L18 13H11L7 20V2Z"
                            fill={cursor.color}
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>

                      {/* 用户名标签 */}
                      <div
                        className={styles.cursor_label}
                        style={{
                          backgroundColor: cursor.color,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          position: 'absolute',
                          top: '-22px',
                          left: '10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cursor.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        } else {
          return (
            <AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
          );
        }
      }
    }, [trackReference, loading, blurValue, videoRef, uState.virtualRole, remoteCursors, settings]);

    // [status] ------------------------------------------------------------
    const userStatusDisply = React.useMemo(() => {
      switch (settings[trackReference.participant.identity]?.status) {
        case UserStatus.Online:
          return 'online_dot';
        case UserStatus.Idot:
          return 'offline_dot';
        case UserStatus.Busy:
          return 'busy_dot';
        case UserStatus.Invisible:
          return 'away_dot';
      }
    }, [settings]);
    const statusFromSvgType = (svgType: SvgType): UserStatus => {
      switch (svgType) {
        case 'online_dot':
          return UserStatus.Online;
        case 'offline_dot':
          return UserStatus.Idot;
        case 'busy_dot':
          return UserStatus.Busy;
        case 'away_dot':
          return UserStatus.Invisible;
        default:
          return UserStatus.Online;
      }
    };
    const setStatusLabel = (): String => {
      switch (userStatusDisply) {
        case 'online_dot':
          return t('settings.general.status.online');
        case 'offline_dot':
          return t('settings.general.status.idot');
        case 'busy_dot':
          return t('settings.general.status.busy');
        case 'away_dot':
          return t('settings.general.status.invisible');
        default:
          return t('settings.general.status.online');
      }
    };

    const status_menu: MenuProps['items'] = [
      {
        key: 'online_dot',
        label: (
          <div className={styles.status_item}>
            <SvgResource type="online_dot" svgSize={14}></SvgResource>
            <span>{t('settings.general.status.online')}</span>
            <div>{t('settings.general.status.online_desc')}</div>
          </div>
        ),
      },
      {
        key: 'offline_dot',
        label: (
          <div className={styles.status_item}>
            <SvgResource type="offline_dot" svgSize={14}></SvgResource>
            <span>{t('settings.general.status.idot')}</span>
            <div>{t('settings.general.status.idot_desc')}</div>
          </div>
        ),
      },
      {
        key: 'busy_dot',
        label: (
          <div className={styles.status_item}>
            <SvgResource type="busy_dot" svgSize={14}></SvgResource>
            <span>{t('settings.general.status.busy')}</span>
            <div>{t('settings.general.status.busy_desc')}</div>
          </div>
        ),
      },
      {
        key: 'away_dot',
        label: (
          <div className={styles.status_item}>
            <SvgResource type="away_dot" svgSize={14}></SvgResource>
            <span>{t('settings.general.status.invisible')}</span>
            <div>{t('settings.general.status.invisible_desc')}</div>
          </div>
        ),
      },
    ];

    const user_menu: MenuProps['items'] = [
      {
        key: 'user_info',
        label: (
          <div className={styles.user_info_wrap} onClick={toSettings}>
            <div className={styles.user_info_wrap_name}>{trackReference.participant.name}</div>
            <SvgResource type="modify" svgSize={14} color="#fff"></SvgResource>
            {/* <div className={styles.user_info_wrap_identity}>{trackReference.participant.identity}</div> */}
          </div>
        ),
      },
      {
        key: 'user_status',
        label: (
          <Dropdown
            placement="topLeft"
            menu={{
              items: status_menu,
              onClick: async (e) => {
                let status = statusFromSvgType(e.key as SvgType);
                setUState({
                  ...uState,
                  status,
                });
                await setUserStatus(status);
              },
            }}
          >
            <div className={styles.status_item_inline} style={{ width: '100%' }}>
              <div className={styles.status_item_inline}>
                <SvgResource type={userStatusDisply} svgSize={14}></SvgResource>
                <div>{setStatusLabel()}</div>
              </div>
              <SvgResource type="right" svgSize={14} color="#fff"></SvgResource>
            </div>
          </Dropdown>
        ),
      },
    ];

    // 使用ws向服务器发送消息，告诉某个人打招呼
    const wavePin = async () => {
      socket.emit('wave', {
        senderName: localParticipant.name,
        senderId: localParticipant.identity,
        receiverId: trackReference.participant.identity,
        socketId: settings[trackReference.participant.identity]?.socketId,
      });
    };

    // 处理当前用户如果是演讲者并且当前track source是screen share，那么就需要获取其他用户的鼠标位置
    useEffect(() => {
      // 如果当前用户是观看者，并且当前的屏幕主视口是screen share，且is_focus为true
      // console.log(isFocus, trackReference.source, localParticipant.isSpeaking);
      if (
        isFocus &&
        trackReference.source === Track.Source.ScreenShare &&
        !localParticipant.isSpeaking
      ) {
        // 此时说明当前参与者正在观看屏幕共享，当这个观看者希望引导演讲者时（鼠标在窗口中移动，点击），需要将鼠标位置发送给演讲者
        const handleMouseMove = (e: MouseEvent) => {
          if (!videoRef.current) return;
          const videoRect = videoRef.current?.getBoundingClientRect();

          // 检查鼠标位置
          if (
            e.clientX >= videoRect.left &&
            e.clientX <= videoRect.right &&
            e.clientY >= videoRect.top &&
            e.clientY <= videoRect.bottom
          ) {
            // 需要计算相对位置，因为屏幕尺寸每个人都不一样，也可能是缩放的 （归一）
            const x = (e.clientX - videoRect.left) / videoRect.width;
            const y = (e.clientY - videoRect.top) / videoRect.height;

            // 判断位置是否发生变化， 变化才发送
            if (Math.abs(x - lastMousePos.x) < 0.01 && Math.abs(y - lastMousePos.y) < 0.01) {
              return;
            } else {
              setLastMousePos({ x, y });
            }

            // if (trackReference.participant.identity !== localParticipant.identity) {

            // }
            socket.emit('mouse_move', {
              x,
              y,
              senderName: localParticipant.name,
              senderId: localParticipant.identity,
              receiverId: trackReference.participant.identity,
              receSocketId: settings[trackReference.participant.identity]?.socketId,
            });
          }
        };
        // 300ms触发一次, 节流
        const throttledMouseMove = throttle(handleMouseMove, 300);
        document.addEventListener('mousemove', throttledMouseMove);

        return () => {
          // 清除事件监听器
          document.removeEventListener('mousemove', handleMouseMove);
        };
      }

      // 如果当前用户是演讲者并且当前track source是screen share，那么就需要获取其他用户的鼠标位置
      if (localParticipant.isSpeaking && trackReference.source === Track.Source.ScreenShare) {
        // console.warn('is speaking and screen share');

        socket.on('mouse_move_response', (data) => {
          // 获取之后需要将别人的鼠标位置在演讲者的屏幕上进行显示
          const { senderId, senderName, x, y } = data;

          // 为每个用户生成一个固定的颜色
          const color = randomColor(senderId);
          // console.log(senderId, senderName, x, y, color);
          // 更新状态
          setRemoteCursors((prev) => ({
            ...prev,
            [senderId]: {
              x,
              y,
              name: senderName,
              color,
              timestamp: Date.now(),
            },
          }));
        });
      }
    }, [trackReference.source, localParticipant.isSpeaking, isFocus]);

    return (
      <ParticipantTile ref={ref} trackRef={trackReference}>
        {deviceTrack}
        <div className="lk-participant-placeholder">
          <ParticipantPlaceholder />
        </div>
        <div className="lk-participant-metadata">
          <Dropdown
            placement="topLeft"
            trigger={['click']}
            menu={{
              items: user_menu,
            }}
            disabled={trackReference.participant.identity != localParticipant.identity}
          >
            <div className="lk-participant-metadata-item">
              {trackReference.source === Track.Source.Camera ? (
                <>
                  {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
                  <TrackMutedIndicator
                    trackRef={{
                      participant: trackReference.participant,
                      source: Track.Source.Microphone,
                    }}
                    show={'muted'}
                  ></TrackMutedIndicator>
                  <ParticipantName />
                  <div style={{ marginLeft: '0.25rem' }}>
                    <SvgResource type={userStatusDisply} svgSize={14}></SvgResource>
                  </div>
                </>
              ) : (
                <>
                  <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                  <ParticipantName>&apos;s screen</ParticipantName>
                </>
              )}
            </div>
          </Dropdown>

          <ConnectionQualityIndicator className="lk-participant-metadata-item" />
        </div>
        {trackReference.participant.identity != localParticipant.identity && (
          <LayoutContext.Consumer>
            {(layoutContext) =>
              layoutContext !== undefined && (
                <button
                  className="lk-button lk-focus-toggle-button"
                  style={{
                    left: '0.25rem',
                    width: 'fit-content',
                  }}
                  onClick={wavePin}
                >
                  <SvgResource svgSize={16} type="wave"></SvgResource>
                </button>
              )
            }
          </LayoutContext.Consumer>
        )}
      </ParticipantTile>
    );
  },
);

export function isTrackReferencePinned(
  trackReference: TrackReferenceOrPlaceholder,
  pinState: PinState | undefined,
): boolean {
  if (typeof pinState === 'undefined') {
    return false;
  }
  if (isTrackReference(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        isTrackReference(pinnedTrackReference) &&
        pinnedTrackReference.publication.trackSid === trackReference.publication.trackSid,
    );
  } else if (isTrackReferencePlaceholder(trackReference)) {
    return pinState.some(
      (pinnedTrackReference) =>
        pinnedTrackReference.participant.identity === trackReference.participant.identity &&
        isTrackReferencePlaceholder(pinnedTrackReference) &&
        pinnedTrackReference.source === trackReference.source,
    );
  } else {
    return false;
  }
}

// 节流函数 - 限制函数调用频率
function throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number = 0;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (now - lastRan >= limit) {
      func.apply(context, args);
      lastRan = now;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (now - lastRan));
    }
  };
}
