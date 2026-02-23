export function getClientIp(request: Request): string {
  const headers = request.headers;

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  return '127.0.0.1';
}

export function getDeviceInfo(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
