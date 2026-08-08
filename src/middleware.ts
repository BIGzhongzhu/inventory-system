import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './lib/session';

// 公开接口白名单：无需登录即可访问
// （登录/登出/会话校验/初始化检测/首启动种子数据）
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

// 该中间件在 Edge 运行时执行（Vercel / Next serverless 原生支持）。
// session.ts 仅依赖 Web Crypto，已确保 Edge 兼容，可直接复用。
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅对 /api/* 做全局鉴权拦截；页面等静态/前端路由不在此处理
  if (pathname.startsWith('/api/') && !isPublicApi(pathname)) {
    const token = request.cookies.get('auth_token')?.value;
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // 仅在 API 路由上运行，避免对静态资源/页面造成额外开销
  matcher: ['/api/:path*'],
};
