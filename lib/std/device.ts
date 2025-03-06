import { Track } from 'livekit-client';
import { SizeNum } from '.';

export interface Device {
  value: string;
  label: string;
}

export interface LiveKitDevice {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
  groupId: string;
}

export enum MediaDeviceKind {
  AudioInput = 'audioinput',
  AudioOutput = 'audiooutput',
  VideoInput = 'videoinput',
}

export interface AddDeviceInfo {
  microphone: {
    enabled: boolean;
    self: number;
    other: number;
  };
  video: {
    enabled: boolean;
    blur: number;
  };
  screen: {
    enabled: boolean;
    blur: number;
  };
}

export const default_device = (): AddDeviceInfo => {
  return {
    microphone: {
      enabled: false,
      self: 100,
      other: 20,
    },
    video: {
      enabled: false,
      blur: 0.15,
    },
    screen: {
      enabled: false,
      blur: 0.15,
    },
  };
};

export interface ToggleProps {
  enabled: boolean;
  onClicked: (enabled: boolean) => void;
}

/// 计算视频模糊度
/// video_blur是视频模糊度, size是视频大小, 需要根据size来计算相对模糊度
/// 对于传入的video_blur的范围是0.0 ~ 1.0, 0.0表示不模糊, 1.0表示最大模糊
/// 返回最长边的模糊度(px)
export function count_video_blur(video_blur: number, size: SizeNum): number {
  const { height, width } = size;
  const h_blur = (height / 10.0) * video_blur;
  const w_blur = (width / 10.0) * video_blur;
  return Math.max(h_blur, w_blur);
}
