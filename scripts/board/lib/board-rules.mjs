// 看板的纯规则：不访问网络、不读文件，便于测试。

// Status 的语义（项目卡片）：
//   Todo         有未关闭的风险或任务 issue —— 需要维护者处理或决定
//   In Progress  正在迭代（生命周期为「开发中」），且没有待办
//   Done         稳定，没有待办
// 任务 issue 关闭后，GitHub 内置工作流会把它设为 Done，下次同步时项目卡片自然回到非 Todo。
export function statusForProject({ lifecycle, openAttentionIssues }) {
  if (openAttentionIssues > 0) return 'Todo';
  if (lifecycle === '开发中') return 'In Progress';
  return 'Done';
}

// 项目卡片要同步的字段。生命周期与优先级以飞书为准；Status 由 statusForProject 推导。
export function planProjectCard({ name, lifecycle, priority }, attention = {}) {
  const plan = { Project: name, Kind: '项目', Lifecycle: lifecycle, Priority: priority };
  plan.Status = statusForProject({ lifecycle, openAttentionIssues: attention.openAttentionIssues ?? 0 });
  return Object.fromEntries(Object.entries(plan).filter(([, value]) => value));
}

// issue 分类：标题或标签命中风险关键词 → 风险，否则 → 任务。
export function classifyIssue(issue, riskKeywords) {
  const haystack = [issue.title, ...(issue.labels ?? []).map((label) => label.name ?? label)].join(' ').toLowerCase();
  return riskKeywords.some((keyword) => haystack.includes(keyword.toLowerCase())) ? '风险' : '任务';
}

// 统计每个项目有多少未关闭的「需要关注」issue（风险 + 任务，不含项目卡片自己）
export function countAttention(issuesByProject) {
  return Object.fromEntries(
    Object.entries(issuesByProject).map(([project, issues]) => [
      project,
      { openAttentionIssues: issues.filter((issue) => issue.kind === '风险' || issue.kind === '任务').length },
    ])
  );
}
