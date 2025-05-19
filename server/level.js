import os from 'os';

/**
 * # 获取服务器等级
 * 1. high: CPU >= 8 核心，内存 >= 16 GB
 * 2. medium: CPU >= 4 核心，内存 >= 8 GB
 * 3. low: CPU >= 2 核心，内存 >= 4 GB
 * 
 * 当 freeMemory < 1GB 时，直接返回 low
 * 
 * @description 在服务器运行时进行判断，外部设置async interval 每隔 20s 检测一次
 * @returns "high" | "medium" | "low"
 */
export const getServerLevel = () => {
  const cpuCores = os.cpus().length;
  // GB memory
  const memory = os.totalmem() / (1024 * 1024 * 1024);
  const freeMemory = os.freemem() / (1024 * 1024 * 1024);

  if (freeMemory < 1) {
    return "low";
  }

  // 根据 CPU 核心数和内存大小来判断服务器等级
  if (cpuCores >= 8 && memory >= 16) {
    return 'high';
  } else if (cpuCores >= 4 && memory >= 8) {
    return 'medium';
  } else if (cpuCores >= 2 && memory >= 4) {
    return 'low';
  }

  return "low";
};

getServerLevel();