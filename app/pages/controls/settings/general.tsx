import styles from '@/styles/controls.module.scss';
import { Button, Input, InputNumber, Radio, Select, Slider, SliderSingleProps } from 'antd';
import { LangSelect } from '../selects/lang_select';
import { StatusSelect } from '../selects/status_select';
import { SvgResource } from '@/app/resources/svg';
import { BuildUserStatus } from './user_status';
import { useI18n } from '@/lib/i18n/i18n';
import { LocalParticipant, Room } from 'livekit-client';
import { MessageInstance } from 'antd/es/message/interface';
import { isUndefinedNumber, isUndefinedString, UserStatus } from '@/lib/std';
import { useEffect, useMemo, useRef, useState } from 'react';
import equal from 'fast-deep-equal';
import { api } from '@/lib/api';
import {
  countLevelByConf,
  numberToRTCLevel,
  RTCConf,
  rtcLevelToNumber,
  rtcNumberToConf,
  VocespaceConfig,
} from '@/lib/std/conf';
import { socket } from '@/app/[spaceName]/PageClientImpl';
import { WsBase } from '@/lib/std/device';
export interface GeneralSettingsProps {
  room: string;
  localParticipant: LocalParticipant;
  messageApi: MessageInstance;
  appendStatus: boolean;
  setAppendStatus: (append: boolean) => void;
  setUserStatus?: (status: UserStatus | string) => Promise<void>;
  username: string;
  setUsername: (username: string) => void;
  openPromptSound: boolean;
  setOpenPromptSound: (open: boolean) => void;
}

