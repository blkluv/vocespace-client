import { I18nProvider } from '@/lib/i18n/i18n';
import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { ConfigProvider } from 'antd';

export const metadata: Metadata = {
  title: {
    default: 'Voce Space | Self-hosted conference app',
    template: '%s',
  },
  description:
    'Voce space is WebRTC project that gives you everything needed to build scalable and real-time audio and/or video experiences in your applications.',
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/livekit-apple-touch.png',
        sizes: '180x180',
      },
      { rel: 'mask-icon', url: '/images/livekit-safari-pinned-tab.svg', color: '#070707' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#22CCEE',
          borderRadius: 4,
          colorText: '#8c8c8c',
        },
        components: {
          Dropdown: {
            colorBgElevated: '#1E1E1E',
            controlItemBgHover: "#333",
          },
          Radio: {
            buttonBg: '#1E1E1E',
            colorBorder: '#1E1E1E',
            buttonCheckedBg: '#1E1E1E',
          },
          Input: {
            colorBgBase: '#1E1E1E',
            activeBg: '#1E1E1E',
            colorBgContainer: '#1E1E1E',
            colorBorder: '#1E1E1E',
            colorTextPlaceholder: '#8c8c8c',
            paddingBlockLG: 8,
            colorText: '#ffffff',
          },
          Select: {
            selectorBg: '#1E1E1E',
            activeBorderColor: '#1E1E1E',
            activeOutlineColor: '#1E1E1E',
            colorTextPlaceholder: '#ffffff',
            colorText: '#ffffff',
            colorIcon: '#ffffff',
            colorIconHover: '#ffffff',
            hoverBorderColor: '#1E1E1E',
            optionSelectedBg: '#22CCEE',
            optionSelectedColor: '#fff',
            optionActiveBg: '#333',
            colorBgBase: '#1E1E1E',
            multipleItemBg: '#1E1E1E',
            colorBorder: '#1E1E1E',
            colorBgLayout: '#1E1E1E',
            colorBgElevated: '#1E1E1E',
          },
          Popover: {
            colorBgElevated: '#1E1E1E',
          },
          Modal : {
            contentBg: '#111111',
            headerBg: '#111111',
            footerBg: '#111111',
          }
        },
      }}
    >
      <html lang="en">
        <body>
          <I18nProvider initialLocale="en">{children}</I18nProvider>
        </body>
      </html>
    </ConfigProvider>
  );
}
