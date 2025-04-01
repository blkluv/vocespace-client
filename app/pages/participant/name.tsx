import { ParticipantNameProps, useEnsureParticipant } from '@livekit/components-react';
import React, { useEffect } from 'react';

export const PName: (
  props: ParticipantNameProps & React.RefAttributes<HTMLSpanElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ParticipantNameProps>(
  function ParticipantName({ participant, ...props }: ParticipantNameProps, ref) {
    const p = useEnsureParticipant(participant);

    // 如果name超过8个字符，仅显示前8个字符
    useEffect(()=>{
        if (p.name && p.name.length > 8) {
          p.name = p.name.slice(0, 8) + '...';
        }
    }, [p.name])

    return (
      <span ref={ref}>
        {p.name}
        {props.children}
      </span>
    );
  },
);
