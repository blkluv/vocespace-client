// lib/hooks/useRoomSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { connect_endpoint, UserDefineStatus, UserStatus } from '../std';
import { ModelBg, ModelRole } from '../std/virtual';
import { socket } from '@/app/rooms/[roomName]/PageClientImpl';

export interface ParticipantSettings {
  name: string;
  volume: number;
  blur: number;
  screenBlur: number;
  status: UserStatus | string;
  socketId: string;
  virtual: {
    role: ModelRole;
    bg: ModelBg;
    enabled: boolean;
  };
}

export interface RoomSettings {
  participants: {
    [participantId: string]: ParticipantSettings;
  },
  status?: UserDefineStatus[];
}

const ROOM_SETTINGS_ENDPOINT = connect_endpoint('/api/room-settings');

export function useRoomSettings(roomId: string, participantId: string) {
  const [settings, setSettings] = useState<RoomSettings>({participants:{}});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 获取所有参与者设置
  const fetchSettings = useCallback(async () => {
    if (!roomId) return;

    try {
      const url = new URL(ROOM_SETTINGS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomId', roomId);

      setLoading(true);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data.settings || {});
      return data.settings || {};
    } catch (err) {
      console.error('Error fetching room settings:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 更新当前参与者设置
  const updateSettings = useCallback(
    async (newSettings: Partial<ParticipantSettings>) => {
      if (!roomId || !participantId) return;

      try {
        const url = new URL(ROOM_SETTINGS_ENDPOINT, window.location.origin);
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            participantId,
            settings: newSettings,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update settings: ${response.status}`);
        }
        // 直接执行fetchSettings以获取最新设置
        const data = await fetchSettings();

        return Boolean(data);
      } catch (err) {
        console.error('Error updating settings:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [roomId, participantId],
  );

  // 清除参与者设置（离开时）
  const clearSettings = useCallback(async (id?: string) => {
    if (!roomId || !participantId) return;
    let removeId = id || participantId;
    try {
      const url = new URL(ROOM_SETTINGS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomId', roomId);
      url.searchParams.append('participantId', removeId);
      await fetch(url.toString(), {
        method: 'DELETE',
      }).then(async (res) => {
        if (res.ok) {
          const data: { success: boolean; clearRoom?: string } = await res.json();
          if (data.clearRoom && data.clearRoom !== '') {
            socket.emit('clear_room_resources', { roomName: data.clearRoom });
            console.warn("clear room resources", data.clearRoom);
          }
        }
      });
    } catch (err) {
      console.error('Error clearing settings:', err);
    }
  }, [roomId, participantId]);

  // useEffect(() => {
  //   console.log(settings);
  // }, [settings]);

  return {
    settings,
    loading,
    error,
    setSettings,
    updateSettings,
    fetchSettings,
    clearSettings,
  };
}
