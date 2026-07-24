import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import ReactDOM from 'react-dom';
import './globals.css';

export const metadata: Metadata = {
  title: '内部耗材管理系统',
  description: '产品管理、库存管理、销售开单、进货开单',
};

function FontPreconnect() {
  ReactDOM.preconnect('https://fonts.googleapis.cn');
  ReactDOM.preconnect('https://fonts.gstatic.cn');
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <FontPreconnect />
      <body className="antialiased">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
