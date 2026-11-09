# Spec: probe-alerts

## Objective

服务探活（`scripts/probe-services.mjs`，cron 每 5 分钟）发现服务持续异常时，主动通知到飞书；恢复后再通知一次。解决 works#2 中"故障持续存在却无人知晓"的问题。

## Tech Stack

- Node.js（ESM，无新依赖），`node --test`
- 通知渠道：`/root/go/bin/feishu-cli msg send`（bot 身份，适合无人值守）

## Commands

- 测试：`npm test`
- Lint：`npm run lint`
- 手动探活：`npm run probe`

## Project Structure

- `scripts/lib/probe-alerts.mjs` — 纯函数：状态迁移 `evaluateHealth`、文案 `formatAlertText`
- `scripts/probe-services.mjs` — 读取/写回状态，调用通知
- `tests/probe-alerts.test.mjs` — 单元测试
- 运行时文件（均被 gitignore）：`.probe-state.json`、`.probe-alerts.log`

## Behavior

1. 服务异常 = `public.ok` 或 `local.ok` 为 false。
2. 连续失败次数达到阈值（默认 2，约 10 分钟）时触发一次 `down` 事件，之后持续失败不重复触发。
3. 已告警的服务恢复后触发一次 `recovered` 事件，并清零计数。
4. 任意一次成功会清零未达阈值的失败计数。
5. 不再出现在 ingress 中的服务，从状态中移除，不触发事件。
6. 事件始终写入 `.probe-alerts.log`；仅当设置 `PROBE_ALERT_RECEIVE_ID` 时发送飞书消息（`PROBE_ALERT_RECEIVE_TYPE` 默认 `open_id`）。
7. 通知失败不得影响探活产物（health.json）的写入，也不得让脚本非零退出。

## Code Style

```js
const { state, events } = evaluateHealth(previousState, services, { threshold: 2 });
```

纯函数不读写文件、不读时钟；时间与 IO 由调用方注入。

## Testing Strategy

- `evaluateHealth` 用表驱动单元测试覆盖上面第 1–5 条。
- `formatAlertText` 断言包含主机名与失败侧（public / local）的状态码或错误码。
- 集成：真实运行 `npm run probe`，全部健康时无事件、不发消息。

## Boundaries

- Always：告警文案不包含本地端口以外的私密信息（沿用 health.json 已有字段，仅发给自己）。
- Ask first：修改 crontab、设置接收人。
- Never：写入 token；改动 nginx / cloudflared；向 dist 或 public 写状态文件。

## Success Criteria

- `npm test`、`npm run lint` 通过。
- 模拟"连续两次失败 → 恢复"得到且仅得到一次 `down` 与一次 `recovered`。
- 未配置接收人时脚本行为与现在一致，仅多写本地日志。
