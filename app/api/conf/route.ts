// 获取动态配置
import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setStoredConf, setConfigEnv } from './conf';
import { RTCConf } from '@/lib/std/conf';


export async function GET(_request: NextRequest) {
  let config = getConfig();
  setStoredConf(config);
  return NextResponse.json(config, { status: 200 });
}

export async function POST(request: NextRequest) {
  const env: RTCConf = await request.json();

  const { success, error } = setConfigEnv(env);
  if (success) {
    return NextResponse.json({ success }, { status: 200 });
  } else {
    return NextResponse.json(
      {
        success,
        error,
      },
      { status: 500 },
    );
  }
}