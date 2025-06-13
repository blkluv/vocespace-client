'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Modal,
  Tooltip,
  Progress,
  Empty,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { connect_endpoint } from '@/lib/std';
import { ulid } from 'ulid';
import { SvgResource } from '../resources/svg';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface RecordItem {
  key: string;
  size: number;
  last_modified: number;
}

interface RecordData extends RecordItem {
  id: string;

  // state: 'uploading' | 'completed';
  // filePath?: string;
  // progress?: number; // 上传进度 0-100
}

interface RecordResponse {
  records: RecordItem[];
  success: boolean;
}

enum RecordState {
  // 获取环境变量状态，表示需要获取环境变量
  GetEnv,
  // 初始化状态，在初始状态时需要尝试连接s3服务
  Init,
  // 连接状态，表示已经连接到s3服务
  Connected,
  // 无法连接，表示无法连接到s3服务或后端服务没有部署s3服务或前端没有配置s3服务
  UnAvailable,
}

export interface EnvData {
  s3_access_key?: string;
  s3_secret_key?: string;
  s3_bucket?: string;
  s3_region?: string;
  server_host?: string;
}

const isUndefinedString = (value: string | undefined): boolean => {
  return value === undefined || value.trim() === '';
};

const CONNECT_ENDPOINT = connect_endpoint('/api/record');

