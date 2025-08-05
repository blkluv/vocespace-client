import { DEFAULT_VOCESPACE_CONFIG, VocespaceConfig } from "../std/conf";

export const getConf = async () => {
  const url = new URL('/api/conf', window.location.origin);
  return await fetch(url.toString())
}