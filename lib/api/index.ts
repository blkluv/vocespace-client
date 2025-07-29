import { createRoom, deleteRoom, joinRoom, leaveRoom, updateRoom } from './channel';
import { fetchLinkPreview, getChatMsg } from './chat';
import { checkLicenseByIP, getLicenseByIP } from './license';
import { sendRecordRequest, updateRecord } from './record';
import {
  allSpaceInfos,
  checkUsername,
  defineUserStatus,
  deleteSpaceParticipant,
  getSpaceInfo,
  getUniqueUsername,
  historySpaceInfos,
  joinSpace,
  updateOwnerId,
  updateSpaceApps,
  updateSpaceParticipant,
} from './space';

export const api = {
  // ---- space api --------
  joinSpace,
  allSpaceInfos,
  historySpaceInfos,
  getUniqueUsername,
  checkUsername,
  defineUserStatus,
  getSpaceInfo,
  updateOwnerId,
  deleteSpaceParticipant,
  updateSpaceParticipant,
  updateSpaceApps,
  // ---- chat api --------
  fetchLinkPreview,
  getChatMsg,
  // ---- license api --------
  getLicenseByIP,
  checkLicenseByIP,
  // ---- recording api --------
  sendRecordRequest,
  updateRecord,
  // ---- channel api --------
  createRoom,
  deleteRoom,
  leaveRoom,
  joinRoom,
  updateRoom,
};
