// 用来读取vocespace.conf.json这个配置文件
// 这个配置文件的位置在项目根目录下
// 只会在服务器端使用
import { VideoCodec, VideoPreset } from 'livekit-client';

export interface TurnConf {
  credential: string;
  username: string;
  urls: string[];
}

export interface LivekitConf {
  key: string;
  secret: string;
  url: string;
  turn?: TurnConf;
}

export type Resolution = '540p' | '720p' | '1080p' | '2k' | '4k';

export interface RedisConf {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface S3Conf {
  access_key: string;
  secret_key: string;
  bucket: string;
  region: string;
}

export interface RTCConf {
  codec: VideoCodec;
  resolution: Resolution;
  maxBitrate: number;
  maxFramerate: number;
  priority: RTCPriorityType;
}

export interface VocespaceConfig {
  livekit: LivekitConf;
  codec?: VideoCodec;
  resolution?: Resolution;
  maxBitrate?: number;
  maxFramerate?: number;
  priority?: RTCPriorityType;
  redis: RedisConf;
  s3?: S3Conf;
  /**
   * 服务器的主机地址，这可以用来检测你的令牌是否有效
   * 默认为 localhost
   * 如果你部署在云服务器上，请修改为你的服务器地址(域名)
   * 例如: vocespace.com
   * **无需加上 http:// 或 https:// 前缀，也无需端口号**
   */
  server_url: string;
}

// 2k, 30fps, 3Mbps
export const DEFAULT_VOCESPACE_CONFIG: VocespaceConfig = {
  livekit: {
    key: 'apikey',
    secret: 'secret',
    url: 'wss://localhost:7880',
  },
  codec: 'vp9',
  resolution: '2k',
  maxBitrate: 3000000,
  maxFramerate: 30,
  priority: 'medium',
  redis: {
    enabled: true,
    host: 'localhost',
    port: 6379,
    password: 'vocespace',
    db: 0,
  },
  server_url: 'localhost',
};

export const createResolution = (options: {
  resolution?: Resolution;
  maxBitrate?: number;
  maxFramerate?: number;
  priority?: RTCPriorityType;
}): {
  h: VideoPreset;
  l: VideoPreset;
} => {
  const resolution = options.resolution || '2k';
  switch (resolution) {
    case '4k':
      return {
        h: new VideoPreset(
          3840,
          2160,
          options.maxBitrate || 8_000_000,
          options.maxFramerate || 30,
          options.priority || 'medium',
        ),
        l: new VideoPreset(
          2560,
          1440,
          options?.maxBitrate || 5_000_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
      };
    case '2k':
      return {
        h: new VideoPreset(
          2560,
          1440,
          options?.maxBitrate || 5_000_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
        l: new VideoPreset(
          1920,
          1080,
          options?.maxBitrate || 3_000_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
      };
    case '1080p':
      return {
        h: new VideoPreset(
          1920,
          1080,
          options?.maxBitrate || 3_000_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
        l: new VideoPreset(
          1280,
          720,
          options?.maxBitrate || 1_700_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
      };
    case '720p':
      return {
        h: new VideoPreset(
          1280,
          720,
          options?.maxBitrate || 1_700_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
        l: new VideoPreset(
          960,
          540,
          options?.maxBitrate || 800_000,
          options?.maxFramerate || 25,
          options?.priority || 'medium',
        ),
      };
    case '540p':
      return {
        h: new VideoPreset(
          960,
          540,
          options?.maxBitrate || 800_000,
          options?.maxFramerate || 25,
          options?.priority || 'medium',
        ),
        l: new VideoPreset(
          640,
          360,
          options?.maxBitrate || 450_000,
          options?.maxFramerate || 25,
          options?.priority || 'medium',
        ),
      };
    default:
      return {
        h: new VideoPreset(
          1920,
          1080,
          options?.maxBitrate || 3_000_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
        l: new VideoPreset(
          1280,
          720,
          options?.maxBitrate || 1_700_000,
          options?.maxFramerate || 30,
          options?.priority || 'medium',
        ),
      };
  }
};
