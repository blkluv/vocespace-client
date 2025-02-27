import { AddDeviceInfo, default_device } from '@/lib/std/device';

export interface UserAddInfos {
  device: AddDeviceInfo;
}

/// This hook is used to store the user's choices into the local storage
export function use_stored_set(val: UserAddInfos) {
  localStorage.setItem('voce_space_user_infos', JSON.stringify(val));
}

/// This hook is used to get the user's choices from the local storage
export function use_stored_get(): UserAddInfos {
  const data = localStorage.getItem('voce_space_user_infos');
  if (data) {
    return JSON.parse(data);
  }
  return {
    device: default_device(),
  };
}
