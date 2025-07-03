import { NotionAPI } from "notion-client";

const notion = new NotionAPI();
export const recordMap = await notion.getPage('test_notion-2241a9cda70e8000b07cef0062301cc1');