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
import { LinkPreview } from './link_preview';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface EnhancedChatProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  room: Room;
  sendFileConfirm: (onOk: () => Promise<void>) => void;
  messageApi: MessageInstance;
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
  // 添加输入法组合状态跟踪
  const [isComposing, setIsComposing] = React.useState(false);
  // [socket] ----------------------------------------------------------------------------------
  React.useEffect(() => {
    socket.on('chat_msg_response', (msg: ChatMsgItem) => {
      if (msg.roomName == room.name) {
        console.warn('chat_msg_response', msg);
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    socket.on('chat_file_response', (msg: ChatMsgItem) => {
      if (msg.roomName == room.name) {
        console.warn('chat_file_response', msg);
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    return () => {
      socket.off('chat_msg');
      socket.off('chat_msg_response');
    };
  }, [socket, room.name]);
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

  // 处理回车键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 只有在不处于输入法组合状态且按下回车键时才发送消息
    if (e.key === 'Enter' && !isComposing) {
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

  const isImg = (type: string) => {
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

  const msgList = React.useMemo(() => {
    console.warn('msgList', messages);
    return messages.map((msg) => (
      <ChatMsgItemCmp
        key={msg.id || ulid()}
        isLocal={isLocal(msg.sender.id)}
        msg={msg}
        downloadFile={downloadFile}
        isImg={isImg}
      ></ChatMsgItemCmp>
    ));
  }, [messages]);

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
      styles={{
        body: {
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        },
      }}
    >
      <div className={styles.msg}>
        <ul ref={ulRef} className={styles.msg_list}>
          {msgList}
        </ul>
      </div>

      <div className={styles.tool}>
        <Upload beforeUpload={handleBeforeUpload} showUploadList={false}>
          <Button shape="circle" style={{ background: 'transparent', border: 'none' }}>
            <SvgResource type="add" svgSize={18} color="#fff" />
          </Button>
        </Upload>
        <div className={styles.tool_input}>
          <Input
            value={value}
            placeholder={t('common.chat_placeholder')}
            onChange={(e) => setValue(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            style={{ paddingRight: 0, backgroundColor: '#333' }}
          />
        </div>
        <Button style={{ border: 'none' }} type="primary" onClick={sendMsg}>
          {t('common.send')}
        </Button>
      </div>
    </Drawer>
  );
}

interface ChatMsgItemProps {
  isLocal: boolean;
  msg: ChatMsgItem;
  downloadFile: (url?: string) => Promise<void>;
  isImg: (type: string) => boolean;
}

function ChatMsgItemCmp({ isLocal, msg, downloadFile, isImg }: ChatMsgItemProps) {
  const liClass = isLocal ? styles.msg_item : styles.msg_item__remote;
  const flexEnd = isLocal ? {} : { justifyContent: 'flex-end' };
  const textAlignPos = isLocal ? 'left' : 'end';

  const LinkPreviewCmp = React.useMemo(() => {
    return msg.type === 'text' && msg.message ? (
      <LinkPreview text={msg.message}></LinkPreview>
    ) : (
      <></>
    );
  }, [msg.message]);

  return (
    <li className={liClass}>
      <div className={styles.msg_item_wrapper}>
        <div className={styles.msg_item_content} style={flexEnd}>
          <h4 className={styles.msg_item_content_name} style={{ textAlign: textAlignPos }}>
            {msg.sender.name || 'unknown'}
          </h4>
          {msg.type === 'text' ? (
            <div className={styles.msg_item_content_wrapper} style={flexEnd}>
              <p className={styles.msg_item_content_msg}>{msg.message}</p>
              {LinkPreviewCmp}
            </div>
          ) : (
            <Popover
              placement="right"
              style={{ background: '#1E1E1E' }}
              content={
                <Button shape="circle" type="text" onClick={() => downloadFile(msg?.file?.url)}>
                  <SvgResource type="download" svgSize={16} color="#22CCEE"></SvgResource>
                </Button>
              }
            >
              {msg.file && (
                <p className={styles.msg_item_content_msg}>
                  {isImg(msg.file.type) ? (
                    <Image src={msg.file.url} width={'70%'} fallback={pictureCallback}></Image>
                  ) : (
                    <div className={styles.msg_item_content_msg_file}>
                      <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                        <SvgResource type="file" color="#22CCEE" svgSize={42}></SvgResource>
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
  );
}
