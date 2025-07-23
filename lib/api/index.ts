import { createRoom, deleteRoom, joinRoom, leaveRoom, updateRoom } from './channel';
import { fetchLinkPreview, getChatMsg } from './chat';
import { checkLicenseByIP, getLicenseByIP } from './license';
import { sendRecordRequest } from './record';
import {
  allSpaceInfos,
  checkUsername,
  defineUserStatus,
  getUniqueUsername,
  historySpaceInfos,
  joinSpace,
} from './room';

export const api = {
  // ---- space api --------
  joinSpace,
  allSpaceInfos,
  historySpaceInfos,
  getUniqueUsername,
  checkUsername,
  defineUserStatus,
  // ---- chat api --------
  fetchLinkPreview,
  getChatMsg,
  // ---- license api --------
  getLicenseByIP,
  checkLicenseByIP,
  // ---- recording api --------
  sendRecordRequest,
  // ---- channel api --------
  createRoom,
  deleteRoom,
  leaveRoom,
  joinRoom,
  updateRoom,
};
