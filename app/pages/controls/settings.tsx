import { Button, Input, List, Slider, Tabs, TabsProps } from 'antd';
import styles from '@/styles/controls.module.scss';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MessageInstance } from 'antd/es/message/interface';
import { loadVideo, useVideoBlur } from '@/lib/std/device';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { SvgResource, SvgType } from '@/app/resources/svg';
import { useI18n } from '@/lib/i18n/i18n';
import { AudioSelect } from './audio_select';
import { VideoSelect } from './video_select';
import { LangSelect } from './lang_select';
import VirtualRoleCanvas from '@/app/pages/virtual_role/live2d';
import { src, UserStatus } from '@/lib/std';
import { StatusSelect } from './status_select';
import { useRecoilState } from 'recoil';
import { socket, userState, virtualMaskState } from '@/app/[roomName]/PageClientImpl';
import { LocalParticipant } from 'livekit-client';
import { LicenseControl } from './license';
import { BuildUserStatus } from './user_status';

export interface SettingsProps {
  username: string;
  close: boolean;
  tab: {
    key: TabKey;
    setKey: (e: TabKey) => void;
  };
  messageApi: MessageInstance;
  setUserStatus?: (status: UserStatus | string) => Promise<void>;
  room: string;
  localParticipant: LocalParticipant;
}

export interface SettingsExports {
  username: string;
  removeVideo: () => void;
  startVideo: () => Promise<void>;
  state: {
    volume: number;
    blur: number;
    screenBlur: number;
    virtual: {
      enabled: boolean;
      role: ModelRole;
      bg: ModelBg;
    };
  };
}

export type TabKey = 'general' | 'audio' | 'video' | 'screen' | 'about_us';

