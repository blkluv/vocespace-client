import { useRoomInfo } from "@livekit/components-react";
import styles from '@/styles/main_panel.module.scss';
/**
 * # Main panel for the room
 * 主面板是位于房间中心区域的主要显示区域，用于显示主要内容。
 * 在主面板中通常会显示：
 * 1. 演讲者视频（若未开启屏幕分享，但开启了视频分享，并基于权限，允许视频作为主面板）
 * 2. 屏幕分享（若开启了屏幕分享，且权限允许的情况下）
 * 3. 素材（若房间的owner在构建房间时提供了主面板素材）
 * 4. 房间信息（房间名称、房间号、房间密码、房间创建者、房间创建时间等）(当前版本进行实现)
 */
export function MainPanel(){

    const {name} = useRoomInfo();
   
    return (
        <div className={styles.main_panel}>
            Main Panel
            <p>Room Id: {name}</p>
        </div>
    );
}