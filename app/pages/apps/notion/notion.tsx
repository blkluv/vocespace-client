import { Drawer } from 'antd';
import { useState, useEffect } from 'react';
import { setting_drawer_header } from '../../controls/bar';
import { SvgResource } from '@/app/resources/svg';
import { DEFAULT_DRAWER_PROP, DrawerHeader } from '../../controls/drawer_tools';
import { NotionAPI } from 'notion-client';
import { NotionRenderer } from 'react-notion-x';
import { type ExtendedRecordMap } from 'notion-types';
import { getPageTitle } from 'notion-utils';

// 创建一个客户端版本的 NotionPage 组件
function NotionPageClient({
  recordMap,
  rootPageId,
}: {
  recordMap: ExtendedRecordMap | null;
  rootPageId?: string;
}) {
  if (!recordMap) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const title = getPageTitle(recordMap);

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false} // 在 Drawer 中建议设为 false
        darkMode={false}
        rootPageId={rootPageId}
      />
    </div>
  );
}

export interface NotionAppDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function NotionAppDrawer({ open, setOpen }: NotionAppDrawerProps) {
  const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当 Drawer 打开时获取 Notion 数据
  useEffect(() => {
    if (open && !recordMap) {
      fetchNotionPage();
    }
  }, [open]);

  const fetchNotionPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pageId = 'test_notion-2241a9cda70e8000b07cef0062301cc1';
      const notion = new NotionAPI();
      const data = await notion.getPage(pageId);
      setRecordMap(data);
    } catch (err) {
      console.error('Failed to fetch Notion page:', err);
      setError('Failed to load Notion page');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' 
        }}>
          <div>Loading Notion page...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          gap: '16px'
        }}>
          <div style={{ color: 'red' }}>{error}</div>
          <button onClick={fetchNotionPage}>Retry</button>
        </div>
      );
    }

    return (
      <NotionPageClient 
        recordMap={recordMap} 
        rootPageId="test_notion-2241a9cda70e8000b07cef0062301cc1" 
      />
    );
  };

  return (
    <Drawer
      {...DEFAULT_DRAWER_PROP}
      width={'80%'} // 增加宽度以更好地显示 Notion 内容
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      title={<DrawerHeader title="Notion" />}
      extra={setting_drawer_header({
        on_clicked: () => {
          setOpen(false);
        },
      })}
      styles={{
        body: {
          padding: 0, // 移除默认 padding
          height: '100%',
        },
      }}
    >
      {renderContent()}
    </Drawer>
  );
}