export const Settings = forwardRef<SettingsExports, SettingsProps>(
  (
    {
      close,
      username: uname,
      tab: { key, setKey },
      // saveChanges,
      messageApi,
      setUserStatus,
      room,
      localParticipant,
    }: SettingsProps,
    ref,
  ) => {
    const { t } = useI18n();
    const [username, setUsername] = useState(uname);
    const [appendStatus, setAppendStatus] = useState(false);
    const [uState, setUState] = useRecoilState(userState);
    const [volume, setVolume] = useState(uState.volume);
    const [videoBlur, setVideoBlur] = useState(uState.blur);
    const [screenBlur, setScreenBlur] = useState(uState.screenBlur);
    const [virtualEnabled, setVirtualEnabled] = useState(false);
    const [modelRole, setModelRole] = useState<ModelRole>(ModelRole.None);
    const [modelBg, setModelBg] = useState<ModelBg>(ModelBg.ClassRoom);
    const [compare, setCompare] = useState(false);
    const virtualSettingsRef = useRef<VirtualSettingsExports>(null);

    useEffect(() => {
      setVolume(uState.volume);
      setVideoBlur(uState.blur);
      setScreenBlur(uState.screenBlur);
      setVirtualEnabled(uState.virtual.enabled);
      setModelRole(uState.virtual.role);
      setModelBg(uState.virtual.bg);
    }, [uState]);

    const items: TabsProps['items'] = [
      {
        key: 'general',
        label: <TabItem type="setting" label={t('settings.general.title')}></TabItem>,
        children: (
          <div className={styles.setting_box}>
            <div>{t('settings.general.username')}:</div>
            <Input
              size="large"
              className={styles.common_space}
              value={username}
              onChange={(e: any) => {
                setUsername(e.target.value);
              }}
            ></Input>
            <div className={styles.common_space}>{t('settings.general.lang')}:</div>
            <LangSelect style={{ width: '100%' }}></LangSelect>
            <div className={styles.common_space}>{t('settings.general.status.title')}:</div>
            <div className={styles.setting_box_line}>
              <StatusSelect
                style={{ width: 'calc(100% - 52px)' }}
                setUserStatus={setUserStatus}
              ></StatusSelect>
              <Button
                type="primary"
                shape="circle"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setAppendStatus(!appendStatus);
                }}
              >
                <SvgResource type="add" svgSize={16}></SvgResource>
              </Button>
            </div>
            {appendStatus && (
              <BuildUserStatus
                messageApi={messageApi}
                room={room}
                localParticipant={localParticipant}
              ></BuildUserStatus>
            )}
          </div>
        ),
      },
      {
        key: 'audio',
        label: <TabItem type="audio" label={t('settings.audio.title')}></TabItem>,
        children: (
          <div>
            <div className={styles.setting_box}>
              <div>{t('settings.audio.device')}:</div>
              <AudioSelect className={styles.common_space}></AudioSelect>
            </div>
            <div className={styles.setting_box}>
              <div>{t('settings.audio.volume')}:</div>
              <Slider
                value={volume}
                className={styles.common_space}
                min={0.0}
                max={100.0}
                step={1.0}
                onChange={(e) => {
                  setVolume(e);
                }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'video',
        label: <TabItem type="video" label={t('settings.video.title')}></TabItem>,
        children: (
          <div>
            <div className={styles.setting_box}>
              <div>{t('settings.video.device')}:</div>
              <VideoSelect className={styles.common_space}></VideoSelect>
            </div>
            <div className={styles.setting_box}>
              <span>{t('settings.video.video_blur')}:</span>
              <Slider
                defaultValue={0.0}
                className={`${styles.common_space} ${styles.slider}`}
                value={videoBlur}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={(e) => {
                  setVideoBlur(e);
                }}
                onChangeComplete={(e) => {
                  setVideoBlur(e);
                }}
              />
            </div>
            <div className={styles.setting_box}>
              <span>{t('settings.video.screen_blur')}:</span>
              <Slider
                defaultValue={0.0}
                className={`${styles.common_space} ${styles.slider}`}
                value={screenBlur}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={(e) => {
                  setScreenBlur(e);
                }}
                onChangeComplete={(e) => {
                  setScreenBlur(e);
                }}
              />
            </div>
            <div className={styles.setting_box}>
              <div style={{ marginBottom: '6px' }}>{t('settings.virtual.title')}:</div>
              <VirtualSettings
                ref={virtualSettingsRef}
                close={close}
                blur={videoBlur}
                messageApi={messageApi}
                modelRole={modelRole}
                setModelRole={setModelRole}
                modelBg={modelBg}
                setModelBg={setModelBg}
                enabled={virtualEnabled}
                setEnabled={setVirtualEnabled}
                compare={compare}
                setCompare={setCompare}
                room={room}
                localParticipant={localParticipant}
              ></VirtualSettings>
            </div>
          </div>
        ),
      },
      {
        key: 'license',
        label: <TabItem type="license" label={t('settings.license.title')}></TabItem>,
        children: <LicenseControl messageApi={messageApi}></LicenseControl>,
      },
      {
        key: 'about_us',
        label: <TabItem type="logo" label={t('settings.about_us.title')}></TabItem>,
        children: (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
              <SvgResource type="logo" svgSize={64}></SvgResource>
              <span style={{ fontSize: '32px', color: '#fff', fontWeight: '700' }}>VoceSpace</span>
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'left',
                width: '100%',
                wordSpacing: '0px',
              }}
            >
              {t('settings.about_us.brief')}
            </div>
            <div style={{ textAlign: 'justify', textIndent: '2rem' }}>
              {t('settings.about_us.desc')}
            </div>
            <div style={{ textAlign: 'right', width: '100%' }}>
              <div>
                {' '}
                {t('msg.info.contact')}
                <a
                  href="mailto:han@privoce.com"
                  style={{ color: '#22CCEE', textDecorationLine: 'none', margin: '0 4px' }}
                >
                  han@privoce.com
                </a>
              </div>
              <div>
                {' '}
                {t('msg.info.learn_more')}:
                <a
                  href="https://vocespace.com"
                  style={{ color: '#22CCEE', textDecorationLine: 'none', margin: '0 4px' }}
                >
                  {t('msg.info.offical_web')}
                </a>
              </div>
            </div>
          </div>
        ),
      },
    ];

    useImperativeHandle(ref, () => ({
      username,
      removeVideo: () => {
        if (virtualSettingsRef.current) {
          virtualSettingsRef.current.removeVideo();
          setCompare(false);
        }
      },
      startVideo: async () => {
        if (virtualSettingsRef.current) {
          await virtualSettingsRef.current.startVideo();
        }
      },
      state: {
        volume,
        blur: videoBlur,
        screenBlur,
        virtual: {
          enabled: virtualEnabled,
          role: modelRole,
          bg: modelBg,
        },
      },
    }));

    return (
      <Tabs
        activeKey={key}
        tabPosition="left"
        centered
        items={items}
        style={{ width: '100%', height: '100%' }}
        onChange={(k: string) => {
          setKey(k as TabKey);
        }}
      />
    );
  },
);
export function TabItem({ type, label }: { type: SvgType; label: string }) {
  const tabStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    gap: '6px',
  };

  return (
    <div style={tabStyles}>
      <SvgResource type={type} svgSize={14}></SvgResource>
      {label}
    </div>
  );
}

