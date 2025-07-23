/**
 * 请求主服务从数据库中查询当前IP/Server Name作为服务器的license
 * @param ip 服务器IP地址/域名
 */
export const getLicenseByIP = async (ip: string) => {
  const url = `https://vocespace.com/api/webhook?session_ip=${ip}`;
  return await fetch(url, {
    method: 'GET',
  });
};

/**
 * 检查服务器的license是否有效
 * @param ip 服务器IP地址/域名
 */
export const checkLicenseByIP = async (ip: string) => {
  let url = `https://vocespace.com/api/license/${ip}`;
  return await fetch(url, {
    method: 'GET',
  });
};
