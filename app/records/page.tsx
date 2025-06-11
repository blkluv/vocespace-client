'use client';

import React, { useState, useEffect } from 'react';
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

const { Title, Text } = Typography;
const { Search } = Input;
const { confirm } = Modal;

interface RecordData {
  id: string;
  fileName: string;
  size: number;
  createDate: string;
  state: 'uploading' | 'completed';
  filePath?: string;
  progress?: number; // 上传进度 0-100
}

interface RecordResponse {
  records: RecordData[];
  total: number;
}

export default function RecordsPage() {
  const [roomName, setRoomName] = useState<string>('');
  const [recordsData, setRecordsData] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 搜索房间录制数据
  const searchRoomRecords = async (room: string) => {
    if (!room.trim()) {
      messageApi.warning('请输入房间名');
      return;
    }

    setSearchLoading(true);
    try {
      // 这里应该调用实际的API接口
      const response = await fetch(`/api/records?room=${encodeURIComponent(room)}`);
      
      if (response.ok) {
        const data: RecordResponse = await response.json();
        setRecordsData(data.records);
        setCurrentRoom(room);
        messageApi.success(`找到 ${data.records.length} 个录制文件`);
      } else {
        const errorData = await response.json();
        messageApi.error(errorData.error || '查找录制文件失败');
        setRecordsData([]);
        setCurrentRoom('');
      }
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
    if (record.state === 'uploading') {
      messageApi.warning('文件正在上传中，请等待上传完成');
      return;
    }

    setLoading(true);
    try {
      // 调用生成下载链接的API
      const response = await fetch('/api/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: currentRoom,
          type: 'download',
          filePath: record.filePath,
        }),
      });

      if (response.ok) {
        const { downloadUrl } = await response.json();
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = record.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        messageApi.success('下载开始');
      } else {
        const { error } = await response.json();
        messageApi.error(error || '生成下载链接失败');
      }
    } catch (error) {
      console.error('Download failed:', error);
      messageApi.error('下载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除文件
  const handleDelete = (record: RecordData) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除录制文件 "${record.fileName}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/records/${record.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setRecordsData(prev => prev.filter(item => item.id !== record.id));
            messageApi.success('删除成功');
          } else {
            const { error } = await response.json();
            messageApi.error(error || '删除失败');
          }
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
      dataIndex: 'fileName',
      key: 'fileName',
      width: 300,
      render: (fileName: string, record) => (
        <Space>
          <FileOutlined style={{ color: '#1890ff' }} />
          <Text strong>{fileName}</Text>
          {record.state === 'uploading' && (
            <Tag color="processing">上传中</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => (
        <Text>{formatFileSize(size)}</Text>
      ),
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      render: (date: string) => (
        <Text>{new Date(date).toLocaleString('zh-CN')}</Text>
      ),
      sorter: (a, b) => new Date(a.createDate).getTime() - new Date(b.createDate).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 150,
      render: (state: string, record) => {
        if (state === 'uploading') {
          return (
            <Space direction="vertical" size="small">
              <Tag color="processing">正在上传</Tag>
              {record.progress !== undefined && (
                <Progress 
                  percent={record.progress} 
                  size="small" 
                  status="active"
                />
              )}
            </Space>
          );
        }
        return <Tag color="success">上传完成</Tag>;
      },
      filters: [
        { text: '正在上传', value: 'uploading' },
        { text: '上传完成', value: 'completed' },
      ],
      onFilter: (value, record) => record.state === value,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title={record.state === 'uploading' ? '文件上传中，暂不可下载' : '下载文件'}>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={record.state === 'uploading'}
              loading={loading}
            >
              下载
            </Button>
          </Tooltip>
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
        <Title level={2}>录制文件管理</Title>
        <Text type="secondary">
          输入房间名查找并管理该房间的录制视频文件
        </Text>
      </div>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <Search
            style={{
                outline: '1px solid #22CCEE'
            }}
              placeholder="请输入房间名"
              enterButton={
                <Button type="primary" icon={<SearchOutlined />}>
                  搜索
                </Button>
              }
              size="large"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onSearch={(value) => searchRoomRecords(value)}
              loading={searchLoading}
            />
          </div>
          {currentRoom && (
            <Tooltip title="刷新数据">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={searchLoading}
              >
                刷新
              </Button>
            </Tooltip>
          )}
        </div>
        {currentRoom && (
          <div style={{ marginTop: 16 }}>
            <Text strong>当前房间：</Text>
            <Tag color="blue">{currentRoom}</Tag>
            <Text type="secondary">共 {recordsData.length} 个文件</Text>
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
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
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