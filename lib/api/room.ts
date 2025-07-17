import { connect_endpoint } from '../std';

export const joinSpace = async (spaceName: string, username: string, region?: string) => {
  const url = new URL(connect_endpoint('/api/connection-details'), window.location.origin);
  url.searchParams.append('spaceName', spaceName);
  url.searchParams.append('participantName', username);
  if (region) {
    url.searchParams.append('region', region);
  }
  return await fetch(url.toString());
};

export const allRoomInfos = async () => {
  const url = new URL(connect_endpoint('/api/room-settings'), window.location.origin);
  url.searchParams.append('all', 'true');
  url.searchParams.append('detail', 'true');
  return await fetch(url.toString());
};

export const historyRoomInfos = async () => {
  const url = new URL(connect_endpoint('/api/room-settings'), window.location.origin);
  url.searchParams.append('time_record', 'true');
  return await fetch(url.toString());
};
