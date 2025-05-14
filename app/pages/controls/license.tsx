import { useI18n } from '@/lib/i18n/i18n';
import styles from '@/styles/controls.module.scss';
import { Button, Card } from 'antd';

export function LicenseControl() {
  const { t } = useI18n();

  const userLicense = {
    signed: true,
    demains: ['vocespace.com'],
    limit: Limit.Guest,
    createdAt: '2023-10-01T00:00:00Z',
    expiresAt: '2024-10-01T00:00:00Z',
    value: '2C2VtyQjq7gX6SхTrJmPvqrmCJXdCb2SbQEP3LtfSf4Jg6MaDLbY3uqgm6dUvzhpm',
  };

  return (
    <div>
      <div className={styles.setting_box}>
        <h3>{t('settings.license.title')}</h3>
      </div>
      <div className={styles.license_wrapper}>
        <div>
          <div className={styles.license_wrapper_title}>Signed</div>
          <div className={styles.license_wrapper_content}>{userLicense.signed ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div className={styles.license_wrapper_title}>Domains</div>
          <div className={styles.license_wrapper_content}>{userLicense.demains.join(', ')}</div>
        </div>
        <div>
          <div className={styles.license_wrapper_title}>Limit</div>
          <div className={styles.license_wrapper_content}>{userLicense.limit}</div>
        </div>
        <div>
          <div className={styles.license_wrapper_title}>Created At</div>
          <div className={styles.license_wrapper_content}>{userLicense.createdAt}</div>
        </div>
        <div>
          <div className={styles.license_wrapper_title}>Expires At</div>
          <div className={styles.license_wrapper_content}>{userLicense.expiresAt}</div>
        </div>
        <div>
          <div className={styles.license_wrapper_title}>Value</div>
          <div className={styles.license_wrapper_content}>{userLicense.value}</div>
        </div>
      </div>
      <div className={styles.setting_box} style={{gap: '8px', display: "flex"}}>
        <Button type="primary">Renew License</Button>
        <Button type="default">Update Manually</Button>
      </div>
    </div>
  );
}

enum Limit {
  No = 'No',
  Admin = 'Admin',
  Guest = 'Guest',
}
