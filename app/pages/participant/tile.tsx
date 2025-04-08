import { isTrackReferencePlaceholder } from '@/app/devices/video_container';

import { loadVideo, useVideoBlur } from '@/lib/std/device';
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
  TrackReference,
  TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  useFeatureContext,
  useIsEncrypted,
  useLocalParticipant,
  useMaybeLayoutContext,
  VideoTrack,
} from '@livekit/components-react';
import { LocalTrack, RpcInvocationData, Track } from 'livekit-client';
import React, { useEffect } from 'react';
import VirtualRoleCanvas from '../virtual_role/live2d';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { useRecoilState } from 'recoil';
import { userState } from '@/app/rooms/[roomName]/PageClientImpl';
import styles from '@/styles/controls.module.scss';
import { SvgResource, SvgType } from '@/app/resources/svg';
import { Dropdown, MenuProps } from 'antd';
import { useI18n } from '@/lib/i18n/i18n';
import { UserStatus } from '@/lib/std';

export interface ParticipantItemProps extends ParticipantTileProps {
  blurs: Record<string, { blur: number; screenBlur: number }>;
  toSettings?: () => void;
}

export const ParticipantItem: (
  props: ParticipantItemProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = React.forwardRef<HTMLDivElement, ParticipantItemProps>(
  function ParticipantItem({ trackRef, blurs, toSettings }: ParticipantItemProps, ref) {
    const { t } = useI18n();
    const { localParticipant } = useLocalParticipant();
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [uState, setUState] = useRecoilState(userState);
    const trackReference = useEnsureTrackRef(trackRef);
    const isEncrypted = useIsEncrypted(trackReference.participant);
    const layoutContext = useMaybeLayoutContext();
    const autoManageSubscription = useFeatureContext()?.autoSubscription;
    const { blurValue, setVideoBlur } = useVideoBlur({
      videoRef,
      initialBlur: 100.0,
    });
    const [loading, setLoading] = React.useState(true);
    useEffect(() => {
      if (blurs && Object.keys(blurs).length > 0) {
        if (trackReference.source === Track.Source.Camera) {
          setVideoBlur(blurs[trackReference.participant.identity]?.blur ?? 0.15);
        } else {
          setVideoBlur(blurs[trackReference.participant.identity]?.screenBlur ?? 0.15);
        }
        setLoading(false);
      }
    }, [blurs, trackReference.source]);

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
      if (isTrackReference(trackReference) && !loading) {
        if (trackReference.source === Track.Source.Camera) {
          return (
            <div style={{ height: '100%', width: '100%' }}>
              <VideoTrack
                ref={videoRef}
                style={{
                  filter: `blur(${blurValue}px)`,
                  visibility: uState.virtualRole.enabled ? 'hidden' : 'visible',
                }}
                trackRef={trackReference}
                onSubscriptionStatusChanged={handleSubscribe}
                manageSubscription={autoManageSubscription}
              />
              {uState.virtualRole.enabled && (
                <div className={styles.virtual_video_box_canvas}>
                  <VirtualRoleCanvas
                    video_ele={videoRef}
                    model_bg={uState.virtualRole.bg}
                    model_role={uState.virtualRole.role}
                    enabled={uState.virtualRole.enabled}
                    trackRef={trackReference}
                  ></VirtualRoleCanvas>
                </div>
              )}
            </div>
          );
        } else if (trackReference.source === Track.Source.ScreenShare) {
          return (
            <VideoTrack
              ref={videoRef}
              style={{
                filter: `blur(${blurValue}px)`,
              }}
              trackRef={trackReference}
              onSubscriptionStatusChanged={handleSubscribe}
              manageSubscription={autoManageSubscription}
            />
          );
        } else {
          return (
            <AudioTrack trackRef={trackReference} onSubscriptionStatusChanged={handleSubscribe} />
          );
        }
      }
    }, [trackReference, loading, blurValue, videoRef, uState.virtualRole]);

    // [status] ------------------------------------------------------------
    const userStatusDisply = React.useMemo(() => {
      switch (uState.status) {
        case UserStatus.Online:
          return 'online_dot';
        case UserStatus.Idot:
          return 'offline_dot';
        case UserStatus.Busy:
          return 'busy_dot';
        case UserStatus.Invisible:
          return 'away_dot';
      }
    }, [uState.status]);
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
              onClick: (e) => {
                setUState({
                  ...uState,
                  status: statusFromSvgType(e.key as SvgType),
                });
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

    // 使用rpc向服务器发送消息，告诉某个人打招呼
    const wavePin = async () => {
      // 注册rpc方法来发送用户之间的提醒, 用户之间可以点击"打招呼"按钮来触发
      console.warn(trackReference.participant.identity);
      try {
        const response = await localParticipant.performRpc({
          destinationIdentity: trackReference.participant.identity,
          method: 'wave',
          payload: JSON.stringify({
            sender: localParticipant.identity,
          }),
        });

        console.log('wave response', response);
      } catch (e) {
        console.error('wave error', e);
      }
    };

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
