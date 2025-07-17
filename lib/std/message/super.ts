import { Trans } from '@/lib/i18n/i18n';
import { MessageInstance } from 'antd/es/message/interface';

export interface MsgImpl {
  show(messageApi: MessageInstance, t: Trans): void;
}

class MsgInfo {
  static show(messageApi: MessageInstance, t: Trans): void {
    messageApi.info({
      content: t('msg.info'),
      duration: 2,
    });
  }
}

function s () {
    Date.now();
    MsgInfo.show
}