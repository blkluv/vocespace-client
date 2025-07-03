// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Modal, Input, Button, message, Spin, Alert } from 'antd';
// import { useI18n } from '@/lib/i18n/i18n';

// interface NotionAppProps {
//   open: boolean;
//   onClose: () => void;
//   roomName: string;
// }

// export function NotionApp({ open, onClose, roomName }: NotionAppProps) {
//   const { t } = useI18n();
//   const [notionUrl, setNotionUrl] = useState<string>('');
//   const [validUrl, setValidUrl] = useState<string>('');
//   const [loading, setLoading] = useState(false);
//   const [messageApi, contextHolder] = message.useMessage();

//   // 验证 Notion URL 格式
//   const validateNotionUrl = (url: string): boolean => {
//     const notionRegex = /^https:\/\/(?:www\.)?notion\.so\/[a-zA-Z0-9\-]+\/[a-zA-Z0-9\-]+$/;
//     const notionPageRegex = /^https:\/\/[a-zA-Z0-9\-]+\.notion\.site\/[a-zA-Z0-9\-]+$/;
//     return notionRegex.test(url) || notionPageRegex.test(url);
//   };

//   // 转换 Notion URL 为可嵌入的格式
//   const convertToEmbedUrl = (url: string): string => {
//     if (url.includes('notion.so')) {
//       // 提取页面ID并转换为嵌入格式
//       const pageId = url.split('/').pop()?.split('-').pop();
//       if (pageId) {
//         return `https://www.notion.so/embed/${pageId}`;
//       }
//     } else if (url.includes('notion.site')) {
//       // 已经是可嵌入的格式，直接使用
//       return url;
//     }
//     return url;
//   };

//   const handleLoadNotion = () => {
//     if (!notionUrl.trim()) {
//       messageApi.error('请输入 Notion 页面链接');
//       return;
//     }

//     // if (!validateNotionUrl(notionUrl)) {
//     //   messageApi.error('请输入有效的 Notion 页面链接');
//     //   return;
//     // }

//     setLoading(true);
//     const embedUrl = convertToEmbedUrl(notionUrl);
    
//     // 模拟加载延迟
//     setTimeout(() => {
//       setValidUrl(embedUrl);
//       setLoading(false);
//       messageApi.success('Notion 页面加载成功');
//     }, 1000);
//   };

//   const handleReset = () => {
//     setNotionUrl('');
//     setValidUrl('');
//   };

//   return (
//     <>
//       {contextHolder}
//       <Modal
//         title={`Notion`}
//         open={open}
//         onCancel={onClose}
//         width="90%"
//         style={{ top: 20 }}
//         bodyStyle={{ height: 'calc(100vh - 120px)', padding: 0 }}
//         footer={null}
//         destroyOnClose
//       >
//         <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//           {/* 控制栏 */}
//           <div style={{ 
//             padding: '16px', 
//             borderBottom: '1px solid #d9d9d9',
//             backgroundColor: '#fafafa'
//           }}>
//             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
//               <Input
//                 placeholder="输入 Notion 页面链接 (如: https://www.notion.so/your-page)"
//                 value={notionUrl}
//                 onChange={(e) => setNotionUrl(e.target.value)}
//                 style={{ flex: 1 }}
//                 onPressEnter={handleLoadNotion}
//               />
//               <Button 
//                 type="primary" 
//                 onClick={handleLoadNotion}
//                 loading={loading}
//               >
//                 加载页面
//               </Button>
//               <Button onClick={handleReset}>
//                 重置
//               </Button>
//             </div>
            
//             <Alert
//               message="提示"
//               description="请确保 Notion 页面已设置为公开访问，否则可能无法正常显示"
//               type="info"
//               showIcon
//               style={{ marginTop: '12px' }}
//               closable
//             />
//           </div>

//           {/* 内容区域 */}
//           <div style={{ flex: 1, position: 'relative' }}>
//             {loading && (
//               <div style={{ 
//                 position: 'absolute', 
//                 top: '50%', 
//                 left: '50%', 
//                 transform: 'translate(-50%, -50%)',
//                 zIndex: 10
//               }}>
//                 <Spin size="large" />
//                 <div style={{ marginTop: '16px', textAlign: 'center' }}>
//                   正在加载 Notion 页面...
//                 </div>
//               </div>
//             )}
            
//             {!validUrl && !loading && (
//               <div style={{ 
//                 height: '100%', 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 justifyContent: 'center',
//                 flexDirection: 'column',
//                 color: '#666'
//               }}>
//                 <div style={{ fontSize: '18px', marginBottom: '8px' }}>
//                   📝 协作文档
//                 </div>
//                 <div>请输入 Notion 页面链接开始协作</div>
//               </div>
//             )}
            
//             {validUrl && !loading && (
//               <iframe
//                 src={validUrl}
//                 style={{
//                   width: '100%',
//                   height: '100%',
//                   border: 'none',
//                   backgroundColor: 'white'
//                 }}
//                 title={`Notion App - Room ${roomName}`}
//                 sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
//               />
//             )}
//           </div>
//         </div>
//       </Modal>
//     </>
//   );
// }