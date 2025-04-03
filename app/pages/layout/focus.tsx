import { FocusLayoutProps } from '@livekit/components-react';
import { ParticipantItem } from '../participant/tile';

export function FocusLayout({
  trackRef,
  blurs,
  ...htmlProps
}: FocusLayoutProps & { blurs: Record<string, { blur: number; screenBlur: number }> }) {
  return <ParticipantItem trackRef={trackRef} blurs={blurs} {...htmlProps}></ParticipantItem>;
}
