import { Card, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import styles from '@/styles/chat.module.scss';
import { api } from '@/lib/api';

interface LinkPreviewProps {
  text: string;
}

interface PreviewData {
  charset?: string | null;
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  mediaType: string;
  contentType?: string;
  images?: string[];
  videos?: {
    url?: string;
    secureUrl?: string | null;
    type?: string | null;
    width?: string;
    height?: string;
  }[];
  favicons: string[];
}

export function LinkPreview({ text }: LinkPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch link preview data from the API
    const fetchLinkPreview = async () => {
      try {
        setLoading(true);
        const response = await api.fetchLinkPreview(text);
        if (!response.ok) {
          throw new Error('Failed to fetch link preview');
        }
        const data = await response.json();
        setPreviewData(data);
        setError(null);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLinkPreview();
  }, [text]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 2 }} />;
  }

  if (error || !previewData) {
    return <></>;
  }

  return (
    <a
      href={previewData.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link_preview}
    >
      <Card size="small" className={styles.link_preview_card}>
        {previewData?.images && previewData.images.length > 0 && (
          <div className={styles.link_preview_image}>
            <img src={previewData.images[0]} alt={previewData.title || '链接预览'} />
          </div>
        )}
        <div className={styles.link_preview_content}>
          {previewData?.siteName && (
            <div className={styles.link_preview_site}>
              {previewData?.favicons.map((favicon, index) => (
                <img key={index} src={favicon} alt="" className={styles.link_preview_favicon} />
              ))}
              <span>{previewData.siteName}</span>
            </div>
          )}
          {previewData?.title && <h4 className={styles.link_preview_title}>{previewData.title}</h4>}
          {previewData?.description && (
            <p className={styles.link_preview_description}>{previewData.description}</p>
          )}
        </div>
      </Card>
    </a>
  );
}
