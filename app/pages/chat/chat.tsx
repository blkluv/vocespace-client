import * as React from 'react';
import { Chat, useChat, useLocalParticipant } from '@livekit/components-react';
import { Avatar, Button, Drawer, Input, Upload } from 'antd';
import type { GetProp, UploadProps } from 'antd';
import { SvgResource } from '@/app/resources/svg';
import styles from '@/styles/chat.module.scss';
import { useI18n } from '@/lib/i18n/i18n';
import { setting_drawer_header } from '@/app/devices/controls/bar';
import { ulid } from '@/lib/std';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface EnhancedChatProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

export function EnhancedChat({ open, setOpen, onClose }: EnhancedChatProps) {
  const { t } = useI18n();
  const ulRef = React.useRef<HTMLUListElement>(null);
  const { send, chatMessages } = useChat();
  const [value, setValue] = React.useState('');
  const [uploadFile, setUploadFile] = React.useState<FileType | null>(null);

  const handleBeforeUpload = (file: FileType) => {
    console.log('file', file);
    setUploadFile(file);
    return false; // 阻止自动上传
  };

  const scrollToBottom = () => {
    const el = ulRef.current;
    if (el) {
      console.log(chatMessages);
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendFile = async (file: FileType) => {
    // 使用socket发送文件, todo
  };

  const sendMsg = async () => {
    const msg = value.trim();
    if (!msg && !uploadFile) {
      return;
    } else if (msg && !uploadFile) {
      await send?.(value);
      setValue('');
    } else if (!msg && uploadFile) {
      await sendFile(uploadFile);
    } else if (msg && uploadFile) {
      await send?.(value);
      await sendFile(uploadFile);
      setValue('');
      setUploadFile(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };
  const { localParticipant } = useLocalParticipant();
  const isLocal = (identity?: string): boolean => {
    if (identity) {
      return localParticipant.identity === identity;
    } else {
      return false;
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
          {chatMessages.map((msg) =>
            isLocal(msg.from?.identity) ? (
              <li key={ulid()} className={styles.msg_item}>
                <div className={styles.msg_item_wrapper}>
                  <div className={styles.msg_item_content}>
                    <h4 className={styles.msg_item_content_name}>{msg.from?.name || 'unknown'}</h4>
                    <p className={styles.msg_item_content_msg}>{msg.message}</p>
                  </div>
                </div>
              </li>
            ) : (
              <li key={ulid()} className={styles.msg_item__remote}>
                <div className={styles.msg_item_wrapper}>
                  <div className={styles.msg_item_content}>
                    <h4 className={styles.msg_item_content_name} style={{ textAlign: 'end' }}>
                      {msg.from?.name || 'unknown'}
                    </h4>
                    <p className={styles.msg_item_content_msg} style={{ textAlign: 'end' }}>
                      {msg.message}
                    </p>
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
