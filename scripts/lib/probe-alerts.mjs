// 探活结果的告警状态机：只做判断，不读写文件、不读时钟。
// 连续失败达到阈值才告警，恢复时通知一次，避免偶发抖动刷屏。

const DEFAULT_THRESHOLD = 2;

function describeFailure(label, result, path = '') {
  if (result.ok) return null;
  return `${label}${path ? ` ${path}` : ''} ${result.error || result.status}`;
}

function failureDetail(service) {
  const detail = [describeFailure('public', service.public), describeFailure('local', service.local)];
  // 附加路径（如 /api/skills）：首页由 nginx 兜底恒为 200，只有这些路径能暴露后端已停
  for (const extra of service.extra ?? []) {
    detail.push(describeFailure('public', extra.public, extra.path), describeFailure('local', extra.local, extra.path));
  }
  return detail.filter(Boolean);
}

export function isDegraded(service) {
  return failureDetail(service).length > 0;
}

// 配置形如 { "host": ["/api/x"] }；只保留以 / 开头的字符串路径，其余丢弃，避免一条坏配置拖垮整次探活
export function normalizeProbePaths(raw) {
  const result = new Map();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [hostname, paths] of Object.entries(raw)) {
    if (!Array.isArray(paths)) continue;
    const valid = paths.filter((path) => typeof path === 'string' && path.startsWith('/'));
    if (valid.length > 0) result.set(hostname, valid);
  }
  return result;
}

function previousServices(previousState) {
  const services = previousState?.services;
  return services && typeof services === 'object' ? services : {};
}

export function evaluateHealth(previousState, services, { threshold = DEFAULT_THRESHOLD } = {}) {
  const previous = previousServices(previousState);
  const nextServices = {};
  const events = [];

  for (const service of services) {
    const before = previous[service.hostname] ?? { failures: 0, alerting: false };
    const detail = failureDetail(service);

    if (detail.length === 0) {
      if (before.alerting) events.push({ type: 'recovered', hostname: service.hostname, detail });
      nextServices[service.hostname] = { failures: 0, alerting: false };
      continue;
    }

    const failures = before.failures + 1;
    const shouldAlert = !before.alerting && failures >= threshold;
    if (shouldAlert) events.push({ type: 'down', hostname: service.hostname, detail });
    nextServices[service.hostname] = { failures, alerting: before.alerting || shouldAlert };
  }

  return { state: { services: nextServices }, events };
}

export function formatAlertText(events, checkedAt) {
  if (events.length === 0) return '';
  const lines = events.map((event) =>
    event.type === 'down'
      ? `🔴 ${event.hostname} 异常：${event.detail.join('，')}`
      : `🟢 ${event.hostname} 已恢复`
  );
  return [`works 服务探活（${checkedAt}）`, ...lines].join('\n');
}
