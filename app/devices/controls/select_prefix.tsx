import { SvgResource, SvgResourceProps } from '@/app/resources/svg';

export function SelectPrefix({ type, svgSize, color }: SvgResourceProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'end',
        justifyContent: 'center',
        height: '22px',
        width: '100%',
      }}
    >
      <SvgResource type={type} svgSize={svgSize} color={color}></SvgResource>
    </div>
  );
}
