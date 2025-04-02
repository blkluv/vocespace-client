import { Select } from 'antd';
import { MediaDeviceKind } from '@/lib/std/device';
import { useMediaDevices } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { SelectPrefix } from './select_prefix';

export function VideoSelect({ className }: { className?: string }) {
  const devices = useMediaDevices({
    kind: MediaDeviceKind.VideoInput,
  });

  const [active_video, set_active_video] = useState('');
  const [items, set_items] = useState<{ label: string; value: string }[]>([]);

  const select_active = (active: string) => {
    set_active_video(active);
  };

  useEffect(() => {
    if (devices && devices.length > 0) {
      const validDevices = devices.filter((device) => device.deviceId !== '');
      if (validDevices.length > 0) {
        set_items(
          validDevices.map((device) => ({
            label: device.label,
            value: device.deviceId,
          })),
        );

        // 如果没有选中的设备，设置第一个为默认
        if (!active_video) {
          set_active_video(validDevices[0].label);
        }
      }
    }
  }, [devices]);

  return (
    <Select
      size="large"
      prefix={<SelectPrefix type="video" color="#22CCEE" svgSize={16}></SelectPrefix>}
      className={className}
      defaultValue={active_video}
      options={items}
      value={active_video}
      onChange={select_active}
      style={{ width: '100%' }}
    ></Select>
  );
}
