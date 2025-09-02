import {
  FlagOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic } from 'antd';
import { useMemo } from 'react';
import { TimeRecords } from './time_records';
import styles from '@/styles/apps.module.scss';
import { CardSize } from 'antd/es/card/Card';
import { Timer as TimerData } from '@/lib/std/space';
const { Timer } = Statistic;

export interface AppTimerProps {
  size?: CardSize;
  appData: TimerData;
  setAppData: (data: TimerData) => Promise<void>;
}

export function AppTimer({ size = 'default', appData, setAppData }: AppTimerProps) {
  // 开始计时
  const startCountup = async () => {
    if (appData.value === null) {
      const startTime = Date.now();
      await setAppData({
        ...appData,
        value: startTime,
        running: true,
      });
    } else {
      // 继续计时
      await setAppData({
        ...appData,
        value: appData.value! + Date.now() - appData.stopTimeStamp!,
        running: true,
      });
    }
  };

  // 停止计时
  const stopCountup = async () => {
    await setAppData({
      ...appData,
      running: false,
      stopTimeStamp: Date.now(),
    });
  };

  // 重置计时
  const resetCountup = async () => {
    await setAppData({
      ...appData,
      running: false,
      value: null,
      stopTimeStamp: null,
      records: [],
    });
  };

  // 记录计时
  const recordCountup = async () => {
    let data = appData;
    if (appData.records.length >= 5) {
      data = {
        ...appData,
        records: [...data.records.slice(1), timestampToSecond()],
      };
    } else {
      data = {
        ...appData,
        records: [...data.records, timestampToSecond()],
      };
    }
    await setAppData(data);
  };

  const timestampToSecond = () => {
    if (appData.value === null) return '00:00:00';

    const currentTime = appData.running ? Date.now() : appData.stopTimeStamp!;
    const elapsedTime = currentTime - appData.value;
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
    if (size === 'default') {
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
          fontSize: '14px',
        },
        icon_btn: {
          height: '20px',
          width: '20px',
        },
        start_btn: {
          height: '20px',
          width: '48px',
        },
      };
    }
  }, [size]);

  return (
    <>
      <Card style={{ width: '100%' }} size={size}>
        <Space
          direction="vertical"
          size={size === 'small' ? 'small' : 'large'}
          style={{ width: '100%' }}
        >
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            {appData.running ? (
              <>
                {appData.value && (
                  <Timer
                    type="countup"
                    value={appData.value}
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
            size={size}
            data={appData.records}
            clear={async () => {
              await setAppData({ ...appData, records: [] });
            }}
          ></TimeRecords>
          <Row justify="center">
            <Col>
              <Space size="large"></Space>
              {appData.running ? (
                <Space size="large">
                  <button
                    className={styles.circle_btn}
                    onClick={recordCountup}
                    style={timerStyle.icon_btn}
                  >
                    <FlagOutlined style={timerStyle.icon} />
                  </button>
                  <button
                    className={styles.circle_btn}
                    onClick={stopCountup}
                    style={timerStyle.icon_btn}
                  >
                    <PauseCircleOutlined style={timerStyle.icon} />
                  </button>
                </Space>
              ) : (
                <Space size={'large'}>
                  {appData.value === null ? (
                    <button
                      onClick={startCountup}
                      className={styles.start_btn}
                      style={timerStyle.start_btn}
                    >
                      <PlayCircleOutlined style={timerStyle.icon} />
                    </button>
                  ) : (
                    <>
                      <button
                        className={styles.circle_btn}
                        onClick={resetCountup}
                        style={timerStyle.icon_btn}
                      >
                        <ReloadOutlined style={timerStyle.icon} />
                      </button>
                      <button
                        className={styles.circle_btn}
                        onClick={startCountup}
                        style={timerStyle.icon_btn}
                      >
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
