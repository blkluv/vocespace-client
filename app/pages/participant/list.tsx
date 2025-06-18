import { ParticipantSettings } from '@/lib/hooks/room_settings';
import { Avatar, List } from 'antd';
import styles from '@/styles/controls.module.scss';
import { randomColor } from '@/lib/std';
import { useI18n } from '@/lib/i18n/i18n';

export type ParticipantItemType = [string, ParticipantSettings];

export interface ParticipantListProps {
  participants: ParticipantItemType[];
  ownerId: string;
  suffix?: (item: ParticipantItemType, index: number) => React.ReactNode;
}

export function ParticipantList({ participants, ownerId, suffix }: ParticipantListProps) {
  const { t } = useI18n();
  return (
    <List
      itemLayout="horizontal"
      dataSource={participants}
      split={false}
      renderItem={(item, index) => (
        <List.Item>
          <div className={styles.particepant_item}>
            <div className={styles.particepant_item_left}>
              <Avatar
                style={{
                  backgroundColor: randomColor(item[1].name),
                }}
              >
                {item[1].name.substring(0, 3)}
              </Avatar>
              <span>{item[1].name}</span>
              {ownerId !== '' && item[0] === ownerId && (
                <span className={styles.particepant_item_owner}>
                  ( {t('more.participant.manager')} )
                </span>
              )}
            </div>
            {suffix && suffix(item, index)}
          </div>
        </List.Item>
      )}
    />
  );
}
