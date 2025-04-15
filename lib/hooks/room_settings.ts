// lib/hooks/useRoomSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { connect_endpoint, UserStatus } from '../std';

export interface ParticipantSettings {
  name: string;
  blur: number;
  screenBlur: number;
  status: UserStatus;
  socketId: string;
  virtual: boolean;
}

export interface RoomSettings {
  [participantId: string]: ParticipantSettings;
}

const ROOM_SETTINGS_ENDPOINT = connect_endpoint('/api/room-settings');

export function useRoomSettings(roomId: string, participantId: string) {
  const [settings, setSettings] = useState<RoomSettings>({});
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
  const clearSettings = useCallback(async () => {
    if (!roomId || !participantId) return;

    try {
      const url = new URL(ROOM_SETTINGS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomId', roomId);
      url.searchParams.append('participantId', participantId);
      await fetch(url.toString(), {
        method: 'DELETE',
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
