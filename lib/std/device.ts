import { Track } from 'livekit-client';

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
      blur: 6,
    },
    screen: {
      enabled: false,
      blur: 6,
    },
  };
};
