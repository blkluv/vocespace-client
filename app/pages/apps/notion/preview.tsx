import Head from 'next/head';
import { type ExtendedRecordMap } from 'notion-types';
import { getPageTitle } from 'notion-utils';
import { NotionRenderer } from 'react-notion-x';
import { NotionAPI } from 'notion-client';

function NotionPageImpl({
  recordMap,
  rootPageId,
}: {
  recordMap: ExtendedRecordMap;
  rootPageId?: string;
}) {
  if (!recordMap) {
    return null;
  }

  const title = getPageTitle(recordMap);

  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={true}
      darkMode={false}
      rootPageId={rootPageId}
    />
  );
}

export const getStaticProps = async () => {
  const pageId = 'test_notion-2241a9cda70e8000b07cef0062301cc1';
  const notion = new NotionAPI();
  const recordMap = await notion.getPage(pageId);

  return {
    props: {
      recordMap,
    },
    revalidate: 10,
  };
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export default function NotionPage({ recordMap }: { recordMap: ExtendedRecordMap }) {
  return (
    <NotionPageImpl recordMap={recordMap} rootPageId={'test_notion-2241a9cda70e8000b07cef0062301cc1'} />
  );
}
