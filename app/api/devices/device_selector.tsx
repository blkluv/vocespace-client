import { Device, MediaDeviceKind } from '@/lib/std/device';
import { useMaybeRoomContext, useMediaDeviceSelect } from '@livekit/components-react';
import { LocalAudioTrack, LocalVideoTrack, RoomEvent } from 'livekit-client';
import { forwardRef, useCallback, useImperativeHandle, useState, useEffect } from 'react';
import { Select } from 'antd';

export const DevicesSelector = forwardRef(
  ({ enabled, track, kind, err, requestPermissions = true }: DeviceSelectorProps, ref) => {
    const room = useMaybeRoomContext();
    const [needPermissions, setNeedPermissions] = useState(requestPermissions);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [activeDevice, setActiveDevice] = useState<string>('');

    const handleError = useCallback(
      (e: Error) => {
        if (room) {
          room.emit(RoomEvent.MediaDevicesError, e);
        }
        err?.(e);
      },
      [room, err],
    );

    // 初始化设备权限
    useEffect(() => {
      if (enabled) {
        navigator.mediaDevices
          .getUserMedia({
            audio: kind === MediaDeviceKind.AudioInput,
            video: kind === MediaDeviceKind.VideoInput,
          })
          .then(() => {
            setNeedPermissions(true);
          })
          .catch(handleError);
      }
    }, [enabled, kind]);

    const { devices, setActiveMediaDevice } = useMediaDeviceSelect({
      kind,
      room,
      track,
      requestPermissions: needPermissions,
      onError: handleError,
    });

    // 监听设备变化
    useEffect(() => {
      if (devices && devices.length > 0) {
        const validDevices = devices.filter((device) => device.deviceId !== '');
        if (validDevices.length > 0) {
          const deviceOptions = validDevices.map((device) => ({
            label: device.label,
            value: device.deviceId,
          }));
          setDeviceList(deviceOptions);

          // 如果没有选中的设备，设置第一个为默认
          if (!activeDevice && deviceOptions[0]) {
            setActiveDevice(deviceOptions[0].value);
          }
        }
      }
    }, [devices]);

    // 处理设备切换
    const handleDeviceChange = async (deviceId: string) => {
      try {
        await setActiveMediaDevice(deviceId, { exact: false });
        setActiveDevice(deviceId);
      } catch (e) {
        handleError(e as Error);
      }
    };

    useImperativeHandle(ref, () => ({
      active_device: activeDevice,
    }));

    return (
      <Select
        defaultValue={activeDevice}
        style={{ width: '100%', marginTop: '12px', color: '#000' }}
        onChange={handleDeviceChange}
        options={deviceList}
        value={activeDevice}
        loading={deviceList.length === 0}
      />
    );
  },
);

export interface DeviceSelectorProps {
  enabled: boolean;
  track?: LocalAudioTrack | LocalVideoTrack;
  kind: MediaDeviceKind;
  err?: (e: Error) => void;
  requestPermissions?: boolean;
}
