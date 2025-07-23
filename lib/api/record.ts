import { connect_endpoint } from '../std';

export interface sendRecordRequestBody{
  spaceName: string;
  type: 'start' | 'stop';
  egressId?: string;
}

export const sendRecordRequest = (data: sendRecordRequestBody): Promise<Response> => {
  const url = new URL(connect_endpoint('/api/record'), window.location.origin);
  return fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};
