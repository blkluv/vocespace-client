import { Avatar, Badge, List } from 'antd';
import styles from '@/styles/user_list.module.scss';
import { UserItemProp } from '@/lib/std';

export function UserList({ data }: { data: UserItemProp[] }) {
  return (
    <List
      size="large"
      style={{
        height: '100%',
      }}
      pagination={{
        onChange: (page) => {
          console.log(page);
        },
        pageSize: 3,
        position: 'bottom',
        align: 'center',
        simple: true,
        style: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          marginBottom: '8px',
        },
      }}
      dataSource={data}
      renderItem={(item) => (
        <List.Item style={{ padding: '0px' }}>
          <UserItem item={item}></UserItem>
        </List.Item>
      )}
    ></List>
  );
}

export function UserItem({ item }: { item: UserItemProp }) {
  return (
    <div className={styles.wrapper}>
      <Badge dot status={item.status} offset={[-4, 36]}>
        <Avatar
          style={{ backgroundColor: '#22CCEE', verticalAlign: 'middle' }}
          size="large"
          gap={1}
        >
          {item.name}
        </Avatar>
      </Badge>
      <div className={styles.wrapper_info}>
        <strong>{item.name}</strong>
        <div>{item.status}</div>
      </div>
    </div>
  );
}

