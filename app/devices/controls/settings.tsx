import {
  Card,
  Divider,
  Input,
  List,
  message,
  Select,
  Slider,
  Spin,
  Switch,
  Tabs,
  TabsProps,
} from 'antd';
import styles from '@/styles/controls.module.scss';
import { forwardRef, RefAttributes, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { MessageInstance } from 'antd/es/message/interface';
import { loadVideo } from '@/lib/std/device';
import { ModelBg, ModelRole } from '@/lib/std/virtual';
import { SvgResource, SvgType } from '@/app/resources/svg';
import { langOptions, useI18n } from '@/lib/i18n/i18n';
import { AudioSelect } from './audio_select';
import { VideoSelect } from './video_select';
import { SelectPrefix } from './select_prefix';
import { LangSelect } from './lang_select';
import VirtualRoleCanvas from '@/app/pages/virtual_role/live2d';
import { src } from '@/lib/std';
import { StatusSelect } from './status_select';

export interface SettingsProps {
  microphone: {
    audio: {
      volume: number;
      setVolume: (e: number) => void;
    };
  };
  camera: {
    video: {
      blur: number;
      setVideoBlur: (e: number) => void;
    };
    screen: {
      blur: number;
      setScreenBlur: (e: number) => void;
    };
  };
  username: string;
  virtual: VirtualSettingsProps;
  tab: {
    key: TabKey;
    setKey: (e: TabKey) => void;
  };
  saveChanges: (tab_key: TabKey) => void;
  messageApi: MessageInstance;
}

export interface SettingsExports {
  username: string;
}

export type TabKey = 'general' | 'audio' | 'video' | 'screen' | 'virtual' | 'about_us';

export const Settings = forwardRef<SettingsExports, SettingsProps>(
  (
    {
      microphone: {
        audio: { volume, setVolume },
      },
      camera: {
        video: { blur: video_blur, setVideoBlur },
        screen: { blur: screen_blur, setScreenBlur },
      },
      username: uname,
      tab: { key, setKey },
      virtual: {
        enabled,
        setEnabled,
        modelRole,
        setModelRole,
        modelBg,
        setModelBg,
        compare,
        setCompare,
      },
      saveChanges,
      messageApi,
    }: SettingsProps,
    ref,
  ) => {
    const { t } = useI18n();
    const virtual_settings_ref = useRef<VirtualSettingsExports>(null);
    const [username, setUsername] = useState(uname);

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
              onBlur={() => {
                if (username !== uname) {
                  saveChanges('general');
                }
              }}
            ></Input>
            <div className={styles.common_space}>{t('settings.general.lang')}:</div>
            <LangSelect style={{ width: '100%' }}></LangSelect>
            <div className={styles.common_space}>{t('settings.general.status.title')}:</div>
            <StatusSelect style={{ width: '100%' }}></StatusSelect>
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
                defaultValue={volume}
                className={styles.common_space}
                onChange={(e) => {
                  setVolume(e);
                  saveChanges('audio');
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
                defaultValue={0.15}
                className={`${styles.common_space} ${styles.slider}`}
                value={video_blur}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={(e) => {
                  setVideoBlur(e);
                }}
                onChangeComplete={(e) => {
                  setVideoBlur(e);
                  saveChanges('video');
                }}
              />
            </div>
            <div className={styles.setting_box}>
              <span>{t('settings.video.screen_blur')}:</span>
              <Slider
                defaultValue={0.15}
                className={`${styles.common_space} ${styles.slider}`}
                value={screen_blur}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={(e) => {
                  setScreenBlur(e);
                }}
                onChangeComplete={(e) => {
                  setScreenBlur(e);
                  saveChanges('screen');
                }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'virtual',
        label: <TabItem type="user" label={t('settings.virtual.title')}></TabItem>,
        children: (
          <VirtualSettings
            messageApi={messageApi}
            modelRole={modelRole}
            setModelRole={setModelRole}
            modelBg={modelBg}
            setModelBg={setModelBg}
            enabled={enabled}
            setEnabled={setEnabled}
            compare={compare}
            setCompare={setCompare}
          ></VirtualSettings>
        ),
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
              {t('msg.info.contact')}
              <a
                href="mailto:han@privoce.com"
                style={{ color: '#22CCEE', textDecorationLine: 'none', margin: '0 4px' }}
              >
                han@privoce.com
              </a>
              {t('msg.info.learn_more')}
            </div>
          </div>
        ),
      },
    ];

    useImperativeHandle(ref, () => ({
      username,
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
}

export interface VirtualSettingsExports {}

export const VirtualSettings = forwardRef<
  VirtualSettingsExports,
  VirtualSettingsProps & { messageApi: MessageInstance }
>(
  (
    {
      messageApi,
      enabled,
      setEnabled,
      modelRole,
      setModelRole,
      modelBg,
      setModelBg,
      compare,
      setCompare,
    }: VirtualSettingsProps & { messageApi: MessageInstance },
    ref,
  ) => {
    const { t } = useI18n();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [trackingActive, setTrackingActive] = useState(false);
    const [model_selected_index, set_model_selected_index] = useState(0);
    const [bg_selected_index, set_bg_selected_index] = useState(0);

    const modelDatas = [
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
        label: <TabItem type="model" label="Model"></TabItem>,
        children: (
          <div>
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
                      set_model_selected_index(index);
                      setModelRole(item.name as ModelRole);
                      if (compare) {
                        setCompare(false);
                        setTimeout(() => {
                          setCompare(true);
                        }, 200);
                      }
                    }}
                  >
                    {model_selected_index == index && <SelectedMask></SelectedMask>}
                    <h4>{item.name}</h4>
                    <img src={src(`/images/models/${item.src}`)} alt="" />
                  </div>
                </List.Item>
              )}
            />
          </div>
        ),
      },
      {
        key: 'background',
        label: <TabItem type="bg" label="Background"></TabItem>,
        children: (
          <div>
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
                      set_bg_selected_index(index);
                      setModelBg(item.src as ModelBg);
                      if (enabled) {
                        setCompare(false);
                        setTimeout(() => {
                          setCompare(true);
                        }, 200);
                      }
                    }}
                  >
                    {bg_selected_index == index && <SelectedMask></SelectedMask>}
                    <h4>{item.name}</h4>
                    <img src={src(`/images/bg/${item.src}`)} alt="" />
                  </div>
                </List.Item>
              )}
            />
          </div>
        ),
      },
    ];

    useEffect(() => {
      loadVideo(videoRef);
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [loadVideo, compare]);

    return (
      <div className={styles.virtual_settings}>
        <div className={styles.virtual_settings_header}>
          <span>{t('settings.virtual.open')}:</span>
          <Switch
            style={{ background: '#22CCEE' }}
            value={enabled}
            onClick={() => {
              const val = !enabled;
              setEnabled(val);
            }}
          ></Switch>
        </div>
        <div className={styles.virtual_settings_header}>
          <span>{t('common.compare')}:</span>
          <Switch
            style={{ background: '#22CCEE' }}
            value={compare}
            onClick={() => {
              const val = !compare;
              setCompare(val);
            }}
          ></Switch>
        </div>
        <div className={styles.virtual_video_box}>
          <video
            className={compare ? '' : styles.virtual_video_box_video}
            style={{
              visibility: compare ? 'hidden' : 'visible',
            }}
            ref={videoRef}
            playsInline
            muted
          />
          {compare && (
            <div className={styles.virtual_video_box_canvas}>
              <VirtualRoleCanvas
                video_ele={videoRef}
                model_bg={modelBg}
                model_role={modelRole}
                enabled={compare}
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
      <SvgResource type="check" svgSize={24} color="#44de4f"></SvgResource>
    </div>
  );
}
