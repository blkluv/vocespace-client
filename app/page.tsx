'use client';

import React, { Suspense } from 'react';
import styles from '@/styles/Home.module.css';
import { useI18n } from '@/lib/i18n/i18n';
import { DemoMeetingTab } from './pages/pre_join/demo';
import { src } from '@/lib/std';
import { LangSelect } from './devices/controls/lang_select';

export default function Page() {
  const { t } = useI18n();

  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <span className={styles.lang_select}>
          <LangSelect></LangSelect>
        </span>
        <div className="header">
          <img
            src={src('/images/vocespace.svg')}
            alt="VoceSpace"
            width="360"
            height="45"
            style={{ marginBottom: '12px' }}
          />
          <h2>{t('msg.info.title')}</h2>
        </div>
        <Suspense fallback="Loading">
          <DemoMeetingTab label={t('common.demo')} />
        </Suspense>
      </main>
      <footer data-lk-theme="default">
        {t('msg.info.contact')}
        <a
          href="mailto:han@privoce.com"
          style={{ color: '#22CCEE', textDecorationLine: 'none', margin: '0 4px' }}
        >
          han@privoce.com
        </a>
        {t('msg.info.learn_more')}
      </footer>
    </>
  );
}
