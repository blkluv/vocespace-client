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
  const [records, setRecords] = useState<string[]>([]);

  // 开始倒计时
  const startCountdown = () => {
    if (!countdownDuration) {
      messageApi.error('请先设置倒计时时间');
      return;
    }

    const hours = countdownDuration.hour();
    const minutes = countdownDuration.minute();
    const seconds = countdownDuration.second();
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

    if (totalMs <= 0) {
      messageApi.error('请设置有效的倒计时时间');
      return;
    }

    const endTime = Date.now() + totalMs;
    setCountdownValue(endTime);
    setCountdownRunning(true);
  };

  // 停止倒计时
  const stopCountdown = () => {
    setCountdownRunning(false);
    setCountdownValue(null);
  };

  // 重置倒计时
  const resetCountdown = () => {
    setCountdownRunning(false);
    setCountdownValue(null);
    setCountdownDuration(dayjs().hour(0).minute(5).second(0));
  };
  const onCountdownFinish: StatisticTimerProps['onFinish'] = () => {
    console.log('Countdown finished!');
    setCountdownRunning(false);
    setCountdownValue(null);
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            倒计时
          </Title>
        </div>

        <Row align="middle">
          <div style={{ marginBottom: 8 }}>设置时间：</div>
          <TimePicker
            value={countdownDuration}
            onChange={setCountdownDuration}
            showNow={false}
            format="HH:mm:ss"
            disabled={countdownRunning}
            placeholder="选择倒计时时间"
            style={{ width: '100%',outline: "1px solid #22CCEE" }}
          />
        </Row>
        <Row align="bottom" justify="end">
          <Space size={"large"}>
            {!countdownRunning ? (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={startCountdown}>
                开始
              </Button>
            ) : (
              <Button danger icon={<PauseCircleOutlined />} onClick={stopCountdown}>
                停止
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={resetCountdown}>
              重置
            </Button>
          </Space>
        </Row>

        {countdownValue && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Timer
              type="countdown"
              value={countdownValue}
              onFinish={onCountdownFinish}
              format="HH:mm:ss"
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: countdownRunning ? '#1890ff' : '#999',
              }}
            />
          </div>
        )}
      </Space>
    </Card>
  );
}
