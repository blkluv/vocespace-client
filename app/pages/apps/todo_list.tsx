// import React, { useState } from 'react';
// import {
//   Timeline,
//   Button,
//   Modal,
//   Form,
//   Input,
//   DatePicker,
//   Space,
//   Card,
//   Tag,
//   Typography,
//   message,
//   Tooltip,
//   Popconfirm
// } from 'antd';
// import {
//   PlusOutlined,
//   CheckOutlined,
//   ClockCircleOutlined,
//   CalendarOutlined,
//   EditOutlined,
//   DeleteOutlined
// } from '@ant-design/icons';
// // import dayjs, { type number } from 'dayjs';

// const { TextArea } = Input;
// const { Title, Text } = Typography;

// export interface TodoItem {
//   id: string;
//   title: string;
//   description: string;
//   deadline: number | null;
//   startTime: number | null;
//   endTime: number | null;
//   completed: boolean;
//   createdAt: number;
// }

// export interface TodoListAppProps {}

// export function TodoListApp({}: TodoListAppProps) {
//   const [todos, setTodos] = useState<TodoItem[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [form] = Form.useForm();

//   // 创建新的 Todo
//   const createTodo = (values: any) => {
//     const newTodo: TodoItem = {
//       id: Date.now().toString(),
//       title: values.title,
//       description: values.description || '',
//       deadline: values.deadline,
//       startTime: values.startTime,
//       endTime: null,
//       completed: false,
//       createdAt: Date.now(),
//     };

//     setTodos(prev => [...prev, newTodo]);
//     setModalVisible(false);
//     form.resetFields();
//     message.success('Todo 创建成功！');
//   };

//   // 完成 Todo
//   const completeTodo = (id: string) => {
//     setTodos(prev =>
//       prev.map(todo =>
//         todo.id === id
//           ? { ...todo, completed: true, endTime: Date.now() }
//           : todo
//       )
//     );
//     message.success('Todo 已完成！');
//   };

//   // 删除 Todo
//   const deleteTodo = (id: string) => {
//     setTodos(prev => prev.filter(todo => todo.id !== id));
//     message.success('Todo 已删除！');
//   };

//   // 排序 Todos
//   const getSortedTodos = (): TodoItem[] => {
//     const completed = todos.filter(todo => todo.completed);
//     const incomplete = todos.filter(todo => !todo.completed);

//     // 完成的按结束时间排序
//     completed.sort((a, b) => {
//       if (!a.endTime || !b.endTime) return 0;
//       return a.endTime.valueOf() - b.endTime.valueOf();
//     });

//     // 未完成的按开始时间或创建时间排序
//     incomplete.sort((a, b) => {
//       const timeA = a.startTime || a.createdAt;
//       const timeB = b.startTime || b.createdAt;
//       return timeA.valueOf() - timeB.valueOf();
//     });

//     return [...incomplete, ...completed];
//   };

//   // 获取时间轴项目
//   const getTimelineItems = () => {
//     const sortedTodos = getSortedTodos();

//     return sortedTodos.map((todo, index) => {
//       const isOverdue = todo.deadline && Date.now().isAfter(todo.deadline) && !todo.completed;
      
//       return {
//         key: todo.id,
//         color: todo.completed ? 'green' : isOverdue ? 'red' : 'blue',
//         dot: todo.completed ? (
//           <CheckOutlined style={{ fontSize: '16px', color: 'green' }} />
//         ) : isOverdue ? (
//           <ClockCircleOutlined style={{ fontSize: '16px', color: 'red' }} />
//         ) : (
//           <ClockCircleOutlined style={{ fontSize: '16px', color: 'blue' }} />
//         ),
//         children: (
//           <Card
//             size="small"
//             style={{
//               marginBottom: 16,
//               opacity: todo.completed ? 0.7 : 1,
//               border: isOverdue ? '1px solid #ff4d4f' : undefined
//             }}
//             actions={
//               !todo.completed
//                 ? [
//                     <Tooltip title="完成 Todo">
//                       <Button
//                         type="text"
//                         icon={<CheckOutlined />}
//                         onClick={() => completeTodo(todo.id)}
//                         style={{ color: '#52c41a' }}
//                       />
//                     </Tooltip>,
//                     <Popconfirm
//                       title="确定要删除这个 Todo 吗？"
//                       onConfirm={() => deleteTodo(todo.id)}
//                       okText="确定"
//                       cancelText="取消"
//                     >
//                       <Tooltip title="删除 Todo">
//                         <Button
//                           type="text"
//                           icon={<DeleteOutlined />}
//                           style={{ color: '#ff4d4f' }}
//                         />
//                       </Tooltip>
//                     </Popconfirm>
//                   ]
//                 : [
//                     <Popconfirm
//                       title="确定要删除这个 Todo 吗？"
//                       onConfirm={() => deleteTodo(todo.id)}
//                       okText="确定"
//                       cancelText="取消"
//                     >
//                       <Tooltip title="删除 Todo">
//                         <Button
//                           type="text"
//                           icon={<DeleteOutlined />}
//                           style={{ color: '#ff4d4f' }}
//                         />
//                       </Tooltip>
//                     </Popconfirm>
//                   ]
//             }
//           >
//             <div>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
//                 <Title level={5} style={{ margin: 0, textDecoration: todo.completed ? 'line-through' : 'none' }}>
//                   {todo.title}
//                 </Title>
//                 <Space size={4}>
//                   {todo.completed && (
//                     <Tag color="success" icon={<CheckOutlined />}>
//                       已完成
//                     </Tag>
//                   )}
//                   {isOverdue && (
//                     <Tag color="error">
//                       已逾期
//                     </Tag>
//                   )}
//                 </Space>
//               </div>

