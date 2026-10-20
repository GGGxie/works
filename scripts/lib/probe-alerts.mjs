// 探活结果的告警状态机：只做判断，不读写文件、不读时钟。
// 连续失败达到阈值才告警，恢复时通知一次，避免偶发抖动刷屏。

const DEFAULT_THRESHOLD = 2;

function describeFailure(label, result) {
  if (result.ok) return null;
  return `${label} ${result.error || result.status}`;
}

function failureDetail(service) {
  return [describeFailure('public', service.public), describeFailure('local', service.local)].filter(Boolean);
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
