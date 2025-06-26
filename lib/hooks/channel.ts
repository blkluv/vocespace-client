import { connect_endpoint } from '../std';
import { ChildRoom } from '../std/room';

const CONNECT_ENDPOINT = connect_endpoint('/api/room-settings');

/**
 *  Create a new room with the given parameters.
 *  @param hostRoom - The space (host room) where the new room will be created.
 *  @param roomName - The name of the new room.
 *  @param ownerId - The ID of the user who will own the room.
 *  @param isPrivate - Whether the room is private or not.
 */
export interface CreateRoomParam {
  hostRoom: string;
  roomName: string;
  ownerId: string;
  isPrivate: boolean;
}

export const createRoom = async ({ hostRoom, roomName, ownerId, isPrivate }: CreateRoomParam) => {
  const url = new URL(CONNECT_ENDPOINT, window.location.origin);
  url.searchParams.append('childRoom', 'true');

  return await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: hostRoom,
      childRoomName: roomName,
      participantId: ownerId,
      isPrivate,
    }),
  });
};

export interface DeleteRoomParam {
  roomName: string;
  selectedRoomName: string;
}

export const deleteRoom = async ({ roomName, selectedRoomName }: DeleteRoomParam) => {
  const url = new URL(CONNECT_ENDPOINT, window.location.origin);
  url.searchParams.append('roomId', roomName);
  url.searchParams.append('childRoom', selectedRoomName);
  return await fetch(url.toString(), {
    method: 'DELETE',
  });
};
