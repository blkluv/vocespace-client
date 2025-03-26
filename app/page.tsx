'use client';

import React, { Suspense } from 'react';
import styles from '@/styles/Home.module.css';
import { useI18n } from '@/lib/i18n/i18n';
import { DemoMeetingTab } from './pages/pre_join/demo';
import { src } from '@/lib/std';

export default function Page() {
  const { t } = useI18n();

  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img
            src={src("/images/vocespace.svg")}
            alt="VoceSpace"
            width="360"
            height="45"
            style={{ marginBottom: '12px' }}
          />
          <h2>{t('msg.info.title')}</h2>
        </div>
        <Suspense fallback="Loading">
          {/* <Tabs>
            <DemoMeetingTab label={t('common.demo')} />
            <CustomConnectionTab label={t('common.custom')} />
          </Tabs> */}
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

// function Tabs(props: React.PropsWithChildren<{}>) {
//   const searchParams = useSearchParams();
//   const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : 0;

//   const router = useRouter();
//   function onTabSelected(index: number) {
//     const tab = index === 1 ? 'custom' : 'demo';
//     router.push(`/?tab=${tab}`);
//   }

//   let tabs = React.Children.map(props.children, (child, index) => {
//     return (
//       <button
//         className="lk-button"
//         onClick={() => {
//           if (onTabSelected) {
//             onTabSelected(index);
//           }
//         }}
//         aria-pressed={tabIndex === index}
//       >
//         {/* @ts-ignore */}
//         {child?.props.label}
//       </button>
//     );
//   });

//   return (
//     <div className={styles.tabContainer}>
//       <div className={styles.tabSelect}>{tabs}</div>
//       {/* @ts-ignore */}
//       {props.children[tabIndex]}
//     </div>
//   );
// }
