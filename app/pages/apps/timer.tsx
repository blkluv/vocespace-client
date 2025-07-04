import { useI18n } from '@/lib/i18n/i18n';
import {
  FieldTimeOutlined,
  FlagOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic } from 'antd';
import Title from 'antd/es/typography/Title';
import { useState } from 'react';
import { TimeRecords } from './time_records';
const { Timer } = Statistic;

export function AppTimer() {
  const { t } = useI18n();
  // 计时相关状态
  const [countupValue, setCountupValue] = useState<number | null>(null);
  const [countupRunning, setCountupRunning] = useState(false);
  const [stopTimeStamp, setStopTimeStamp] = useState<number | null>(null);
  const [records, setRecords] = useState<string[]>([]);
  // 开始计时
  const startCountup = () => {
    const startTime = Date.now();
    setCountupValue(startTime);
    setCountupRunning(true);
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
  };

  // 记录计时
  const recordCountup = () => {
    if (countupValue === null) {
      return;
    }
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

    const currentTime = countupRunning ? Date.now() : stopTimeStamp || Date.now();
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

  return (
    <>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>
              <FieldTimeOutlined style={{ marginRight: 8 }} />
              {t('more.app.timer.title')}
            </Title>
          </div>

          <Row justify="center">
            <Col>
              <Space size="large">
                {!countupRunning ? (
                  <Button type="primary" icon={<PlayCircleOutlined />} onClick={startCountup}>
                     {t("more.app.timer.start")}
                  </Button>
                ) : (
                  <Button danger icon={<PauseCircleOutlined />} onClick={stopCountup}>
                   {t("more.app.timer.stop")}
                  </Button>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetCountup}
                  color="danger"
                  variant="solid"
                >
                  {t("more.app.timer.reset")}
                </Button>
              </Space>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            {countupRunning ? (
              <>
                {countupValue && (
                  <Timer
                    type="countup"
                    value={countupValue}
                    format="HH:mm:ss"
                    style={{
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: countupRunning ? '#52c41a' : '#999',
                    }}
                  />
                )}
              </>
            ) : (
              <Statistic
                value={timestampToSecond()}
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: countupRunning ? '#52c41a' : '#999',
                }}
              />
            )}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignContent: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Button icon={<FlagOutlined />} onClick={recordCountup}>
              {t('more.app.timer.records.button')}
            </Button>
          </div>
        </Space>
      </Card>
      <hr />
      <Card>
        <TimeRecords data={records} clear={()=>{
          setRecords([]);
        }}></TimeRecords>
      </Card>
    </>
  );
}
