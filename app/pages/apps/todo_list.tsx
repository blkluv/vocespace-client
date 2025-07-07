import React, { useMemo, useState } from 'react';
import {
  Timeline,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Card,
  Tag,
  Typography,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Collapse,
  CollapseProps,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useI18n } from '@/lib/i18n/i18n';

const { TextArea } = Input;
const { Title, Text } = Typography;

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  deadline: Dayjs | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  completed: boolean;
  createdAt: Dayjs;
}

export interface TodoListAppProps {}

export function AppTodoList({}: TodoListAppProps) {
  const { t } = useI18n();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const defaultInputStyle = {
    outline: '1px solid #22CCEE',
  };

  // 创建新的 Todo
  const createTodo = (values: any) => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description || '',
      deadline: values.deadline,
      startTime: values.startTime,
      endTime: null,
      completed: false,
      createdAt: dayjs(),
    };

    setTodos((prev) => [...prev, newTodo]);
    setModalVisible(false);
    form.resetFields();
    message.success('Todo 创建成功！');
  };

  // 完成 Todo
  const completeTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: true, endTime: dayjs() } : todo)),
    );
    message.success('Todo 已完成！');
  };

  // 删除 Todo
  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    message.success('Todo 已删除！');
  };

  // 排序 Todos
  const getSortedTodos = (): TodoItem[] => {
    const completed = todos.filter((todo) => todo.completed);
    const incomplete = todos.filter((todo) => !todo.completed);

    // 完成的按结束时间排序
    completed.sort((a, b) => {
      if (!a.endTime || !b.endTime) return 0;
      return a.endTime.valueOf() - b.endTime.valueOf();
    });

    // 未完成的按开始时间或创建时间排序
    incomplete.sort((a, b) => {
      const timeA = a.startTime || a.createdAt;
      const timeB = b.startTime || b.createdAt;
      return timeA.valueOf() - timeB.valueOf();
    });

    return [...incomplete, ...completed];
  };

  // 获取时间轴项目
  const timelineItems = useMemo(() => {
    const sortedTodos = getSortedTodos();

    return sortedTodos.map((todo, index) => {
      const isOverdue = todo.deadline && dayjs().isAfter(todo.deadline) && !todo.completed;

      const item: CollapseProps['items'] = [
        {
          key: 'node',
          label: (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <Title
                level={5}
                style={{ marginRight: 8, textDecoration: todo.completed ? 'line-through' : 'none' }}
              >
                {todo.title}
              </Title>
              <Space size={4}>
                {todo.completed && (
                  <Tag color="success" icon={<CheckOutlined />}>
                    {t('more.app.todo.completed')}
                  </Tag>
                )}
                {isOverdue && <Tag color="error">{t('more.app.todo.count.overdue')}</Tag>}
              </Space>
            </div>
          ),
          children: (
            <>
              {todo.description && (
                <div style={{ fontSize: '14px', marginBottom: 8, color: '#8c8c8c' }}>
                  {todo.description}
                </div>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {todo.startTime && (
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {t('more.app.todo.start')}: {todo.startTime.format('YYYY-MM-DD HH:mm')}
                  </div>
                )}

                {todo.deadline && (
                  <div style={{ fontSize: '12px', color: isOverdue ? '#ff4d4f' : '#8c8c8c' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {t('more.app.todo.deadline')}: {todo.deadline.format('YYYY-MM-DD HH:mm')}
                  </div>
                )}

                {todo.completed && todo.endTime && (
                  <div style={{ fontSize: '12px', color: '#52c41a' }}>
                    <CheckOutlined style={{ marginRight: 4 }} />
                    {t('more.app.todo.finish_at')}: {todo.endTime.format('YYYY-MM-DD HH:mm')}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#999' }}>
                  {t('more.app.todo.create_at')}: {todo.createdAt.format('YYYY-MM-DD HH:mm')}
                </div>
              </Space>
            </>
          ),
        },
      ];

      return {
        key: todo.id,
        color: todo.completed ? 'green' : isOverdue ? 'red' : 'blue',
        dot: todo.completed ? (
          <CheckOutlined style={{ fontSize: '16px', color: 'green' }} />
        ) : isOverdue ? (
          <ClockCircleOutlined style={{ fontSize: '16px', color: 'red' }} />
        ) : (
          <ClockCircleOutlined style={{ fontSize: '16px', color: 'blue' }} />
        ),
        children: (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              opacity: todo.completed ? 0.7 : 1,
              border: isOverdue ? '1px solid #ff4d4f' : undefined,
            }}
            actions={
              !todo.completed
                ? [
                    <Tooltip title={t('more.app.todo.tooltip.complete.title')}>
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        onClick={() => completeTodo(todo.id)}
                        style={{ color: '#52c41a' }}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title={t('more.app.todo.tooltip.delete.desc')}
                      onConfirm={() => deleteTodo(todo.id)}
                      okText={t('more.app.todo.tooltip.delete.confirm')}
                      cancelText={t('more.app.todo.tooltip.delete.cancel')}
                    >
                      <Tooltip title={t('more.app.todo.tooltip.delete.title')}>
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          style={{ color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ]
                : [
                    <Popconfirm
                      title={t('more.app.todo.tooltip.delete.desc')}
                      onConfirm={() => deleteTodo(todo.id)}
                      okText={t('more.app.todo.tooltip.delete.confirm')}
                      cancelText={t('more.app.todo.tooltip.delete.cancel')}
                    >
                      <Tooltip title={t('more.app.todo.tooltip.delete.title')}>
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          style={{ color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ]
            }
          >
            <Collapse items={item} bordered={false} expandIconPosition="end"></Collapse>
          </Card>
        ),
      };
    });
  }, [todos]);

  return (
    <div
      style={{
        padding: '24px',
        height: 'calc(100vh - 66px)',
        margin: '0 auto',
        position: 'relative',
        overflowY: 'scroll',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {t('more.app.todo.title')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          {t('more.app.todo.add')}
        </Button>
      </div>

      {timelineItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Empty description={t('more.app.todo.empty')} />
        </Card>
      ) : (
        <Timeline items={timelineItems} mode="left" />
      )}

      {/* 创建 Todo 的模态框 */}
      <Modal
        title={t('more.app.todo.modal.title')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={t('more.app.todo.modal.confirm')}
        cancelText={t('more.app.todo.modal.cancel')}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={createTodo} style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label={t('more.app.todo.modal.name')}
            rules={[{ required: true, message: t('more.app.todo.modal.name_placeholder') }]}
          >
            <Input
              placeholder={t('more.app.todo.modal.name_placeholder')}
              style={defaultInputStyle}
            />
          </Form.Item>

          <Form.Item name="description" label={t('more.app.todo.modal.desc')}>
            <TextArea
              style={defaultInputStyle}
              placeholder={t('more.app.todo.modal.desc_placeholder')}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item name="startTime" label={t('more.app.todo.modal.start')}>
            <DatePicker
              showTime
              placeholder={t('more.app.todo.modal.start_placeholder')}
              style={{ ...defaultInputStyle, width: '100%' }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item
            name="deadline"
            label={t('more.app.todo.modal.end')}
            rules={[{ required: true, message: t('more.app.todo.modal.end_placeholder') }]}
          >
            <DatePicker
              showTime
              placeholder={t('more.app.todo.modal.end_placeholder')}
              style={{ ...defaultInputStyle, width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 统计信息 */}
      {todos.length >= 0 && (
        <Card style={{ marginTop: 24, position: 'static',  }}>
          <Space size="large">
            <div>
              <Text strong>{t('more.app.todo.count.all')}: </Text>
              <Text>{todos.length}</Text>
            </div>
            <div>
              <Text strong>{t('more.app.todo.count.done')}: </Text>
              <Text style={{ color: '#52c41a' }}>{todos.filter((t) => t.completed).length}</Text>
            </div>
            <div>
              <Text strong>{t('more.app.todo.count.running')}: </Text>
              <Text style={{ color: '#1890ff' }}>
                {
                  todos.filter((t) => !t.completed && (!t.deadline || dayjs().isBefore(t.deadline)))
                    .length
                }
              </Text>
            </div>
            <div>
              <Text strong>{t('more.app.todo.count.overdue')}: </Text>
              <Text style={{ color: '#ff4d4f' }}>
                {
                  todos.filter((t) => !t.completed && t.deadline && dayjs().isAfter(t.deadline))
                    .length
                }
              </Text>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
}
