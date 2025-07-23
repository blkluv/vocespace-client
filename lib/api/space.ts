import { connect_endpoint, UserDefineStatus } from '../std';

/**
 * 加入空间
 * @param spaceName 空间名称
 * @param username 用户名
 * @param region 可选的区域
 */
export const joinSpace = async (spaceName: string, username: string, region?: string) => {
  const url = new URL(connect_endpoint('/api/connection-details'), window.location.origin);
  url.searchParams.append('spaceName', spaceName);
  url.searchParams.append('participantName', username);
  if (region) {
    url.searchParams.append('region', region);
  }
  return await fetch(url.toString());
};

/**
 * 获取所有空间的信息
 */
export const allSpaceInfos = async () => {
  const url = new URL(connect_endpoint('/api/space'), window.location.origin);
  url.searchParams.append('all', 'true');
  url.searchParams.append('detail', 'true');
  return await fetch(url.toString());
};

/**
 * 获取历史空间信息
 */
export const historySpaceInfos = async () => {
  const url = new URL(connect_endpoint('/api/space'), window.location.origin);
  url.searchParams.append('timeRecord', 'true');
  return await fetch(url.toString());
};
/**
 *  向服务器请求一个唯一的用户名
 */
export const getUniqueUsername = async (spaceName: string) => {
  const url = new URL(connect_endpoint('/api/space'), window.location.origin);
  url.searchParams.append('spaceName', spaceName);
  url.searchParams.append('pre', 'true');
  return await fetch(url.toString());
};

export interface CheckNameBody {
  spaceName: string;
  participantName: string;
}

/**
 * 检查用户名是否可用
 * @param spaceName 空间名称
 * @param participantName 用户名称
 */
export const checkUsername = async (spaceName: string, participantName: string) => {
  const url = new URL(connect_endpoint('/api/space'), window.location.origin);
  url.searchParams.append('nameCheck', 'true');
  return await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spaceName,
      participantName,
    } as CheckNameBody),
  });
};

export interface DefineUserStatusBody {
  spaceName: string;
  status: UserDefineStatus;
}

export const defineUserStatus = async (spaceName: string, status: UserDefineStatus) => {
  const url = new URL(connect_endpoint('/api/space'), window.location.origin);
  url.searchParams.append('status', 'true');
  return await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceName,
      status,
    } as DefineUserStatusBody),
  });
};
