import { TrackLoop, TrackReferenceOrPlaceholder, usePagination } from '@livekit/components-react';
import { createRef, RefObject, useState } from 'react';
import styles from '@/styles/flex_layout.module.scss';
import { Size, SizeNum } from '@/lib/std';
import { Track } from 'livekit-client';
/**
 * # FlexLayout for Participants
 * 为参与者列表提供的flex布局，需要具备以下能力
 * - flex布局
 * - 参与者列表
 * - 翻页
 */
export function FlexLayout({
  tracks,
  children,
  size = { height: '80px', width: '96px' },
}: {
  tracks: TrackReferenceOrPlaceholder[];
  children: React.ReactNode;
  size: Size;
}) {
  const visible_tracks = tracks;
  const gridEL = createRef<HTMLDivElement>();
  const [max_tile, set_max_tile] = useState(max_tile_num(gridEL, size));
  const pagination = usePagination(max_tile, visible_tracks);

  return (
    <div ref={gridEL} className={styles.layout}>
      <TrackLoop tracks={pagination.tracks}>{children}</TrackLoop>
    </div>
  );
}

// 获得div元素尺寸
const get_size = ({ ele }: { ele: RefObject<HTMLDivElement> }): SizeNum => {
  const min_height = 196;
  const min_width = 200;

  return {
    height: ele.current?.clientHeight ?? min_height,
    width: ele.current?.clientWidth ?? min_width,
  };
};

// 获得最大tile数量
const max_tile_num = (ele: RefObject<HTMLDivElement>, item_size: Size): number => {
  // if size is number, return it, if is percentage, remove % and convert to number
  const convert = (size: string): number => {
    if (size.includes('%')) {
      return parseFloat(size.replace('%', '')) / 100;
    }
    return parseFloat(size);
  };

  const { height, width } = get_size({ ele });
  const row_number = Math.floor(height / convert(item_size.height));
  const col_number = Math.floor(width / convert(item_size.width));
  return row_number * col_number;
};
