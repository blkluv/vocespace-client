import { SvgResource } from '@/app/resources/svg';
import { Button, Modal } from 'antd';
import styles from '@/styles/apps.module.scss';

export interface AppModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setNotionOpen: (open: boolean) => void;
}

export function AppModal({ open, setOpen, setNotionOpen }: AppModalProps) {
  return (
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="App">
      <button className={styles.app_block} onClick={() => {
        setNotionOpen(true);
        setOpen(false);
      }}>
        <div className={styles.app_block_icon}>
          <SvgResource type="notion" svgSize={32}></SvgResource>
        </div>
        <div className={styles.app_block_name}>Notion</div>
      </button>
    </Modal>
  );
}
