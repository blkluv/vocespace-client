'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useImperativeHandle, useRef, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '../styles/home_page.module.scss';
import { Button, Card, Checkbox, CheckboxProps, Input, Tabs, TabsProps } from 'antd';
import TextArea from 'antd/es/input/TextArea';

/// Main page component --------------------------------------------------------------------------------
export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <PageHeader></PageHeader>
        <PageMain></PageMain>
      </main>
      <PageFooter />
    </>
  );
}

/// page main component for the page -----------------------------------------------------------------
function PageMain() {
  const items: TabsProps['items'] = [
    {
      key: 'demo',
      label: 'Demo',
      children: <DemoMeetingTab />,
    },
    {
      key: 'custom',
      label: 'Custom',
      children: <CustomConnectionTab />,
    },
  ];

  return (
    <main className={styles.vs_main}>
      <Suspense fallback="Loading">
        <div className={styles['vs_main_tabs']}>
          <Tabs
            defaultActiveKey="demo"
            items={items}
            centered
            size="large"
            tabBarGutter={100}
            indicator={{ size: (origin) => origin + 60 }}
          ></Tabs>
        </div>
      </Suspense>
    </main>
  );
}

/// DemoMeetingTab component for the page -----------------------------------------------------------------
function DemoMeetingTab() {
  const e2eebox_ref = useRef<{ start_meeting: () => void }>(null);

  const route = `/rooms/${generateRoomId()}`;

  const start_meeting = () => {
    if (!e2eebox_ref.current) return;
    e2eebox_ref.current.start_meeting();
  };

  return (
    <div className={styles.common_tab}>
      <p>Try Voce Space for free with our live demo project.</p>
      <Button
        onClick={start_meeting}
        type="primary"
        size="large"
        style={{ fontSize: '16px', margin: 'auto' }}
      >
        Start Meeting
      </Button>
      <footer className={styles['common_tab_footer']}>
        <EnableE2eeBox ref={e2eebox_ref} basic_route={route} e2ee_route={route} />
      </footer>
    </div>
  );
}

interface E2eeBoxProps {
  basic_route: string;
  e2ee_route: string;
}

const EnableE2eeBox = React.forwardRef((props: E2eeBoxProps, ref) => {
  const router = useRouter();

  const [passphrase, set_passphrase] = useState(randomString(64));
  const [e2ee, setE2ee] = useState(false);

  const set_e2ee: CheckboxProps['onChange'] = (e) => {
    setE2ee(e.target.checked);
  };

  const start_meeting = (): void => {
    if (e2ee) {
      router.push(`${props.e2ee_route}#${encodePassphrase(passphrase)}`);
    } else {
      router.push(props.basic_route);
    }
  };

  React.useImperativeHandle(ref, () => ({
    start_meeting,
  }));

  return (
    <div>
      <Checkbox onChange={set_e2ee}>Enable end-to-end encryption</Checkbox>
      {e2ee && (
        <div className={styles['common_tab_footer_passphrase']}>
          <label>Passphrase</label>
          <Input.Password
            placeholder="input passphrase"
            style={{ color: '#000' }}
            value={passphrase}
            onChange={(e) => set_passphrase(e.target.value)}
          />
          <Button type="primary" onClick={start_meeting}>
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
});

/// CustomConnectionTab component for the page -----------------------------------------------------------------
function CustomConnectionTab() {
  const e2eebox_ref = useRef<{ start_meeting: () => void }>(null);
  const [server_url, set_server_url] = useState('');
  const [token, set_token] = useState('');
  const route = `/custom/?liveKitUrl=${server_url}&token=${token}`;
  const basic_input_style = {
    input: {
      color: '#000',
    },
  };
  return (
    <div className={styles.common_tab}>
      <p>
        Connect Voce Space Meet with a custom server using Voce Space Cloud or Voce Space Server.
      </p>
      <div className={styles['common_tab_con_form']}>
        <Input
          addonBefore="Server URL"
          placeholder="Voce Space Server URL: wss://*.livekit.cloud"
          styles={basic_input_style}
          value={server_url}
          onChange={(e) => set_server_url(e.target.value)}
        ></Input>
        <TextArea
          rows={6}
          placeholder="Token"
          style={basic_input_style.input}
          value={token}
          onChange={(e) => set_token(e.target.value)}
        ></TextArea>
      </div>
      <Button type="primary" size="large" onClick={() => e2eebox_ref.current?.start_meeting()} style={{ fontSize: '16px', margin: 'auto' }}>
        Submit
      </Button>
      <footer>
        <EnableE2eeBox ref={e2eebox_ref} basic_route={route} e2ee_route={route} />
      </footer>
    </div>
  );
}

/// page footer component for the page -----------------------------------------------------------------
function PageFooter() {
  /// connect email for more information
  const connect_email: { url: string; href: string } = {
    url: 'han@privoce.com',
    href: 'mailto:han@privoce.com',
  };

  return (
    <footer data-lk-theme="default">
      Contact{' '}
      <a href={connect_email.href} className="basic_link">
        {connect_email.url}
      </a>{' '}
      to learn more.
    </footer>
  );
}

/// page header component for the page -----------------------------------------------------------------
function PageHeader() {
  return (
    <header className="header">
      <img src="/images/vocespace.svg" alt="Voce Space Meet" width="360" height="45" />
      <h2>Self-hosted open source video conferencing app built on Voce Space, By Privoce</h2>
    </header>
  );
}