export function GeneralSettings({
  room,
  localParticipant,
  messageApi,
  appendStatus,
  setAppendStatus,
  setUserStatus,
  username,
  setUsername,
  openPromptSound,
  setOpenPromptSound,
}: GeneralSettingsProps) {
  const { t } = useI18n();

  const [reload, setReload] = useState(false);
  const [conf, setConf] = useState<RTCConf | null>(null);
  const originConf = useRef<RTCConf | null>(null);
  const [rtcLevel, setRtcLevel] = useState(50);
  const originRtcLevel = useRef(rtcLevel);
  const [define, setDefine] = useState(false);
  const [update, setUpdate] = useState(true);

  const unifiedSliderText = (label: string) => ({
    style: {
      color: '#fff',
    },
    label: <span>{label}</span>,
  });

  const marks: SliderSingleProps['marks'] = {
    0: unifiedSliderText(t('settings.general.conf.quality.smooth')),
    25: unifiedSliderText(t('settings.general.conf.quality.standard')),
    50: unifiedSliderText(t('settings.general.conf.quality.high')),
    75: unifiedSliderText(t('settings.general.conf.quality.hd')),
    100: unifiedSliderText(t('settings.general.conf.quality.ultra')),
  };

  const getConf = async () => {
    const response = await api.getConf();

    if (response.ok) {
      const { resolution, maxBitrate, maxFramerate, priority, codec }: VocespaceConfig =
        await response.json();
      if (
        isUndefinedString(resolution) ||
        isUndefinedNumber(maxBitrate) ||
        isUndefinedNumber(maxFramerate) ||
        isUndefinedString(priority) ||
        isUndefinedString(codec)
      ) {
        messageApi.error(t('settings.general.conf.load_error'));
      } else {
        const data = {
          codec: codec!,
          resolution: resolution!,
          maxBitrate: maxBitrate!,
          maxFramerate: maxFramerate!,
          priority: priority!,
        } as RTCConf;
        setConf(data);
        originConf.current = data;
        let rtcLevel = rtcLevelToNumber(countLevelByConf(data));
        setRtcLevel(rtcLevel);
        originRtcLevel.current = rtcLevel;
      }
    }
  };

  useEffect(() => {
    if (update) {
      getConf();
      setUpdate(false);
    }
  }, [update]);

  useEffect(() => {
    if (equal(conf, originConf.current)) {
      setReload(false);
    } else {
      setReload(true);
    }
  }, [conf, originConf]);

  const resolutionOptions = [
    { label: '540p', value: '540p' },
    { label: '720p', value: '720p' },
    { label: '1080p', value: '1080p' },
    { label: '2k', value: '2k' },
    { label: '4K', value: '4K' },
  ];

  const codecOptions = [
    { label: 'VP9', value: 'vp9' },
    { label: 'VP8', value: 'vp8' },
    { label: 'H264', value: 'h264' },
    { label: 'AV1', value: 'av1' },
  ];

  const reloadConf = async () => {
    if (conf) {
      let reloadConf = conf;
      if (!define) {
        // 用户没有自定义，而是使用了滑动条来快速设置
        reloadConf = rtcNumberToConf(rtcLevel);
      }

      const response = await api.reloadConf(reloadConf);
      if (response.ok) {
        setUpdate(true);
        // socket 通知所有其他设备需要重新加载(包括自己)
        socket.emit('reload_env', {
          room,
        } as WsBase);
      } else {
        const { error } = await response.json();
        messageApi.error(`${t('settings.general.conf.reload_env_error')}: ${error}`);
      }
    }
  };

  return (
    <div className={`${styles.setting_box} ${styles.scroll_box}`}>
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
      <div className={styles.common_space}>{t('settings.general.prompt_sound')}:</div>
      <Radio.Group
        block
        value={openPromptSound}
        onChange={(e) => {
          setOpenPromptSound(e.target.value);
        }}
      >
        <Radio.Button value={true}>{t('common.open')}</Radio.Button>
        <Radio.Button value={false}>{t('common.close')}</Radio.Button>
      </Radio.Group>
      {conf ? (
        <>
          <div className={styles.common_space}>{t('settings.general.conf.quality.title')}:</div>
          <div className={styles.setting_box_line}>
            <Slider
              marks={marks}
              step={25}
              min={0}
              max={100}
              value={rtcLevel}
              dots
              range={false}
              style={{ width: '100%', marginLeft: '8px', marginRight: '16px' }}
              onChange={(value) => {
                setRtcLevel(value);
                setReload(value !== originRtcLevel.current);
              }}
            />
            <Button
              onClick={() => setDefine(!define)}
              className={styles.common_space}
              type="primary"
            >
              {t('settings.general.conf.quality.define')}
            </Button>
          </div>
          {define && (
            <>
              <div className={styles.common_space}>{t('settings.general.conf.codec')}:</div>
              <Select
                size="large"
                options={codecOptions}
                style={{ width: '100%' }}
                value={conf.codec}
                onChange={(value) => {
                  setConf({ ...conf, codec: value });
                }}
              ></Select>
              <div className={styles.common_space}>{t('settings.general.conf.resolution')}:</div>
              <Select
                size="large"
                options={resolutionOptions}
                style={{ width: '100%' }}
                value={conf.resolution}
                onChange={(value) => {
                  setConf({ ...conf, resolution: value });
                }}
              ></Select>
              <div className={styles.common_space}>{t('settings.general.conf.maxBitrate')}:</div>
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                className={styles.common_space}
                value={conf.maxBitrate}
                min={100000}
                step={100000}
                max={20000000}
                formatter={(value) => `${value} bps`}
                onChange={(value) => {
                  setConf({ ...conf, maxBitrate: value ?? 100000 });
                }}
              ></InputNumber>
              <div className={styles.common_space}>{t('settings.general.conf.maxFramerate')}:</div>
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={10}
                max={90}
                step={1}
                formatter={(value) => `${value} fps`}
                className={styles.common_space}
                value={conf.maxFramerate}
                onChange={(value) => {
                  setConf({ ...conf, maxFramerate: Number(value ?? 10) });
                }}
              ></InputNumber>
            </>
          )}
          {reload && (
            <Button
              type="primary"
              block
              onClick={reloadConf}
              className={styles.common_space}
              size="large"
            >
              {t('settings.general.conf.reload')}
            </Button>
          )}
        </>
      ) : (
        <span></span>
      )}
    </div>
  );
}