//               {todo.description && (
//                 <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: 8 }}>
//                   {todo.description}
//                 </Text>
//               )}

//               <Space direction="vertical" size={4} style={{ width: '100%' }}>
//                 {todo.startTime && (
//                   <div style={{ fontSize: '12px', color: '#666' }}>
//                     <CalendarOutlined style={{ marginRight: 4 }} />
//                     开始时间: {todo.startTime.format('YYYY-MM-DD HH:mm')}
//                   </div>
//                 )}
                
//                 {todo.deadline && (
//                   <div style={{ fontSize: '12px', color: isOverdue ? '#ff4d4f' : '#666' }}>
//                     <ClockCircleOutlined style={{ marginRight: 4 }} />
//                     截止时间: {todo.deadline.format('YYYY-MM-DD HH:mm')}
//                   </div>
//                 )}

//                 {todo.completed && todo.endTime && (
//                   <div style={{ fontSize: '12px', color: '#52c41a' }}>
//                     <CheckOutlined style={{ marginRight: 4 }} />
//                     完成时间: {todo.endTime.format('YYYY-MM-DD HH:mm')}
//                   </div>
//                 )}

//                 <div style={{ fontSize: '12px', color: '#999' }}>
//                   创建时间: {todo.createdAt.format('YYYY-MM-DD HH:mm')}
//                 </div>
//               </Space>
//             </div>
//           </Card>
//         ),
//       };
//     });
//   };

//   const timelineItems = getTimelineItems();

//   return (
//     <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
//         <Title level={2} style={{ margin: 0 }}>
//           Todo 时间轴
//         </Title>
//         <Button
//           type="primary"
//           icon={<PlusOutlined />}
//           onClick={() => setModalVisible(true)}
//           size="large"
//         >
//           创建 Todo
//         </Button>
//       </div>

//       {timelineItems.length === 0 ? (
//         <Card style={{ textAlign: 'center', padding: '40px' }}>
//           <div style={{ color: '#999', fontSize: '16px' }}>
//             暂无 Todo，点击上方按钮创建第一个 Todo
//           </div>
//         </Card>
//       ) : (
//         <Timeline items={timelineItems} mode="left" />
//       )}

//       {/* 创建 Todo 的模态框 */}
//       <Modal
//         title="创建新的 Todo"
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//         }}
//         onOk={() => form.submit()}
//         okText="创建"
//         cancelText="取消"
//         width={600}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={createTodo}
//           style={{ marginTop: 16 }}
//         >
//           <Form.Item
//             name="title"
//             label="Todo 标题"
//             rules={[{ required: true, message: '请输入 Todo 标题' }]}
//           >
//             <Input placeholder="请输入 Todo 标题" />
//           </Form.Item>

//           <Form.Item
//             name="description"
//             label="Todo 概述"
//           >
//             <TextArea
//               placeholder="请输入 Todo 的详细描述（可选）"
//               autoSize={{ minRows: 3, maxRows: 6 }}
//             />
//           </Form.Item>

//           <Form.Item
//             name="startTime"
//             label="开始时间（可选）"
//           >
//             <DatePicker
//               showTime
//               placeholder="选择开始时间"
//               style={{ width: '100%' }}
//               format="YYYY-MM-DD HH:mm"
//             />
//           </Form.Item>

//           <Form.Item
//             name="deadline"
//             label="截止时间"
//             rules={[{ required: true, message: '请选择截止时间' }]}
//           >
//             <DatePicker
//               showTime
//               placeholder="选择截止时间"
//               style={{ width: '100%' }}
//               format="YYYY-MM-DD HH:mm"
//               disabledDate={(current) => current && current < Date.now().startOf('day')}
//             />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* 统计信息 */}
//       {todos.length > 0 && (
//         <Card style={{ marginTop: 24 }}>
//           <Space size="large">
//             <div>
//               <Text strong>总计: </Text>
//               <Text>{todos.length}</Text>
//             </div>
//             <div>
//               <Text strong>已完成: </Text>
//               <Text style={{ color: '#52c41a' }}>{todos.filter(t => t.completed).length}</Text>
//             </div>
//             <div>
//               <Text strong>进行中: </Text>
//               <Text style={{ color: '#1890ff' }}>{todos.filter(t => !t.completed && (!t.deadline || Date.now().isBefore(t.deadline))).length}</Text>
//             </div>
//             <div>
//               <Text strong>已逾期: </Text>
//               <Text style={{ color: '#ff4d4f' }}>{todos.filter(t => !t.completed && t.deadline && Date.now().isAfter(t.deadline)).length}</Text>
//             </div>
//           </Space>
//         </Card>
//       )}
//     </div>
//   );
// }

// export default TodoListApp;