export default function RecordsPage() {
  const [roomName, setRoomName] = useState<string>('');
  const [recordsData, setRecordsData] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();
  const [state, setState] = useState<RecordState>(RecordState.GetEnv);
  const [env, setEnv] = useState<EnvData | null>(null);

  const isConnected = useMemo(() => {
    switch (state) {
      case RecordState.GetEnv:
        return '获取环境变量中...';
      case RecordState.Init:
        return '正在连接S3服务...';
      case RecordState.Connected:
        return '已连接到S3服务';
      case RecordState.UnAvailable:
        return '无法连接到S3服务';
      default:
        return '';
    }
  }, [state]);

  const get_env = useCallback(async () => {
    if (env != null) return;

    const url = new URL(CONNECT_ENDPOINT, window.location.origin);
    url.searchParams.set('env', 'true');
    const response = await fetch(url.toString());
    if (response.ok) {
      const { s3_access_key, s3_secret_key, s3_bucket, s3_region, server_host }: EnvData =
        await response.json();

      if (
        isUndefinedString(s3_access_key) ||
        isUndefinedString(s3_secret_key) ||
        isUndefinedString(s3_bucket) ||
        isUndefinedString(s3_region) ||
        isUndefinedString(server_host)
      ) {
        setState(RecordState.UnAvailable);
        messageApi.error('S3服务未配置或环境变量未设置');
      } else {
        setEnv({
          s3_access_key,
          s3_secret_key,
          s3_bucket,
          s3_region,
          server_host,
        });
        setState(RecordState.Init);
        messageApi.success('S3服务环境变量获取成功');
      }
    }
  }, [env]);

  const try_connectS3 = useCallback(async () => {
    try {
      const response = await fetch(`${env?.server_host}/api/s3/connect`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState(RecordState.Connected);
          messageApi.success('S3服务连接成功');
        } else {
          setState(RecordState.UnAvailable);
          messageApi.error('S3服务连接失败，请检查配置');
        }
      }
    } catch (error) {
      console.error('S3连接测试失败:', error);
      setState(RecordState.UnAvailable);
    }
  }, [env]);

  useEffect(() => {
    switch (state) {
      case RecordState.GetEnv:
        // 获取环境变量
        get_env();
        break;
      case RecordState.Init:
        // 尝试连接S3服务
        try_connectS3();
        break;
      case RecordState.Connected:
        // 已经连接到S3服务，可以进行后续操作
        break;
      case RecordState.UnAvailable:
        // 无法连接到S3服务，提示用户
        messageApi.error('无法连接到S3服务，当前可能访问了本地服务，请检查配置或联系管理员');
        break;
      default:
        break;
    }
  }, [state, get_env, try_connectS3]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 搜索房间录制数据
  const searchRoomRecords = async (room?: string) => {
    let seachRoom = room || roomName.trim();

    if (!seachRoom) {
      messageApi.warning('请输入房间名');
      return;
    }

    setSearchLoading(true);
    try {
      // 这里应该调用实际的API接口
      const response = await fetch(`${env?.server_host}/api/s3/${seachRoom}`);

      if (response.ok) {
        const { records, success }: RecordResponse = await response.json();
        if (success && records.length > 0) {
          let formattedRecords: RecordData[] = records.map((record) => ({
            ...record,
            id: ulid(), // 使用 ulid 生成唯一 ID
          }));

          setRecordsData(formattedRecords);
          // key 分割第一个 / 之前的部分作为房间名
          let realRoom = records[0].key.split('/')[0];
          setCurrentRoom(realRoom);
          messageApi.success('查找录制文件成功');
          return;
        }
      }
      messageApi.error(
        '查找录制文件为空，请检查房间名是否正确，房间内可能没有录制视频文件或已经删除',
      );
      setRecordsData([]);
      setCurrentRoom('');
    } catch (error) {
      console.error('Search failed:', error);
      messageApi.error('网络错误，请稍后重试');
      setRecordsData([]);
      setCurrentRoom('');
    } finally {
      setSearchLoading(false);
    }
  };

  // 下载文件
  const handleDownload = async (record: RecordData) => {
    const response = await fetch(`${env?.server_host}/api/s3/download?key=${record.key}`);
    if (response.ok) {
      const {
        success,
        url,
      }: {
        success: boolean;
        url?: string;
      } = await response.json();

      if (success) {
        // 创建一个链接元素并触发下载
        const link = document.createElement('a');
        link.href = url!;
        link.download = record.key;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        messageApi.success('下载链接获取成功，文件正在下载');
      } else {
        messageApi.error('下载链接获取失败，请稍后重试或联系管理员进行下载');
      }
    }
  };

  // 删除文件
  const handleDelete = (record: RecordData) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除录制文件 "${record.key}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(`${env?.server_host}/api/s3/delete?key=${record.key}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            const { success }: { success: boolean } = await response.json();
            if (success) {
              // 从记录数据中删除该记录
              setRecordsData((prev) => prev.filter((item) => item.id !== record.id));
              messageApi.success('删除成功');
              return;
            }
          }
          messageApi.error('删除失败');
        } catch (error) {
          console.error('Delete failed:', error);
          messageApi.error('删除失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    if (currentRoom) {
      searchRoomRecords(currentRoom);
    }
  };

  // 表格列定义
  const columns: ColumnsType<RecordData> = [
    {
      title: '文件名',
      dataIndex: 'key',
      key: 'key',
      width: 210,
      render: (key: string, record) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SvgResource
            type={key.endsWith('json') ? 'file' : 'video'}
            svgSize={16}
            color="#22CCEE"
          ></SvgResource>
          <Text strong>{key.replace(`${currentRoom}/`, '')}</Text>
        </div>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => <Text>{formatFileSize(size)}</Text>,
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: '最后修改时间',
      dataIndex: 'last_modified',
      key: 'last_modified',
      width: 180,
      ellipsis: true,
      render: (last_modified: number) => (
        <Text>
          {new Date(last_modified * 1000).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </Text>
      ),
      sorter: (a, b) => new Date(a.last_modified).getTime(),
    },
    {
      title: '类型',
      dataIndex: 'key',
      key: 'ty',
      width: 80,
      ellipsis: true,
      render: (key: string) => {
        return (
          <Tag color={key.endsWith('json') ? 'green' : 'blue'}>
            {key.endsWith('json') ? '记录文件' : '视频文件'}
          </Tag>
        );
      },
    },
    // {
    //   title: '状态',
    //   dataIndex: 'state',
    //   key: 'state',
    //   width: 150,
    //   render: (state: string, record) => {
    //     if (state === 'uploading') {
    //       return (
    //         <Space direction="vertical" size="small">
    //           <Tag color="processing">正在上传</Tag>
    //           {record.progress !== undefined && (
    //             <Progress percent={record.progress} size="small" status="active" />
    //           )}
    //         </Space>
    //       );
    //     }
    //     return <Tag color="success">上传完成</Tag>;
    //   },
    //   filters: [
    //     { text: '正在上传', value: 'uploading' },
    //     { text: '上传完成', value: 'completed' },
    //   ],
    //   onFilter: (value, record) => record.state === value,
    // },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            loading={loading}
          >
            下载
          </Button>
          <Tooltip title="删除文件">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              loading={loading}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#000', minHeight: '100vh' }}>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'inline-flex',
            gap: 8,
            width: '100%',
            alignItems: 'center',
            paddingBottom: '12px',
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            录制文件管理
          </Title>
          <div>
            <Tag color="blue">{isConnected}</Tag>
          </div>
        </div>
        <Text>输入房间名查找并管理该房间的录制视频文件</Text>
      </div>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'inline-flex', justifyContent: 'space-between' }}>
            <Input
              style={{
                outline: '1px solid #22CCEE',
                width: 'calc(100% - 100px)',
              }}
              placeholder="请输入房间名"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => searchRoomRecords()}>
              搜索
            </Button>
          </div>
          {currentRoom && (
            <Tooltip title="刷新数据">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={searchLoading}>
                刷新
              </Button>
            </Tooltip>
          )}
        </div>
        {currentRoom && (
          <div style={{ marginTop: 16 }}>
            <Text strong>当前房间：{currentRoom} &nbsp;</Text>

            <Text>共 {recordsData.length} 个文件</Text>
          </div>
        )}
      </Card>

      {/* 文件列表 */}
      <Card title="录制文件列表">
        {!currentRoom ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请输入房间名并搜索以查看录制文件"
          />
        ) : (
          <Spin spinning={searchLoading}>
            <Table
              columns={columns}
              dataSource={recordsData}
              rowKey={(record) => record.id}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
              locale={{
                emptyText: '该房间暂无录制文件',
              }}
            />
          </Spin>
        )}
      </Card>
    </div>
  );
}
