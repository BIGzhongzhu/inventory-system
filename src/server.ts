import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { verifySession, parseCookies } from './lib/session';

// 公开接口白名单：无需登录即可访问（登录/登出/会话校验/初始化检测/首启动种子数据）
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/setup/check',
  '/api/seed',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const pathname = parsedUrl.pathname || '';

      // 全局 API 鉴权：除白名单外，所有 /api/* 必须携带有效会话令牌
      if (pathname.startsWith('/api/') && !isPublicApi(pathname)) {
        const cookies = parseCookies(req.headers.cookie);
        const session = await verifySession(cookies['auth_token']);
        if (!session) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: '未授权，请先登录' }));
          return;
        }
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
  });
});
