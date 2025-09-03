import { AppKey } from '@/lib/std/space';
import { CarryOutOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { LayoutContext } from '@livekit/components-react';

export interface AppPinProps {
  appKey: AppKey;
  pin: () => void;
  style?: React.CSSProperties;
}

export interface AppFlotIconProps extends AppPinProps {
  contextUndefined?: boolean;
}

export function AppFlotIcon({ style, pin, appKey, contextUndefined = true }: AppFlotIconProps) {
  if (contextUndefined) {
    return (
      <LayoutContext.Consumer>
        {(layoutContext) =>
          layoutContext !== undefined && (
            <AppFlotPin appKey={appKey} pin={pin} style={style}></AppFlotPin>
          )
        }
      </LayoutContext.Consumer>
    );
  } else {
    return <AppFlotPin appKey={appKey} pin={pin} style={style}></AppFlotPin>;
  }
}

export function AppFlotPin({
  pin,
  appKey,
  style = {
    width: 'fit-content',
    padding: 4,
    backgroundColor: "#000",
    margin: "0 4px",
    borderRadius: 4
  },
}: AppPinProps) {
  return (
    <button className="lk-button" style={style} onClick={pin}>
      {appKey === 'timer' && <ClockCircleOutlined />}
      {appKey === 'countdown' && <HistoryOutlined></HistoryOutlined>}
      {appKey === 'todo' && <CarryOutOutlined></CarryOutOutlined>}
    </button>
  );
}
