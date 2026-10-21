import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateHealth, formatAlertText } from '../scripts/lib/probe-alerts.mjs';

const healthy = (hostname) => ({
  hostname,
  public: { ok: true, status: 200, ms: 10 },
  local: { ok: true, status: 200, ms: 5 },
});
const publicDown = (hostname) => ({
  hostname,
  public: { ok: false, status: 500, ms: 10 },
  local: { ok: true, status: 200, ms: 5 },
});

test('first failure does not alert', () => {
  const { events, state } = evaluateHealth({}, [publicDown('a.example.com')]);
  assert.deepEqual(events, []);
  assert.equal(state.services['a.example.com'].failures, 1);
});

test('second consecutive failure alerts exactly once', () => {
  const first = evaluateHealth({}, [publicDown('a.example.com')]);
  const second = evaluateHealth(first.state, [publicDown('a.example.com')]);
  assert.deepEqual(second.events.map((event) => event.type), ['down']);
  assert.equal(second.events[0].hostname, 'a.example.com');

  const third = evaluateHealth(second.state, [publicDown('a.example.com')]);
  assert.deepEqual(third.events, []);
});

test('a success before the threshold resets the failure count', () => {
  const first = evaluateHealth({}, [publicDown('a.example.com')]);
  const recovered = evaluateHealth(first.state, [healthy('a.example.com')]);
  assert.deepEqual(recovered.events, []);
  const again = evaluateHealth(recovered.state, [publicDown('a.example.com')]);
  assert.deepEqual(again.events, []);
});

test('recovery after an alert emits one recovered event', () => {
  let state = {};
  state = evaluateHealth(state, [publicDown('a.example.com')]).state;
  state = evaluateHealth(state, [publicDown('a.example.com')]).state;
  const recovered = evaluateHealth(state, [healthy('a.example.com')]);
  assert.deepEqual(recovered.events.map((event) => event.type), ['recovered']);

  const after = evaluateHealth(recovered.state, [healthy('a.example.com')]);
  assert.deepEqual(after.events, []);
});

test('a local-only failure also counts as degraded', () => {
  const localDown = {
    hostname: 'b.example.com',
    public: { ok: true, status: 200, ms: 10 },
    local: { ok: false, status: 0, ms: 8000, error: 'ECONNREFUSED' },
  };
  const first = evaluateHealth({}, [localDown]);
  const second = evaluateHealth(first.state, [localDown]);
  assert.deepEqual(second.events.map((event) => event.type), ['down']);
});

test('services removed from the ingress are dropped without events', () => {
  const first = evaluateHealth({}, [publicDown('a.example.com'), healthy('b.example.com')]);
  const next = evaluateHealth(first.state, [healthy('b.example.com')]);
  assert.deepEqual(next.events, []);
  assert.equal('a.example.com' in next.state.services, false);
});

test('services are tracked independently', () => {
  let state = evaluateHealth({}, [publicDown('a.example.com'), healthy('b.example.com')]).state;
  const next = evaluateHealth(state, [publicDown('a.example.com'), healthy('b.example.com')]);
  assert.deepEqual(next.events.map((event) => event.hostname), ['a.example.com']);
});

test('threshold is configurable', () => {
  const { events } = evaluateHealth({}, [publicDown('a.example.com')], { threshold: 1 });
  assert.deepEqual(events.map((event) => event.type), ['down']);
});

test('does not mutate the previous state', () => {
  const previous = { services: { 'a.example.com': { failures: 1, alerting: false } } };
  const snapshot = structuredClone(previous);
  evaluateHealth(previous, [publicDown('a.example.com')]);
  assert.deepEqual(previous, snapshot);
});

test('tolerates missing or malformed previous state', () => {
  assert.doesNotThrow(() => evaluateHealth(undefined, [healthy('a.example.com')]));
  assert.doesNotThrow(() => evaluateHealth({ services: null }, [healthy('a.example.com')]));
});

test('alert text names the host and the failing side', () => {
  const { events } = evaluateHealth({ services: { 'a.example.com': { failures: 1, alerting: false } } }, [
    publicDown('a.example.com'),
  ]);
  const text = formatAlertText(events, '2026-10-20T10:00:00.000Z');
  assert.match(text, /a\.example\.com/);
  assert.match(text, /public 500/);
  assert.doesNotMatch(text, /local 200/);
});

test('recovery text is distinguishable from down text', () => {
  const text = formatAlertText(
    [{ type: 'recovered', hostname: 'a.example.com', detail: [] }],
    '2026-10-20T10:00:00.000Z'
  );
  assert.match(text, /恢复/);
  assert.match(text, /a\.example\.com/);
});

test('returns empty text when there are no events', () => {
  assert.equal(formatAlertText([], '2026-10-20T10:00:00.000Z'), '');
});

// ── 附加探测路径（works#5）：首页 200 不代表后端可用 ──────────────────────────
import { isDegraded, normalizeProbePaths } from '../scripts/lib/probe-alerts.mjs';

const withExtra = (hostname, extra) => ({ ...healthy(hostname), extra });
const apiDown = (path) => ({
  path,
  public: { ok: false, status: 502, ms: 10 },
  local: { ok: true, status: 200, ms: 5 },
});
const apiUp = (path) => ({
  path,
  public: { ok: true, status: 200, ms: 10 },
  local: { ok: true, status: 200, ms: 5 },
});

test('a failing extra path counts as degraded even when the homepage is fine', () => {
  assert.equal(isDegraded(withExtra('a.example.com', [apiDown('/api/skills')])), true);
  assert.equal(isDegraded(withExtra('a.example.com', [apiUp('/api/skills')])), false);
  assert.equal(isDegraded(healthy('a.example.com')), false);
});

test('extra path failures alert after the threshold and name the path and side', () => {
  const service = withExtra('a.example.com', [apiDown('/api/skills')]);
  const first = evaluateHealth({}, [service]);
  assert.deepEqual(first.events, []);
  const second = evaluateHealth(first.state, [service]);
  assert.deepEqual(second.events.map((event) => event.type), ['down']);
  assert.deepEqual(second.events[0].detail, ['public /api/skills 502']);
});

test('recovering the extra path emits a recovery notice', () => {
  let state = {};
  const down = withExtra('a.example.com', [apiDown('/api/skills')]);
  state = evaluateHealth(state, [down]).state;
  state = evaluateHealth(state, [down]).state;
  const recovered = evaluateHealth(state, [withExtra('a.example.com', [apiUp('/api/skills')])]);
  assert.deepEqual(recovered.events.map((event) => event.type), ['recovered']);
});

test('services without extra paths behave exactly as before', () => {
  const { events, state } = evaluateHealth({}, [publicDown('a.example.com')], { threshold: 1 });
  assert.deepEqual(events[0].detail, ['public 500']);
  assert.equal(state.services['a.example.com'].alerting, true);
});

test('normalizeProbePaths keeps only absolute paths and drops malformed entries', () => {
  const result = normalizeProbePaths({
    'a.example.com': ['/api/skills', 'no-leading-slash', '', 42, '/health'],
    'b.example.com': 'not-an-array',
    'c.example.com': [],
  });
  assert.deepEqual(result.get('a.example.com'), ['/api/skills', '/health']);
  assert.equal(result.has('b.example.com'), false);
  assert.equal(result.has('c.example.com'), false);
});

test('normalizeProbePaths tolerates missing or non-object input', () => {
  assert.equal(normalizeProbePaths(undefined).size, 0);
  assert.equal(normalizeProbePaths(null).size, 0);
  assert.equal(normalizeProbePaths([]).size, 0);
});
