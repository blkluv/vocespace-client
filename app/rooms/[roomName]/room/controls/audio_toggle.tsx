import { Button, Dropdown, MenuProps } from 'antd';
import { SvgResource } from '../../pre_join/resources';
import { MediaDeviceKind, ToggleProps } from '@/lib/std/device';
import { useMediaDevices } from '@livekit/components-react';
import { useEffect, useState } from 'react';

export function AudioToggle({ enabled, onClicked, showText = true }: ToggleProps) {
  const on_clicked = () => {
    onClicked(enabled);
  };

  const devices = useMediaDevices({
    kind: MediaDeviceKind.AudioInput,
  });

  const [active_audio, set_active_audio] = useState('');
  const [items, set_items] = useState<MenuProps['items']>([]);

  const select_active = (active: string) => {
    console.log('select_active', active);
    set_active_audio(active);
  };

  useEffect(() => {
    if (devices && devices.length > 0) {
      const validDevices = devices.filter((device) => device.deviceId !== '');
      if (validDevices.length > 0) {
        set_items(
          validDevices.map((device) => ({
            label: <div onClick={() => select_active(device.label)}>{device.label}</div>,
            key: device.deviceId,
          })),
        );

        // 如果没有选中的设备，设置第一个为默认
        if (!active_audio) {
          set_active_audio(validDevices[0].label);
        }
      }
    }
  }, [devices]);

  return (
    <div>
      {showText ? (
        <div
          style={{
            backgroundColor: '#1E1E1E',
            height: '44px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            style={{ paddingRight: 0, height: '16px' }}
            size="large"
            onClick={on_clicked}
          >
            {enabled ? (
              <SvgResource type="audio" svgSize={16}></SvgResource>
            ) : (
              <SvgResource type="audio_close" svgSize={16}></SvgResource>
            )}
          </Button>
          <Dropdown menu={{ items }} trigger={['hover']}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#fff',
                cursor: 'pointer',
                height: '44px',
                gap: '6px',
                padding: '0 12px',
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px',
                }}
              >
                Microphone
              </div>
              <SvgResource type="down" svgSize={16}></SvgResource>
            </span>
          </Dropdown>
        </div>
      ) : (
        <Button shape="circle" variant="solid" color="default" size="large" onClick={on_clicked}>
          {enabled ? (
            <SvgResource type="audio" svgSize={16}></SvgResource>
          ) : (
            <SvgResource type="audio_close" svgSize={16}></SvgResource>
          )}
        </Button>
      )}
    </div>
  );
}
