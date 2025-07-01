import styles from '@/styles/controls.module.scss';
import { Slider } from 'antd';
import { useI18n } from '@/lib/i18n/i18n';
import { VirtualSettings, VirtualSettingsExports, VirtualSettingsProps } from './virtual';
import { VideoSelect } from '../video_select';

export interface VideoSettingsProps {
  videoBlur: number;
  screenBlur: number;
  setVideoBlur: (value: number) => void;
  setScreenBlur: (value: number) => void;
  virtual: VirtualSettingsProps;
  virtualSettingsRef: React.RefObject<VirtualSettingsExports>;
}

export function VideoSettings({
  videoBlur,
  screenBlur,
  setVideoBlur,
  setScreenBlur,
  virtual,
  virtualSettingsRef
}: VideoSettingsProps) {
  const { t } = useI18n();
  return (
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
          {...virtual}
        ></VirtualSettings>
      </div>
    </div>
  );
}