export interface VirtualSettingsProps {
  enabled: boolean;
  setEnabled: (e: boolean) => void;
  modelRole: ModelRole;
  setModelRole: (e: ModelRole) => void;
  modelBg: ModelBg;
  setModelBg: (e: ModelBg) => void;
  compare: boolean;
  setCompare: (e: boolean) => void;
  close: boolean;
  blur: number;
  room: string;
  localParticipant: LocalParticipant;
}

export interface VirtualSettingsExports {
  removeVideo: () => void;
  startVideo: () => Promise<void>;
}

export const VirtualSettings = forwardRef<
  VirtualSettingsExports,
  VirtualSettingsProps & { messageApi: MessageInstance }
>(
  (
    {
      close,
      blur,
      messageApi,
      enabled,
      setEnabled,
      modelRole,
      setModelRole,
      modelBg,
      setModelBg,
      compare,
      setCompare,
      room,
      localParticipant,
    }: VirtualSettingsProps & { messageApi: MessageInstance },
    ref,
  ) => {
    const { t } = useI18n();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [model_selected_index, set_model_selected_index] = useState(0);
    const [bg_selected_index, set_bg_selected_index] = useState(0);
    const [showBlur, setShowBlur] = useState(true);
    const [virtualMask, setVirtualMask] = useRecoilState(virtualMaskState);
    const { blurValue, setVideoBlur } = useVideoBlur({
      videoRef,
      initialBlur: blur,
    });

    const reloadVirtual = () => {
      socket.emit('reload_virtual', {
        identity: localParticipant.identity,
        roomId: room,
        reloading: true,
      });
    };

    useEffect(() => {
      setVideoBlur(blur);
    }, [blur]);

    useEffect(() => {
      if (modelRole != ModelRole.None) {
        setEnabled(true);
      } else {
        setEnabled(false);
      }
    }, [modelRole]);
    useEffect(() => {
      if (close && videoRef.current && !videoRef.current.srcObject) {
        loadVideo(videoRef);
        if (modelRole != ModelRole.None) {
          setVirtualMask(true);
          reloadVirtual();
          setCompare(true);
        }
      }
    }, [videoRef, close]);

    const modelDatas = [
      {
        name: 'None',
        src: 'none.png',
      },
      {
        name: 'Haru',
        src: 'Haru.png',
      },
      {
        name: 'Hiyori',
        src: 'Hiyori.png',
      },
      {
        name: 'Mao',
        src: 'Mao.png',
      },
      {
        name: 'Mark',
        src: 'Mark.png',
      },
      {
        name: 'Natori',
        src: 'Natori.png',
      },
      {
        name: 'Rice',
        src: 'Rice.png',
      },
    ];

    const bgDatas = [
      {
        name: 'Class Room',
        src: 'v_bg1.png',
      },
      {
        name: 'Waiting Space',
        src: 'v_bg2.jpg',
      },
      {
        name: 'Office',
        src: 'v_bg3.jpg',
      },
      {
        name: 'Leisure Space',
        src: 'v_bg4.jpg',
      },
      {
        name: 'Meeting Room',
        src: 'v_bg5.jpg',
      },
    ];

    const items: TabsProps['items'] = [
      {
        key: 'model',
        label: <TabItem type="model" label={t('settings.virtual.tab.model')}></TabItem>,
        children: (
          <div>
            <h4>{t('settings.virtual.model')}</h4>
            <List
              grid={{
                gutter: 16,
                column: 3,
              }}
              dataSource={modelDatas}
              renderItem={(item, index) => (
                <List.Item>
                  <div
                    className={styles.virtual_model_box}
                    onClick={() => {
                      reloadVirtual();
                      set_model_selected_index(index);
                      setModelRole(item.name as ModelRole);
                      setVirtualMask(true);
                      if (compare && item.name != ModelRole.None) {
                        // 这里需要将外部视频进行遮罩
                        setCompare(false);
                        setTimeout(() => {
                          setCompare(true);
                        }, 200);
                      } else if (item.name == ModelRole.None) {
                        setCompare(false);
                      } else {
                        setCompare(true);
                      }
                    }}
                  >
                    {model_selected_index == index && <SelectedMask></SelectedMask>}
                    {/* <h4>{item.name}</h4> */}
                    {item.name == ModelRole.None ? (
                      <div
                        style={{
                          height: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                        }}
                      >
                        {t('settings.virtual.none')}
                      </div>
                    ) : (
                      <img src={src(`/images/models/${item.src}`)} alt="" />
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        ),
      },
      {
        key: 'background',
        label: <TabItem type="bg" label={t('settings.virtual.tab.background')}></TabItem>,
        children: (
          <div>
            <h4>{t('settings.virtual.background')}</h4>
            <List
              grid={{
                gutter: 16,
                column: 3,
              }}
              dataSource={bgDatas}
              renderItem={(item, index) => (
                <List.Item>
                  <div
                    className={styles.virtual_model_box}
                    onClick={() => {
                      reloadVirtual();
                      set_bg_selected_index(index);
                      setVirtualMask(true);
                      setModelBg(item.src as ModelBg);
                      if (compare && modelRole != ModelRole.None) {
                        setCompare(false);
                        setTimeout(() => {
                          setCompare(true);
                        }, 200);
                      } else if (modelRole == ModelRole.None && !compare) {
                        setCompare(false);
                      } else {
                        setCompare(true);
                      }
                    }}
                  >
                    {bg_selected_index == index && <SelectedMask></SelectedMask>}
                    {/* <h4>{item.name}</h4> */}
                    <img src={src(`/images/bg/${item.src}`)} alt="" />
                  </div>
                </List.Item>
              )}
            />
          </div>
        ),
      },
    ];

    const removeVideo = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    useImperativeHandle(ref, () => ({
      removeVideo,
      startVideo: async () => {
        await loadVideo(videoRef);
      },
    }));

    return (
      <div className={styles.virtual_settings}>
        <div className={styles.virtual_video_box}>
          {modelRole == ModelRole.None && (
            <div className={styles.virtual_video_box_compare}>
              <Button
                color="default"
                variant="solid"
                style={{ padding: '8px' }}
                onClick={() => {
                  if (modelRole != ModelRole.None) {
                    const val = !compare;
                    setCompare(val);
                  } else {
                    setShowBlur(!showBlur);
                  }
                }}
              >
                <SvgResource type="switch" color="#fff" svgSize={14}></SvgResource>
              </Button>
            </div>
          )}

          <video
            className={compare ? '' : styles.virtual_video_box_video}
            style={{
              visibility: compare ? 'hidden' : 'visible',
              filter: showBlur ? `blur(${blurValue}px)` : 'none',
              transition: 'filter 0.2s ease-in-out',
            }}
            ref={videoRef}
            playsInline
          />
          {compare && modelRole != ModelRole.None && (
            <div className={styles.virtual_video_box_canvas}>
              <VirtualRoleCanvas
                model_bg={modelBg}
                model_role={modelRole}
                enabled={compare}
                messageApi={messageApi}
                isLocal={true}
                isReplace={false}
                onReady={() => {}}
                onDestroy={() => {}}
              ></VirtualRoleCanvas>
            </div>
          )}
        </div>
        <Tabs
          defaultActiveKey="general"
          tabPosition="top"
          items={items}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  },
);

function SelectedMask() {
  return (
    <div className={styles.selected_mask}>
      <SvgResource type="check" svgSize={24} color="#22CCEE"></SvgResource>
    </div>
  );
}
