'use client';

import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import { useI18n } from '@/lib/i18n/i18n';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '@/styles/Home.module.css';
import { Input, Radio } from 'antd';
import { CheckboxGroupProps } from 'antd/es/checkbox';

/**
 * # DemoMeetingTab
 * Demo meeting tab for room, which use before PreJoin
 * ## Features
 * - Start meeting and nav to PreJoin page
 * - Enable E2EE (input passphrase)
 * @param props
 * @returns
 */
export function DemoMeetingTab(props: { label: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const options: CheckboxGroupProps<string>['options'] = [
    { label: t('common.demo'), value: 'demo' },
    { label: t('common.custom'), value: 'custom' },
  ];
  const [optionVal, setOptionVal] = useState('demo');
  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      if (roomUrl == '') {
        router.push(`/rooms/${generateRoomId()}`);
      } else {
        router.push(`/rooms/${roomUrl}`);
      }
    }
  };
  return (
    <div className={styles.tabContent}>
      <Radio.Group
        block
        options={options}
        defaultValue="demo"
        optionType="button"
        buttonStyle="solid"
        size="large"
        value={optionVal}
        onChange={(e) => {
          setRoomUrl('');
          setOptionVal(e.target.value);
        }}
      />
      <p style={{ margin: 0 }}>
        {optionVal == 'demo' ? t('msg.info.try_free') : t('msg.info.try_enter_room')}
      </p>
      {optionVal == 'custom' && (
        <input
          className="lk-form-control"
          type="text"
          placeholder={t('msg.info.enter_room')}
          value={roomUrl}
          onChange={(e) => {
            setRoomUrl(e.target.value);
          }}
        />
      )}
      <button className="lk-button" onClick={startMeeting}>
        {t('common.start_metting')}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">{t('msg.info.enabled_e2ee')}</label>
        </div>
        {e2ee && (
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'row',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <label htmlFor="passphrase" style={{ textWrap: 'nowrap' }}>
              {' '}
              {t('common.passphrase')}
            </label>
            <Input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
