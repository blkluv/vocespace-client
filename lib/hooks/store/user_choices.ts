import { AddDeviceInfo, default_device } from '@/lib/std/device';

export type UserAddInfos = Map<string, UserAddInfo>;

export interface UserAddInfo {
  device: AddDeviceInfo;
}

/// This hook is used to store the user's choices into the local storage
export function use_stored_set(key: string, val: UserAddInfo) {
  // get localstorage and try convert to UserAddInfos then do insert
  let user_infos_json = localStorage.getItem('voce_space_user_infos');
  let user_infos = new Map<string, UserAddInfo>();
  if (user_infos_json) {
    user_infos = JSON.parse(user_infos_json);
  }
  user_infos.set(key, val);
  // set back to localstorage
  localStorage.setItem('voce_space_user_infos', JSON.stringify(user_infos));
}

/// This hook is used to get the user's choices from the local storage
export function use_stored_get(): UserAddInfos | undefined {
  const data = localStorage.getItem('voce_space_user_infos');
  if (data) {
    return JSON.parse(data);
  } else {
    return undefined;
  }
}

export function use_add_user_device(username: string): AddDeviceInfo {
  const user_infos = use_stored_get();
  let device_settings = default_device();
  if (user_infos && username !== '') {
    device_settings = user_infos.get(username)?.device || default_device();
  }
  return device_settings;
}
