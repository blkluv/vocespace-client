//! # use rxjs to do pub/sub pattern
//! when we using a control component like audio_toggle, the component should publish the state change to the receive component
//! the receive component should subscribe to the state change and update some other things.

import { BehaviorSubject } from 'rxjs';

export enum SubjectKey {
  Audio = 'audio',
  Video = 'video',
  Screen = 'screen',
}

// 初始化所有主题
export const subject_map = new Map<SubjectKey, BehaviorSubject<any>>([
  [SubjectKey.Audio, new BehaviorSubject<boolean>(true)],
  [SubjectKey.Video, new BehaviorSubject<boolean>(true)],
  [SubjectKey.Screen, new BehaviorSubject<boolean>(false)],
]);

// 发布事件
export function publisher<T>(key: SubjectKey, data: T): void {
  const subject = subject_map.get(key);
  if (subject) {
    subject.next(data);
  }
}

// 订阅事件
export function subscriber<T>(key: SubjectKey, callback: (data: T) => void) {
  const subject = subject_map.get(key);
  if (subject) {
    return subject.subscribe(callback);
  }
  return undefined;
}