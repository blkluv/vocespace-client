import { SvgResource } from '@/app/resources/svg';
import { langOptions, useI18n } from '@/lib/i18n/i18n';
import { ConfigProvider, Select } from 'antd';

export function LangSelect() {
  const { locale, changeLocale } = useI18n();
  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            selectorBg: '#1E1E1E',
            activeBorderColor: '#1E1E1E',
            activeOutlineColor: '#1E1E1E',
            colorTextPlaceholder: '#ffffff',
            colorText: '#ffffff',
            colorIcon: '#ffffff',
            colorIconHover: '#ffffff',
            hoverBorderColor: '#1E1E1E',
            optionSelectedBg: '#333',
            optionSelectedColor: '#fff',
            optionActiveBg: '#1E1E1E',
            colorBgBase: '#1E1E1E',
            multipleItemBg: '#1E1E1E',
            colorBorder: '#1E1E1E',
            colorBgContainer: '#1E1E1E',
            colorBgLayout: '#1E1E1E',
            colorBgElevated: '#1E1E1E',
          },
        },
      }}
    >
      <Select
        prefix={
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '22px',
              width: '100%',
            }}
          >
            <SvgResource type="lang" svgSize={16} color="#ffffff"></SvgResource>
          </div>
        }
        value={locale}
        options={langOptions}
        onChange={(value) => {
          changeLocale(value);
        }}
      ></Select>
    </ConfigProvider>
  );
}
