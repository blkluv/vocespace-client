import { EgressClient } from 'livekit-server-sdk';

/**
 * Option<T>
 *
 * Option<T> is a type that represents an optional value.
 *
 * @file lib/std/index.ts
 * @description Optional for TypeScript Type Definitions
 */
export type Option<T> = {
  [P in keyof T]?: T[P];
};

export interface Size {
  height: string;
  width: string;
}

export interface SizeNum {
  height: number;
  width: number;
}

export interface UserItemProp {
  name: string;
  status: UserStatus;
}

export interface UserDefineStatus {
  creator: {
    name: string;
    id: string;
  };
  name: string;
  desc: string;
  icon: {
    key: string;
    color: string;
  };
  volume: number;
  blur: number;
  screenBlur: number;
}

// export type UserStatus = 'success' | 'processing' | 'default' | 'error' | 'warning';

export enum UserStatus {
  Online = 'online',
  Leisure = 'leisure',
  Busy = 'busy',
  Offline = 'offline',
}

export function is_web(): boolean {
  return typeof window !== 'undefined';
}

export function src(url: string): string {
  let prefix = process.env.NEXT_PUBLIC_BASE_PATH;
  if (!prefix || prefix === '' || prefix === '/') {
    return url;
  }
  return `${prefix}${url}`;
}

export function connect_endpoint(url: string): string {
  let prefix = process.env.NEXT_PUBLIC_BASE_PATH;
  if (!prefix || prefix === '' || prefix === '/') {
    return url;
  }
  return `${prefix}${url}`;
}

/// 生成随机4个字符
export function ulid(): string {
  const char = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += char[Math.floor(Math.random() * char.length)];
  }
  return res;
}

///生成唯一颜色
export const randomColor = (participantId: string): string => {
  // 使用参与者ID创建一个简单的哈希值
  let hash = 0;
  for (let i = 0; i < participantId.length; i++) {
    hash = participantId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 根据哈希值选择预定义的颜色
  const colors = [
    '#FF5733', // 红色
    '#d54941',
    '#ff9285',
    '#881f1c',
    '#33FF57', // 绿色
    '#2ba471',
    '#92dbb2',
    '#006c45',
    '#3357FF', // 蓝色
    '#0052d9',
    '#3663f4',
    '002a7c',
    '#F033FF', // 紫色
    '#8e56dd',
    '#c69cff',
    '#8e56dd',
    '#3b007b',
    '#FF33F0', // 粉色
    '#e851b3',
    '#ffaedc',
    '#800a5f',
    '#33FFF0', // 青色
    '#f5a623', // 橙色
    '#f5ba18',
    '#029cd4',
    '#00668e',
    '#85d3ff',
    '#e37318',
    '#fa9550',
    '#954500',
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
