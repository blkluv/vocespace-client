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

export type UserStatus = 'success' | 'processing' | 'default' | 'error' | 'warning';

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
