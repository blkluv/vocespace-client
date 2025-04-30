import * as React from 'react';
import { Chat, useChat, useLocalParticipant } from '@livekit/components-react';
import { Avatar, Button, Drawer, Image, Input, message, Modal, Popover, Upload } from 'antd';
import type { GetProp, UploadProps } from 'antd';
import { pictureCallback, SvgResource } from '@/app/resources/svg';
import styles from '@/styles/chat.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { setting_drawer_header } from '@/app/devices/controls/bar';
import { ulid } from 'ulid';
import { Room } from 'livekit-client';
import { socket } from '@/app/rooms/[roomName]/PageClientImpl';
import { MessageInstance } from 'antd/es/message/interface';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface EnhancedChatProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  room: Room;
  sendFileConfirm: (onOk: () => Promise<void>) => void;
  messageApi: MessageInstance;
}

export function EnhancedChat({
  open,
  setOpen,
  onClose,
  room,
  sendFileConfirm,
  messageApi,
}: EnhancedChatProps) {
  const { t } = useI18n();
  const ulRef = React.useRef<HTMLUListElement>(null);
  const [messages, setMessages] = React.useState<ChatMsgItem[]>([]);
  const [value, setValue] = React.useState('');
  // const [uploadFile, setUploadFile] = React.useState<FileType | null>(null);
  // [socket] ----------------------------------------------------------------------------------
  React.useEffect(() => {
    socket.on('chat_msg_response', (msg: ChatMsgItem) => {
      if (msg.roomName == room.name) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('chat_file_response', (msg: ChatMsgItem) => {
      if (msg.roomName == room.name) {
        console.warn('chat_file_response', msg);
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('chat_msg');
      socket.off('chat_msg_response');
    };
  }, [socket]);
  // [send methods] ----------------------------------------------------------------------------
  const sendMsg = async () => {
    const msg = value.trim();
    if (msg === '') {
      return;
    }

    const chatMsg: ChatMsgItem = {
      sender: {
        id: room.localParticipant.identity,
        name: room.localParticipant.name || room.localParticipant.identity,
      },
      message: msg,
      type: 'text',
      roomName: room.name,
      file: null,
    };

    setMessages((prev) => [...prev, chatMsg]);
    setValue('');
    socket.emit('chat_msg', chatMsg);
  };

  // [upload] ----------------------------------------------------------------------------------
  const handleBeforeUpload = (file: FileType) => {
    sendFileConfirm(async () => {
      const reader = new FileReader();
      try {
        reader.onload = (e) => {
          const fileData = e.target?.result;
          // 更新本地消息记录
          const fileMessage: ChatMsgItem = {
            sender: {
              id: localParticipant.identity,
              name: localParticipant.name || localParticipant.identity,
            },
            message: null,
            type: 'file',
            roomName: room.name,
            file: {
              name: file.name,
              size: file.size,
              type: file.type,
              data: fileData,
            },
          };

          // 发送文件消息
          socket.emit('chat_file', fileMessage);
        };
        if (file.size < 5 * 1024 * 1024) {
          // 小于5MB的文件
          reader.readAsDataURL(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      } catch (e) {
        messageApi.error({
          content: `${t('msg.error.file.upload')}: ${e}`,
          duration: 1,
        });
        console.error('Error reading file:', e);
      }
    });
    return false; // 阻止自动上传
  };

  const scrollToBottom = () => {
    const el = ulRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };
  const { localParticipant } = useLocalParticipant();
  const isLocal = (identity?: string): boolean => {
    if (identity) {
      console.log('localParticipant', identity, localParticipant.identity);
      return localParticipant.identity === identity;
    } else {
      return false;
    }
  };

  const is_img = (type: string) => {
    return type.startsWith('image/');
  };

  const downloadFile = async (url?: string) => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = url.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      messageApi.error({
        content: t('msg.error.file.download'),
        duration: 1,
      });
    }
  };

  return (
    <Drawer
      title={t('common.chat')}
      onClose={onClose}
      open={open}
      closable={false}
      width={'440px'}
      extra={setting_drawer_header({
        on_clicked: () => setOpen(false),
      })}
      style={{ backgroundColor: '#111', padding: 0, margin: 0, color: '#fff' }}
    >
      <div className={styles.msg}>
        <ul ref={ulRef} className={styles.msg_list}>
          {messages.map((msg) =>
            isLocal(msg.sender.id) ? (
              <li key={ulid()} className={styles.msg_item}>
                <div className={styles.msg_item_wrapper}>
                  <div className={styles.msg_item_content}>
                    <h4 className={styles.msg_item_content_name}>{msg.sender.name || 'unknown'}</h4>
                    {msg.type === 'text' ? (
                      <p className={styles.msg_item_content_msg}>{msg.message}</p>
                    ) : (
                      <Popover
                        placement="right"
                        style={{ background: '#1E1E1E' }}
                        content={
                          <Button
                            shape="circle"
                            type="text"
                            onClick={() => downloadFile(msg?.file?.url)}
                          >
                            <SvgResource type="download" svgSize={16} color="#22CCEE"></SvgResource>
                          </Button>
                        }
                      >
                        {msg.file && (
                          <p className={styles.msg_item_content_msg}>
                            {is_img(msg.file.type) ? (
                              <Image
                                src={msg.file.url}
                                width={'70%'}
                                fallback={pictureCallback}
                              ></Image>
                            ) : (
                              <div className={styles.msg_item_content_msg_file}>
                                <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                                  <SvgResource
                                    type="file"
                                    color="#22CCEE"
                                    svgSize={42}
                                  ></SvgResource>
                                </a>
                                <div className={styles.msg_item_content_msg_file_info}>
                                  <h4>{msg.file.name}</h4>
                                  <p>{Math.round(msg.file.size / 1024)}KB</p>
                                </div>
                              </div>
                            )}
                          </p>
                        )}
                      </Popover>
                    )}
                  </div>
                </div>
              </li>
            ) : (
              <li key={ulid()} className={styles.msg_item__remote}>
                <div className={styles.msg_item_wrapper}>
                  <div className={styles.msg_item_content} style={{ justifyContent: 'flex-end' }}>
                    <h4 className={styles.msg_item_content_name} style={{ textAlign: 'end' }}>
                      {msg.sender.name}
                    </h4>
                    {msg.type === 'text' ? (
                      <p className={styles.msg_item_content_msg}>{msg.message}</p>
                    ) : (
                      <Popover
                        placement="right"
                        style={{ background: '#1E1E1E' }}
                        content={
                          <Button
                            shape="circle"
                            type="text"
                            onClick={() => downloadFile(msg?.file?.url)}
                          >
                            <SvgResource type="download" svgSize={16} color="#22CCEE"></SvgResource>
                          </Button>
                        }
                      >
                        {msg.file && (
                          <p className={styles.msg_item_content_msg}>
                            {is_img(msg.file.type) ? (
                              <Image
                                src={msg.file.url}
                                height={42}
                                fallback={pictureCallback}
                              ></Image>
                            ) : (
                              <div className={styles.msg_item_content_msg_file}>
                                <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                                  <SvgResource
                                    type="file"
                                    color="#22CCEE"
                                    svgSize={42}
                                  ></SvgResource>
                                </a>
                                <div className={styles.msg_item_content_msg_file_info}>
                                  <h4>{msg.file.name}</h4>
                                  <p>{Math.round(msg.file.size / 1024)}KB</p>
                                </div>
                              </div>
                            )}
                          </p>
                        )}
                      </Popover>
                    )}
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>

      <div className={styles.tool}>
        <Input
          value={value}
          placeholder={t('common.chat_placeholder')}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          style={{ paddingRight: 0, backgroundColor: '#333' }}
          prefix={
            <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
              <Button shape="circle" style={{ background: 'transparent', border: 'none' }}>
                <SvgResource type="add" svgSize={18} color="#fff" />
              </Button>
            </Upload>
          }
          suffix={
            <Button style={{ border: 'none' }} type="primary" onClick={sendMsg}>
              {t('common.send')}
            </Button>
          }
        />
      </div>
    </Drawer>
  );
}

interface ChatMsgItem {
  id?: string;
  sender: {
    id: string;
    name: string;
  };
  message: string | null;
  type: 'text' | 'file';
  roomName: string;
  timestamp?: string;
  file: {
    name: string;
    size: number;
    type: string;
    url?: string;
    data?: string | ArrayBuffer | null;
  } | null;
}
