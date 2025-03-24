'use client';

import { Settings } from '@/app/settings/settings';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LiveKitRoom,
  LocalUserChoices,
  PreJoin,
  VideoConference,
} from '@livekit/components-react';
import { Button, message, Modal, notification, Space } from 'antd';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  MediaDeviceFailure,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, []);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const e2eePassphrase =
    typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));

  const worker =
    typeof window !== 'undefined' &&
    e2eePassphrase &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const e2eeEnabled = !!(e2eePassphrase && worker);
  const keyProvider = new ExternalE2EEKeyProvider();
  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [notApi, notHolder] = notification.useNotification();
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    return {
      videoCaptureDefaults: {
        deviceId: props.userChoices.videoDeviceId ?? undefined,
        resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers: props.options.hq
          ? [VideoPresets.h1080, VideoPresets.h720]
          : [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec,
      },
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, [props.userChoices, props.options.hq, props.options.codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              console.error(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      maxRetries: 5,
      autoSubscribe: true,
    };
  }, []);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(
      `Encountered an unexpected error, check the console logs for details: ${error.message}`,
    );
    if (error.name === 'ConnectionError') {
      messageApi.error('Connection Error, please check your network connection and try again.');
    } else {
      console.error(error);
    }
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    messageApi.error(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  const handleMediaDeviceFailure = React.useCallback((fail?: MediaDeviceFailure) => {
    if (fail) {
      switch (fail) {
        case MediaDeviceFailure.DeviceInUse:
          messageApi.error(`Current Media Device is in use. Please close and try again later.`);
          break;
        case MediaDeviceFailure.NotFound:
          messageApi.error(`Media Device not found. Please check your device and try again.`);
          break;
        case MediaDeviceFailure.PermissionDenied:
          notApi.open({
            duration: 3,
            message: 'Permission Denied.',
            description:
              'Please allow access to your media devices. You can do these by click the following button.',
            btn: (
              <Space>
                <Button type="primary" size="small" onClick={() => setPermissionModalVisible(true)}>
                  Allow Media Permissions
                </Button>
              </Space>
            ),
          });
          break;
        case MediaDeviceFailure.Other:
          messageApi.error(
            `An error occurred with your media devices. Please check your devices and try again.`,
          );
          break;
      }
    }
  }, []);

  // 请求权限的函数 - 将在用户点击按钮时直接触发
  const requestMediaPermissions = async () => {
    // 重置状态
    setPermissionError(null);
    setPermissionRequested(true);

    try {
      // 请求媒体权限
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // 权限已获取，通知用户
      messageApi.success('Media permissions granted successfully!');

      // 关闭模态框
      setPermissionModalVisible(false);

      // 尝试重新启用设备
      if (room) {
        try {
          // 可以选择性地重新启用摄像头或麦克风
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (err) {
          console.error('Failed to enable devices after permission granted:', err);
        }
      }
    } catch (error: any) {
      console.error('Error requesting media permissions:', error);

      // 设置详细错误信息
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError('权限被拒绝。请在浏览器设置中手动允许访问摄像头和麦克风。');
      } else {
        setPermissionError(`请求权限时出错: ${error.message}`);
      }
    } finally {
      setPermissionRequested(false);
    }
  };

  return (
    <>
      {contextHolder}
      {notHolder}
      <LiveKitRoom
        connect={e2eeSetupComplete}
        room={room}
        token={props.connectionDetails.participantToken}
        serverUrl={props.connectionDetails.serverUrl}
        connectOptions={connectOptions}
        video={props.userChoices.videoEnabled}
        audio={props.userChoices.audioEnabled}
        onDisconnected={handleOnLeave}
        onEncryptionError={handleEncryptionError}
        onError={handleError}
        onMediaDeviceFailure={handleMediaDeviceFailure}
      >
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={undefined}
        />
        <DebugMode />
        <RecordingIndicator />
        <Modal
          title="需要访问摄像头和麦克风权限"
          open={permissionModalVisible}
          onCancel={() => setPermissionModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setPermissionModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="request"
              type="primary"
              loading={permissionRequested}
              onClick={requestMediaPermissions}
              disabled={
                !!permissionError &&
                (permissionError.includes('权限被拒绝') ||
                  permissionError.includes('Permission denied'))
              }
            >
              {permissionRequested ? '请求中...' : '允许访问摄像头和麦克风'}
            </Button>,
          ]}
        >
          <div style={{ marginBottom: '16px' }}>
            Voce Space 需要访问您的摄像头和麦克风才能参与会议。请点击下方按钮允许访问。
          </div>

          {permissionError && (
            <div
              style={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                color: '#f44336',
              }}
            >
              <p>
                <strong>出现问题:</strong> {permissionError}
              </p>

              {permissionError.includes('权限被拒绝') ||
              permissionError.includes('Permission denied') ? (
                <div>
                  <p>
                    <strong>如何在浏览器中修改权限:</strong>
                  </p>
                  {renderBrowserSpecificInstructions()}
                  <p>修改权限后，请刷新页面重试。</p>
                </div>
              ) : null}
            </div>
          )}

          <p>
            <strong>注意:</strong> 如果您之前拒绝了权限，您可能需要在浏览器设置中手动允许它们。
          </p>
        </Modal>
      </LiveKitRoom>
    </>
  );
}

const renderBrowserSpecificInstructions = () => {
  // 检测浏览器类型
  const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
  const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
  const isSafari =
    navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
  const isEdge = navigator.userAgent.indexOf('Edg') > -1;

  if (isChrome || isEdge) {
    return (
      <ol>
        <li>点击浏览器地址栏左侧的锁定图标</li>
        <li>选择"网站设置"</li>
        <li>找到"摄像头"和"麦克风"设置</li>
        <li>将设置从"阻止"更改为"允许"</li>
        <li>刷新页面</li>
      </ol>
    );
  } else if (isFirefox) {
    return (
      <ol>
        <li>点击浏览器地址栏左侧的锁定图标</li>
        <li>点击"连接安全"</li>
        <li>点击"更多信息"</li>
        <li>在"权限"部分，找到"使用摄像头"和"使用麦克风"</li>
        <li>将设置从"阻止"更改为"允许"</li>
        <li>刷新页面</li>
      </ol>
    );
  } else if (isSafari) {
    return (
      <ol>
        <li>打开 Safari 偏好设置 (Safari菜单或右上角的齿轮图标)</li>
        <li>选择"网站"选项卡</li>
        <li>在左侧找到"摄像头"和"麦克风"</li>
        <li>找到当前网站并更改权限设置</li>
        <li>刷新页面</li>
      </ol>
    );
  } else {
    return (
      <ol>
        <li>点击浏览器地址栏左侧的锁定或信息图标</li>
        <li>找到摄像头和麦克风权限设置</li>
        <li>将设置从"阻止"更改为"允许"</li>
        <li>刷新页面</li>
      </ol>
    );
  }
};
