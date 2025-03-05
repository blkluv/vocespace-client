import { Chat } from '@livekit/components-react';
import { Tabs, TabsProps } from 'antd';

export function Tools() {
  const tools: TabsProps['items'] = [
    {
      key: '1',
      label: 'Chat',
      children: <Chat style={{
        height: '280px',
        width: '100%',
      }} ></Chat>,
    },
    {
      key: '2',
      label: 'Files',
      children: 'Content of Tab Pane 1',
    },
    {
      key: '3',
      label: 'Notes',
      children: 'Content of Tab Pane 1',
    },
  ];

  const change_tabs = (key: string) => {
    console.log('change_tabs:', key);
  };

  return (
    <Tabs
        style={{height: 'fit-content'}}
        defaultActiveKey="1"
        items={tools}
        onChange={change_tabs}
        tabBarGutter={20}
        tabBarStyle={{
            padding: '0 12px',
        }}
      />
  );
}
