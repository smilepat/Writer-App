import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartWriter AI — AI 글쓰기 도우미',
  description: 'AI가 글의 의도를 분석하여 다듬기·요약·확장·번역을 도와주는 스마트 글쓰기 앱',
};

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
