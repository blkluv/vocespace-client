import { List } from 'antd';
import styles from '@/styles/room_list.module.scss';

export function RoomList({ data }: { data: string[] }) {
  return (
    <div className={styles.wrapper}>
      <List
        size="large"
        dataSource={data}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </div>
  );
}
