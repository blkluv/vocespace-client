import {
  FieldTimeOutlined,
  FlagOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic } from 'antd';
import { useMemo, useState } from 'react';
import { TimeRecords } from './time_records';
import styles from '@/styles/apps.module.scss';
const { Timer } = Statistic;

export interface AppTimerProps {
  size?: 'normal' | 'small';
}

export function AppTimer({ size = "normal"}: AppTimerProps) {
  // 计时相关状态
  const [countupValue, setCountupValue] = useState<number | null>(null);
  const [countupRunning, setCountupRunning] = useState(false);
  const [stopTimeStamp, setStopTimeStamp] = useState<number | null>(null);
  const [records, setRecords] = useState<string[]>([]);
  // 开始计时
  const startCountup = () => {
    if (countupValue === null) {
      const startTime = Date.now();
      setCountupValue(startTime);
      setCountupRunning(true);
    } else {
      // 继续计时
      setCountupValue(countupValue + Date.now() - stopTimeStamp!);
      setCountupRunning(true);
    }
  };

  // 停止计时
  const stopCountup = () => {
    setCountupRunning(false);
    setStopTimeStamp(Date.now());
  };

  // 重置计时
  const resetCountup = () => {
    setCountupRunning(false);
    setCountupValue(null);
    setStopTimeStamp(null);
    setRecords([]);
  };

  // 记录计时
  const recordCountup = () => {
    setRecords((prev) => {
      if (prev.length >= 5) {
        // 如果记录超过5条，删除最早的一条
        return [...prev.slice(1), timestampToSecond()];
      } else {
        // 否则直接添加
        return [...prev, timestampToSecond()];
      }
    });
  };

  const timestampToSecond = () => {
    if (countupValue === null) return '00:00:00';

    const currentTime = countupRunning ? Date.now() : stopTimeStamp!;
    const elapsedTime = currentTime - countupValue;
    let seconds = Math.floor(elapsedTime / 1000);
    // 处理seconds，保证不为负数，同时format为: HH:mm:ss
    if (seconds < 0) {
      seconds = 0;
    }

    if (seconds === 0) {
      return '00:00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      secs,
    ).padStart(2, '0')}`;
  };

  const timerStyle = useMemo(() => {
    if (size === 'normal') {
      return {
        text: {
          fontSize: '48px',
          color: '#eee',
        },
        icon: {
          fontSize: '24px',
        },
        icon_btn: {
          height: '44px',
          width: '44px',
        },
        start_btn: {
          height: '44px',
          width: '120px',
        },
      };
    } else {
      return {
        text: {
          fontSize: '24px',
          color: '#eee',
        },
        icon: {
          fontSize: '12px',
        },
        icon_btn: {
          height: '16px',
          width: '16px',
        },
        start_btn: {
          height: '16px',
          width: '48px',
        },
      };
    }
  }, [size]);

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            {countupRunning ? (
              <>
                {countupValue && (
                  <Timer
                    type="countup"
                    value={countupValue}
                    format="HH:mm:ss"
                    valueStyle={timerStyle.text}
                  />
                )}
              </>
            ) : (
              <Statistic value={timestampToSecond()} valueStyle={timerStyle.text} />
            )}
          </div>
          <TimeRecords
            data={records}
            clear={() => {
              setRecords([]);
            }}
          ></TimeRecords>
          <Row justify="center">
            <Col>
              <Space size="large"></Space>
              {countupRunning ? (
                <Space size="large">
                  <button className={styles.circle_btn} onClick={recordCountup} style={timerStyle.icon_btn}>
                    <FlagOutlined style={timerStyle.icon} />
                  </button>
                  <button className={styles.circle_btn} onClick={stopCountup} style={timerStyle.icon_btn}>
                    <PauseCircleOutlined style={timerStyle.icon} />
                  </button>
                </Space>
              ) : (
                <Space size={'large'}>
                  {countupValue === null ? (
                    <button onClick={startCountup} className={styles.start_btn} style={timerStyle.start_btn}>
                      <PlayCircleOutlined style={timerStyle.icon} />
                    </button>
                  ) : (
                    <>
                      <button className={styles.circle_btn} onClick={resetCountup} style={timerStyle.icon_btn}>
                        <ReloadOutlined style={timerStyle.icon} />
                      </button>
                      <button className={styles.circle_btn} onClick={startCountup} style={timerStyle.icon_btn}>
                        <PlayCircleOutlined style={timerStyle.icon} />
                      </button>
                    </>
                  )}
                </Space>
              )}
            </Col>
          </Row>
        </Space>
      </Card>
    </>
  );
}
