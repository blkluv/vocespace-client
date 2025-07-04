import { useI18n } from '@/lib/i18n/i18n';
import { FlagOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, List } from 'antd';
import styles from '@/styles/apps.module.scss';

export interface TimeRecordsProps {
  data: string[];
  clear: () => void;
}

export function TimeRecords({ data, clear }: TimeRecordsProps) {
  const { t } = useI18n();
  return (
    <List
      split={false}
      header={
        <div className={styles.flex_header}>
          <div className={styles.flex_header_title}>
            <FlagOutlined />
            <span>{t('more.app.timer.records.title')}</span>
          </div>
          <Button icon={<ReloadOutlined />} onClick={clear} type='text'></Button>
        </div>
      }
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <strong className={styles.record_item}>{item}</strong>
        </List.Item>
      )}
    ></List>
  );
}
