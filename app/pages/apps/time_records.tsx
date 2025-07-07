import { List } from 'antd';
import styles from '@/styles/apps.module.scss';

export interface TimeRecordsProps {
  data: string[];
  clear: () => void;
}

export function TimeRecords({ data, clear }: TimeRecordsProps) {
  return (
    <List
      split={false}
      locale={{
        emptyText: <></>,
      }}
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <strong className={styles.record_item}>{item}</strong>
        </List.Item>
      )}
    ></List>
  );
}
