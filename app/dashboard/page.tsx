'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Badge,
  Tag,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Modal,
  Input,
  Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SvgResource } from '../resources/svg';
import styles from '@/styles/dashboard.module.scss';
import { api } from '@/lib/api';
import { ConfQulity, useRTCConf, useVoceSpaceConf } from '../pages/controls/settings/conf';
import { RTCConf } from '@/lib/std/conf';
import { SpaceInfo, SpaceInfoMap } from '@/lib/std/space';

const { Title } = Typography;

const countDuring = (startAt: number): string => {
  if (!startAt) return '0m';
  const now = Date.now();
  const duration = Math.floor((now - startAt) / 1000); // 秒
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

interface SpaceTimeRecord {
  start: number; // 记录开始时间戳
  end?: number; // 记录结束时间戳
}

// 记录房间的使用情况
interface SpaceDateRecords {
  [spaceId: string]: SpaceTimeRecord[];
}

interface HistorySpaceData {
  key: string;
  room: string;
  during: string; // 总使用时长
  today: string; // 今日使用时长
}

interface ParticipantTableData {
  key: string;
  spaceId: string;
  participantId: string;
  name: string;
  volume: number;
  blur: number;
  screenBlur: number;
  status: string;
  isOwner: boolean;
  isRecording: boolean;
  virtualEnabled: boolean;
  during: string;
}

export default function Dashboard() {
  const [currentSpacesData, setCurrentSpacesData] = useState<ParticipantTableData[]>([]);
  const [historySpacesData, setHistorySpacesData] = useState<HistorySpaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSpaces, setTotalSpaces] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [activeRecordings, setActiveRecordings] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [openConf, setOpenConf] = useState(false);
  const [isHostManager, setIsHostManager] = useState(false);
  const [hostToken, setHostToken] = useState('');
  const { conf, getConf } = useVoceSpaceConf();

  // 根据 Space 分组数据
  const groupedSpacesData = useMemo(() => {
    const grouped: { [spaceId: string]: ParticipantTableData[] } = {};
    currentSpacesData.forEach((participant) => {
      if (!grouped[participant.spaceId]) {
        grouped[participant.spaceId] = [];
      }
      grouped[participant.spaceId].push(participant);
    });
    return grouped;
  }, [currentSpacesData]);
  // 获取当前空间信息
  const fetchCurrentSpaces = async () => {
    setLoading(true);
    try {
      const response = await api.allSpaceInfos();
      if (response.ok) {
        const spaceInfoMap: SpaceInfoMap = await response.json();

        const participantsData: ParticipantTableData[] = [];
        let roomCount = 0;
        let participantCount = 0;
        let recordingCount = 0;

        Object.entries(spaceInfoMap).forEach(([spaceId, spaceInfo]: [string, any]) => {
          if (spaceInfo.participants && Object.keys(spaceInfo.participants).length > 0) {
            roomCount++;
            if (spaceInfo.record?.active) {
              recordingCount++;
            }

            Object.entries(spaceInfo.participants).forEach(
              ([participantId, participant]: [string, any]) => {
                participantCount++;
                participantsData.push({
                  key: `${spaceId}-${participantId}`,
                  spaceId,
                  participantId,
                  name: participant.name,
                  volume: participant.volume,
                  blur: participant.blur,
                  screenBlur: participant.screenBlur,
                  status: participant.status,
                  isOwner: spaceInfo.ownerId === participantId,
                  isRecording: spaceInfo.record?.active || false,
                  virtualEnabled: participant.virtual?.enabled || false,
                  during: countDuring(participant.startAt),
                });
              },
            );
          }
        });

        setCurrentSpacesData(participantsData);
        setTotalSpaces(roomCount);
        setTotalParticipants(participantCount);
        setActiveRecordings(recordingCount);
      }
    } catch (error) {
      console.error('Failed to fetch current rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取历史房间数据（模拟数据）
  const fetchHistorySpaces = async () => {
    const response = await api.historySpaceInfos();
    if (!response.ok) {
      messageApi.error('获取历史房间数据失败');
      return;
    } else {
      const { records }: { records: SpaceDateRecords } = await response.json();
      // 转为 HistorySpaceData 格式
      const historyData: HistorySpaceData[] = [];
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);
      // 遍历records中的记录，只要是todayStart < start < todayEnd的记录就是当天的记录
      // 但也需要处理end > todayEnd的情况，这时候就累加todayEnd - start, 否则就是end - start
      for (const [spaceId, timeRecords] of Object.entries(records)) {
        let total = 0;
        let today = 0;
        timeRecords.forEach((record) => {
          // 判断当前end是否存在，不存在就是当前的时间
          const end = record.end || Date.now();
          total += end - record.start;
          if (record.start >= todayStart && record.start <= todayEnd) {
            // 如果开始时间在今天范围内
            if (end > todayEnd) {
              // 如果结束时间超过今天的结束时间
              today += todayEnd - record.start;
            } else {
              // 否则就是正常的结束时间
              today += end - record.start;
            }
          }
        });
        historyData.push({
          key: spaceId,
          room: spaceId,
          during: `${Math.floor(total / 3600000)}h ${Math.floor((total % 3600000) / 60000)}m`,
          today: `${Math.floor(today / 3600000)}h ${Math.floor((today % 3600000) / 60000)}m`,
        });
      }
      setHistorySpacesData(historyData);
    }
  };

  useEffect(() => {
    getConf();
    fetchCurrentSpaces();
    fetchHistorySpaces();

    // 每120秒刷新一次数据
    const interval = setInterval(() => {
      fetchCurrentSpaces();
      fetchHistorySpaces();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // 当前房间参与者表格列定义（去掉房间列，因为现在按Space分组显示）
  const currentSpacesColumns: ColumnsType<ParticipantTableData> = [
    {
      title: '参与者',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record) => (
        <Space align="center">
          <span>{name}</span>
          {record.isOwner && '(host)'}
          {record.isRecording && (
            <SvgResource type="record" svgSize={16} color="#ffffff"></SvgResource>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: (
        <div className={styles.table_header}>
          <SvgResource type="volume" svgSize={16} color="#ffffff"></SvgResource>音量
        </div>
      ),
      dataIndex: 'volume',
      key: 'volume',
      width: 80,
      render: (volume: number) => (
        <Space align="center">
          <span>{volume}%</span>
        </Space>
      ),
    },
    {
      title: (
        <div className={styles.table_header}>
          <SvgResource type="blur" svgSize={16} color="#ffffff"></SvgResource>视频模糊
        </div>
      ),
      dataIndex: 'blur',
      key: 'blur',
      width: 100,
      render: (blur: number) => (
        <Space align="center">
          <span>{blur * 100}%</span>
        </Space>
      ),
    },
    {
      title: (
        <div className={styles.table_header}>
          <SvgResource type="blur" svgSize={16} color="#ffffff"></SvgResource>屏幕模糊
        </div>
      ),
      dataIndex: 'screenBlur',
      key: 'screenBlur',
      width: 100,

      render: (screenBlur: number) => (
        <Space align="center">
          <span>{screenBlur * 100}%</span>
        </Space>
      ),
    },
    {
      title: '虚拟背景',
      dataIndex: 'virtualEnabled',
      key: 'virtualEnabled',
      width: 100,
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
      ),
    },
    {
      title: '参会时长',
      dataIndex: 'during',
      key: 'during',
      width: 100,
      ellipsis: true,
    },
  ];

  // 历史房间表格列定义
  const historySpacesColumns: ColumnsType<HistorySpaceData> = [
    {
      title: '房间名',
      dataIndex: 'room',
      key: 'room',
      width: 200,
    },
    {
      title: '总使用时长',
      dataIndex: 'during',
      key: 'during',
      width: 150,
      sorter: (a, b) => {
        // 简单的时长排序逻辑
        const parseTime = (time: string) => {
          const hours = time.includes('h') ? parseInt(time.split('h')[0]) : 0;
          const minutes = time.includes('m')
            ? parseInt(time.split('m')[0].split(' ').pop() || '0')
            : 0;
          return hours * 60 + minutes;
        };
        return parseTime(a.during) - parseTime(b.during);
      },
    },
    {
      title: '今日使用时长',
      dataIndex: 'today',
      key: 'today',
      width: 150,
      sorter: (a, b) => {
        const parseTime = (time: string) => {
          const hours = time.includes('h') ? parseInt(time.split('h')[0]) : 0;
          const minutes = time.includes('m')
            ? parseInt(time.split('m')[0].split(' ').pop() || '0')
            : 0;
          return hours * 60 + minutes;
        };
        return parseTime(a.today) - parseTime(b.today);
      },
    },
  ];

  const confirmConfHandle = () => {
    if (!isHostManager) {
      // 验证hostToken
      console.warn(conf?.hostToken, hostToken);
      if (conf) {
        if (hostToken === conf.hostToken) {
          setIsHostManager(true);
        }
      } else {
        messageApi.error('配置未加载完成或无法获得配置，请稍后再试');
      }
    } else {
      // 当修改后
      setOpenConf(false);
      setIsHostManager(false);
      setHostToken('');
    }
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>VoceSpace Dashboard</Title>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="活跃房间数" value={totalSpaces} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="在线参与者"
                value={totalParticipants}
                prefix={<SvgResource type="user" svgSize={16} color="#ffffff"></SvgResource>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃录制"
                value={activeRecordings}
                prefix={<SvgResource type="record" svgSize={16} color="#ffffff"></SvgResource>}
                valueStyle={{ color: activeRecordings > 0 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ marginBottom: '9px' }}>操作</div>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <Button type="primary" onClick={fetchCurrentSpaces} loading={loading}>
                  刷新数据
                </Button>
                <Button
                  color="danger"
                  variant="solid"
                  onClick={() => {
                    setOpenConf(true);
                  }}
                >
                  配置画质(全局)
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 当前房间用户数据 - 按Space分组 */}
      <Card style={{ marginBottom: 24,}} styles={{body: {
        paddingLeft: 0
      }}}>
        {Object.keys(groupedSpacesData).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无活跃房间</div>
        ) : (
          <Tabs
            tabPosition="left"
            items={['当前活跃用户', "日榜", "周榜", "月榜"].map((title) => {
              return {
                key: title,
                label: <Typography.Title level={5}>{title}</Typography.Title>,
                children: (
                  <Tabs
                    items={Object.entries(groupedSpacesData).map(([spaceId, participants]) => ({
                      key: spaceId,
                      label: (
                        <Space>
                          <span>{spaceId}</span>
                          <Badge count={participants.length} size="small" />
                          {participants.some((p) => p.isRecording) && (
                            <SvgResource type="record" svgSize={14} color="#ff4d4f" />
                          )}
                        </Space>
                      ),
                      children: (
                        <Table
                          columns={currentSpacesColumns}
                          dataSource={participants}
                          loading={loading}
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                          }}
                          scroll={{ x: 1000 }}
                        />
                      ),
                    }))}
                  />
                ),
              };
            })}
          ></Tabs>
        )}
      </Card>

      {/* 历史房间数据 */}
      <Card title="历史房间使用统计">
        <Table
          columns={historySpacesColumns}
          dataSource={historySpacesData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>
      <Modal
        title="配置全局画质"
        open={openConf}
        onCancel={() => {
          setOpenConf(false);
        }}
        footer={
          <Button type="primary" onClick={confirmConfHandle}>
            {!isHostManager ? '验证' : '关闭'}
          </Button>
        }
      >
        {isHostManager ? (
          <ConfQulity
            space=""
            isOwner={isHostManager}
            messageApi={messageApi}
            onReload={() => {
              setHostToken('');
              setOpenConf(false);
              setIsHostManager(false);
              messageApi.success('配置已更新');
            }}
          ></ConfQulity>
        ) : (
          <Input
            placeholder="请输入管理员令牌"
            value={hostToken}
            onChange={(e) => {
              setHostToken(e.target.value);
            }}
          ></Input>
        )}
      </Modal>
    </div>
  );
}
