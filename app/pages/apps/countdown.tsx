import { useI18n } from '@/lib/i18n/i18n';
import {
  ClockCircleOutlined,
  FieldTimeOutlined,
  FlagOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic, StatisticTimerProps, TimePicker } from 'antd';
import Title from 'antd/es/typography/Title';
import { useState } from 'react';
import { TimeRecords } from './time_records';
import { MessageInstance } from 'antd/es/message/interface';
const { Timer } = Statistic;
import dayjs, { type Dayjs } from 'dayjs';
import { src } from '@/lib/std';

export interface CountdownProps {
  messageApi: MessageInstance;
}

export function AppCountdown({ messageApi }: CountdownProps) {
  const { t } = useI18n();

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [countdownDuration, setCountdownDuration] = useState<Dayjs | null>(
    dayjs().hour(0).minute(5).second(0), // 默认5分钟
  );
  const [countdownRunning, setCountdownRunning] = useState(false);

  const [stopTimeStamp, setStopTimeStamp] = useState<number | null>(null);

  // 开始倒计时
  const startCountdown = () => {
    if (!countdownDuration) {
      messageApi.error(t('more.app.countdown.error.set'));
      return;
    }

    if (stopTimeStamp && stopTimeStamp > 0) {
      // 如果有停止时间戳，继续倒计时
      setCountdownRunning(true);
      setStopTimeStamp(null);
    } else {
      const hours = countdownDuration.hour();
      const minutes = countdownDuration.minute();
      const seconds = countdownDuration.second();
      const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

      if (totalMs <= 0) {
        messageApi.error(t('more.app.countdown.error.valid'));
        return;
      }
      let start = Date.now();
      const endTime = start + totalMs;
      setCountdownValue(endTime);
      setCountdownRunning(true);
    }
  };

  // 停止倒计时
  const stopCountdown = () => {
    setCountdownRunning(false);
    // setCountdownValue(null);
    setStopTimeStamp(Date.now());
  };

  // 重置倒计时
  const resetCountdown = () => {
    setCountdownRunning(false);
    setCountdownValue(null);
    setCountdownDuration(dayjs().hour(0).minute(5).second(0));
    setStopTimeStamp(null);
  };
  const onCountdownFinish: StatisticTimerProps['onFinish'] = () => {
    console.log('Countdown finished!');
    setCountdownRunning(false);
    setCountdownValue(null);
    setStopTimeStamp(null);
    const audioSrc = src('/audios/alarm.mp3');
    const audio = new Audio(audioSrc);
    audio.volume = 1.0;
    audio.play().then(() => {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.remove();
      }, 4000);
    });
  };

  const timestampToSecond = (timestamp: number) => {
    if (!timestamp) return '00:00:00';
    const seconds = Math.floor(timestamp / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      secs,
    ).padStart(2, '0')}`;
  };

  const defaultStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#999',
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {t('more.app.countdown.title')}
          </Title>
        </div>

        <Row align="middle">
          <div style={{ marginBottom: 8 }}>{t('more.app.countdown.set')}:</div>
          <TimePicker
            value={countdownDuration}
            onChange={setCountdownDuration}
            showNow={false}
            format="HH:mm:ss"
            disabled={countdownRunning}
            placeholder={t('more.app.countdown.placeholder')}
            style={{ width: '100%', outline: '1px solid #22CCEE' }}
          />
        </Row>
        <Row align="bottom" justify="end">
          <Space size={'large'}>
            {!countdownRunning ? (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={startCountdown}>
                {stopTimeStamp && stopTimeStamp > 0
                  ? t('more.app.countdown.continue')
                  : t('more.app.countdown.start')}
              </Button>
            ) : (
              <Button danger icon={<PauseCircleOutlined />} onClick={stopCountdown}>
                {t('more.app.countdown.stop')}
              </Button>
            )}

            <Button
              icon={<ReloadOutlined />}
              onClick={resetCountdown}
              color="danger"
              variant="solid"
            >
              {t('more.app.countdown.reset')}
            </Button>
          </Space>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {stopTimeStamp ? (
            <Statistic
              value={
                countdownValue ? timestampToSecond(countdownValue - stopTimeStamp) : '--:--:--'
              }
              style={defaultStyle}
            />
          ) : (
            <>
              {countdownValue ? (
                <Timer
                  type="countdown"
                  value={countdownValue}
                  onFinish={onCountdownFinish}
                  format="HH:mm:ss"
                  style={{
                    ...defaultStyle,
                    color: countdownRunning ? '#1890ff' : '#999',
                  }}
                />
              ) : (
                <Statistic value={countdownDuration?.format('HH:mm:ss')} style={defaultStyle} />
              )}
            </>
          )}
        </div>
      </Space>
    </Card>
  );
}
