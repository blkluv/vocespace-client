import { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import styles from '@/styles/pagination.module.scss';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

export interface Pagination {
  totalPageCount: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (num: number) => void;
  firstItemIndex: number;
  lastItemIndex: number;
  tracks: TrackReferenceOrPlaceholder[];
  currentPage: number;
}

export interface PaginationInfoProps {
  totalPageCount: number;
  currentPage: number;
}

/**
 * ## Pagination Info
 * A simple pagination info component
 * ```
 * ○ ● ○ ○ (2/4)
 * ```
 * @param param0
 * @returns
 */
export function PaginationInfo({ totalPageCount, currentPage }: PaginationInfoProps) {
  return (
    <div className={styles.info}>
      {Array.from({ length: totalPageCount }, (_, i) => (
        <span key={i}>{i + 1 === currentPage ? '●' : '○'}</span>
      ))}
      <span>
        ({currentPage}/{totalPageCount})
      </span>
    </div>
  );
}

export interface PaginationCtlProps {
  pagination: Pagination;
  children: React.ReactNode;
}

/**
 * ## Pagination Control
 * A simple pagination control component
 *
 * ```
 * < |nodes| >
 * ```
 * @returns
 */
export function PaginationCtl({ pagination, children }: PaginationCtlProps) {
  return (
    <div className={styles.ctl}>
      <button
        className={`${styles.ctl_btn} vocespace_button`}
        onClick={() => pagination.prevPage()}
      >
        <LeftOutlined />
      </button>
      <div className={styles.ctl_inner}>{children}</div>
      <button
        className={`${styles.ctl_btn} vocespace_button`}
        onClick={() => pagination.nextPage()}
      >
        <RightOutlined />
      </button>
    </div>
  );
}
