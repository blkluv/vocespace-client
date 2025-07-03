import { DrawerProps } from 'antd';

export function DrawerHeader({ title, icon }: { title: string, icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {icon}
      <span>{title}</span>
    </div>
  );
}

export const DEFAULT_DRAWER_PROP: DrawerProps = {
  style: { backgroundColor: '#111', padding: 0, margin: 0, color: '#fff' },
  placement: 'right',
  closable: false,
  width: '50%',
  styles: {
    body: {
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
  },
};
