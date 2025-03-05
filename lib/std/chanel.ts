//! # use rxjs to do pub/sub pattern
//! when we using a control component like audio_toggle, the component should publish the state change to the receive component
//! the receive component should subscribe to the state change and update some other things.

import { Subject } from 'rxjs';

export enum SubjectKey{
    Audio = 'audio',
    Video = 'video',
    Screen = 'screen',
} 

// 创建一个用于发布事件的函数并返回一个主题
export function publisher<T>(data: T): Subject<T> {
  let subject = new Subject<T>();
  subject.next(data);
  return subject;
}

// 导出用于订阅事件的函数
export function subscriber<T>(subject: Subject<T>, callback: (data: any) => void) {
  return subject.subscribe(callback);
}


// 用于存储主题的集合, 所有的主题都应该在这里注册并在需要的时候订阅
export const subject_map = new Map<SubjectKey, Subject<any>>();