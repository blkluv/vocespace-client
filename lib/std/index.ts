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

// export type UserStatus = 'success' | 'processing' | 'default' | 'error' | 'warning';

export enum UserStatus {
  Online = 'online',
  Idot = 'offline',
  Busy = 'busy',
  Invisible = 'away',
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
    '#33FF57', // 绿色
    '#3357FF', // 蓝色
    '#F033FF', // 紫色
    '#FF33F0', // 粉色
    '#33FFF0', // 青色
    '#F0FF33', // 黄色
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
