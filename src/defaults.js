(() => {
  const DEFAULT_GLOSSARY = [
    "repository = 仓库",
    "repo = 仓库",
    "pull request = 拉取请求",
    "PR = 拉取请求",
    "merge request = 合并请求",
    "issue = 议题",
    "discussion = 讨论",
    "fork = 派生",
    "star = 星标",
    "watch = 关注",
    "commit = 提交",
    "branch = 分支",
    "tag = 标签",
    "release = 发布版本",
    "artifact = 构件",
    "runner = 运行器",
    "workflow = 工作流",
    "GitHub Actions = GitHub Actions",
    "Codespaces = Codespaces",
    "Copilot = Copilot",
    "Dependabot = Dependabot",
    "secret = 密钥",
    "environment = 环境",
    "deploy = 部署",
    "deployment = 部署",
    "package = 软件包",
    "maintainer = 维护者",
    "contributor = 贡献者",
    "breaking change = 破坏性变更",
    "backward compatible = 向后兼容",
    "agent = 智能体",
    "AI agent = AI 智能体",
    "agentic workflow = 智能体工作流",
    "LLM = 大语言模型",
    "large language model = 大语言模型",
    "foundation model = 基础模型",
    "multimodal = 多模态",
    "prompt = 提示词",
    "system prompt = 系统提示词",
    "prompt engineering = 提示词工程",
    "RAG = 检索增强生成",
    "retrieval augmented generation = 检索增强生成",
    "embedding = 嵌入向量",
    "vector database = 向量数据库",
    "context window = 上下文窗口",
    "tool calling = 工具调用",
    "function calling = 函数调用",
    "MCP = 模型上下文协议",
    "Model Context Protocol = 模型上下文协议",
    "inference = 推理",
    "fine-tuning = 微调",
    "alignment = 对齐",
    "hallucination = 幻觉",
    "token = token",
    "checkpoint = 检查点",
    "quantization = 量化",
    "distillation = 蒸馏",
    "LoRA = LoRA",
    "API = API",
    "SDK = SDK",
    "CLI = CLI",
    "README = README"
  ].join("\n");

  const DEFAULT_PROTECTED_TERMS = [
    "GitHub",
    "OpenAI",
    "ChatGPT",
    "GPT-4.1",
    "GPT-4o",
    "Claude",
    "Gemini",
    "Qwen",
    "Qwen2.5",
    "Llama",
    "LangChain",
    "LlamaIndex",
    "Hugging Face",
    "Transformers",
    "PyTorch",
    "TensorFlow",
    "React",
    "Next.js",
    "Vite",
    "TypeScript",
    "JavaScript",
    "Python",
    "Node.js",
    "npm",
    "pnpm",
    "yarn",
    "Docker",
    "Kubernetes",
    "PostgreSQL",
    "Redis",
    "SQLite"
  ].join("\n");

  const DEFAULT_SETTINGS = {
    enabled: true,
    translateUi: true,
    translateLongText: true,
    mode: "bilingual",
    maxBlocksPerRun: 32,
    ai: {
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "",
      useJsonMode: true
    },
    glossary: DEFAULT_GLOSSARY,
    protectProperNouns: true,
    protectedTerms: DEFAULT_PROTECTED_TERMS
  };

  const AI_PRESETS = [
    {
      id: "deepseek-v4-flash",
      label: "DeepSeek V4 Flash",
      description: "低成本 OpenAI-compatible 翻译，官方 Base URL",
      ai: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
        useJsonMode: true
      }
    },
    {
      id: "openai-gpt-4-1-mini",
      label: "OpenAI GPT-4.1 mini",
      description: "默认 OpenAI API 配置，适合稳定通用翻译",
      ai: {
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1-mini",
        useJsonMode: true
      }
    },
    {
      id: "local-openai-compatible",
      label: "本地兼容端点",
      description: "Ollama、LM Studio 或 LocalAI；API Key 可留空",
      ai: {
        baseUrl: "http://127.0.0.1:11434/v1",
        model: "qwen2.5:7b-instruct",
        useJsonMode: true
      }
    }
  ];

  const UI_DICTIONARY = {
    "About": "关于",
    "Actions": "自动化",
    "Activity": "活动",
    "Add file": "添加文件",
    "Add new filter": "添加新筛选器",
    "Add this repository to a list": "把此仓库加入列表",
    "All": "全部",
    "All activity": "全部活动",
    "All issues": "全部议题",
    "All pull requests": "全部拉取请求",
    "All repositories": "全部仓库",
    "All workflows": "全部工作流",
    "Achievements": "成就",
    "Archive": "归档",
    "Archived": "已归档",
    "Agents": "智能体",
    "Appearance": "外观",
    "Accessibility": "无障碍",
    "Assigned": "分配给我",
    "Assignees": "负责人",
    "Author": "作者",
    "Billing": "账单",
    "Blame": "逐行追溯",
    "Branches": "分支",
    "Browse files": "浏览文件",
    "Built by": "构建者",
    "Cancel": "取消",
    "Changes": "更改",
    "Chat with Copilot": "与 Copilot 对话",
    "Checks": "检查",
    "Clear": "清除",
    "Closed": "已关闭",
    "Code": "代码",
    "Code of conduct": "行为准则",
    "Code scanning": "代码扫描",
    "Code scanning alerts": "代码扫描警报",
    "Codespaces": "Codespaces",
    "Comment": "评论",
    "Comments": "评论",
    "Commits": "提交",
    "Compare": "比较",
    "Compare & pull request": "比较并创建拉取请求",
    "Compare changes": "比较更改",
    "Confirm": "确认",
    "Conversation": "对话",
    "Copied!": "已复制",
    "Contributors": "贡献者",
    "contributors": "贡献者",
    "Contributing": "贡献指南",
    "Copy": "复制",
    "Create a new repository": "创建新仓库",
    "Create new...": "新建...",
    "Create codespace on main": "在 main 上创建 Codespace",
    "Create fork": "创建派生仓库",
    "Create issue": "创建议题",
    "Create new file": "创建新文件",
    "Create pull request": "创建拉取请求",
    "Custom properties": "自定义属性",
    "Dashboard": "仪表盘",
    "Date": "日期",
    "Date range:": "日期范围：",
    "Date range: Any": "日期范围：任意",
    "Date range: Today": "日期范围：今天",
    "Delete": "删除",
    "Dependabot": "Dependabot",
    "Dependabot alerts": "Dependabot 警报",
    "Deployments": "部署",
    "Description": "描述",
    "Discussions": "讨论",
    "Download ZIP": "下载 ZIP",
    "Download": "下载",
    "Draft": "草稿",
    "Developers": "开发者",
    "Dismiss": "忽略",
    "Docs": "文档",
    "Done": "完成",
    "Edit": "编辑",
    "Email address": "邮箱地址",
    "Environments": "环境",
    "Enterprise": "企业",
    "Enterprises": "企业",
    "Events": "活动",
    "Explore": "探索",
    "Feed": "动态",
    "Files": "文件",
    "Files changed": "文件变更",
    "Filter": "筛选",
    "Filters": "筛选器",
    "Find a repository": "查找仓库",
    "Find file": "查找文件",
    "Folders and files": "文件夹和文件",
    "Followers": "关注者",
    "Following": "正在关注",
    "Forgot password?": "忘记密码？",
    "Folders": "文件夹",
    "Fork": "派生",
    "Forks": "派生",
    "forks": "派生",
    "General": "常规",
    "Go to file": "转到文件",
    "Get started": "开始使用",
    "Gists": "Gists",
    "GitHub Sponsors": "GitHub 赞助",
    "Group by: Date": "按日期分组",
    "History": "历史",
    "Home": "首页",
    "Homepage": "首页",
    "Import repository": "导入仓库",
    "Inbox": "收件箱",
    "Insights": "洞察",
    "Issues": "议题",
    "Labels": "标签",
    "Language": "语言",
    "Languages": "语言",
    "Language:": "编程语言：",
    "Language: Any": "编程语言：任意",
    "Latest commit": "最新提交",
    "Latest": "最新",
    "Last commit date": "最后提交日期",
    "Last commit message": "最后提交信息",
    "Learn more": "了解更多",
    "Learn more about GitHub Sponsors": "了解 GitHub 赞助",
    "Leave a comment": "发表评论",
    "License": "许可证",
    "Marketplace": "市场",
    "Members": "成员",
    "Mentioned": "提及我",
    "Merged": "已合并",
    "Milestone": "里程碑",
    "Milestones": "里程碑",
    "Lists": "列表",
    "New": "新建",
    "New issue": "新建议题",
    "MCP registry": "MCP 注册表",
    "New organization": "新建组织",
    "New project": "新建项目",
    "New repository": "新建仓库",
    "New workflow": "新建工作流",
    "Notifications": "通知",
    "Notifications by date": "按日期显示通知",
    "Newest to oldest": "从新到旧",
    "Open": "打开",
    "Open Source": "开源",
    "Open codespace": "打开 Codespace",
    "Open in Codespaces": "在 Codespaces 中打开",
    "Open in GitHub Desktop": "在 GitHub Desktop 中打开",
    "Open with": "打开方式",
    "Open with GitHub Desktop": "用 GitHub Desktop 打开",
    "Open Copilot...": "打开 Copilot...",
    "Open menu": "打开菜单",
    "Open user navigation menu": "打开用户导航菜单",
    "Opened": "已打开",
    "Organizations": "组织",
    "Overview": "概览",
    "Participating": "我参与的",
    "Packages": "软件包",
    "Password": "密码",
    "Platform": "平台",
    "Pinned": "已固定",
    "Popular repositories": "热门仓库",
    "Preview": "预览",
    "Profile": "个人资料",
    "Pricing": "定价",
    "Private": "私有",
    "Projects": "项目",
    "Public": "公开",
    "Pull request": "拉取请求",
    "Pull requests": "拉取请求",
    "Pulse": "脉冲",
    "Raw": "原始内容",
    "README": "README",
    "Readme": "README",
    "Read more": "阅读更多",
    "Ready for review": "准备好审查",
    "Re-run jobs": "重新运行作业",
    "Reopen issue": "重新打开议题",
    "Report repository": "举报仓库",
    "Releases": "发布版本",
    "Repository": "仓库",
    "Repository files navigation": "仓库文件导航",
    "Repository navigation": "仓库导航",
    "Repositories": "仓库",
    "Resources": "资源",
    "Review requested": "请求我审查",
    "Review changes": "审查更改",
    "Review required": "需要审查",
    "Rules": "规则",
    "Run workflow": "运行工作流",
    "Save": "保存",
    "Saved": "已保存",
    "Search": "搜索",
    "Search all of GitHub": "搜索整个 GitHub",
    "Search notifications": "搜索通知",
    "Search or jump to...": "搜索或跳转到...",
    "Search for repositories": "搜索仓库",
    "Search stars": "搜索星标",
    "Secrets": "密钥",
    "Secrets and variables": "密钥和变量",
    "Secret scanning alerts": "密钥扫描警报",
    "Security": "安全",
    "Security and quality": "安全与质量",
    "Security advisories": "安全公告",
    "Security overview": "安全概览",
    "Security policy": "安全策略",
    "Settings": "设置",
    "See more trending repositories": "查看更多趋势仓库",
    "See what the GitHub community is most excited about today.": "看看 GitHub 社区今天最关注什么。",
    "Select all": "全选",
    "Sign in": "登录",
    "Sign out": "退出登录",
    "Sign up": "注册",
    "Solutions": "解决方案",
    "Sponsor": "赞助",
    "Sponsor this project": "赞助此项目",
    "Sponsors": "赞助者",
    "Spoken Language:": "自然语言：",
    "Spoken Language: Any": "自然语言：任意",
    "Star": "星标",
    "Starred": "已星标",
    "Star this repository": "给本仓库加星标",
    "Stars": "星标",
    "stars": "星标",
    "Submit new issue": "提交新议题",
    "Switch branches or tags": "切换分支或标签",
    "Tags": "标签",
    "Teams": "团队",
    "Team mentioned": "团队被提及",
    "Terms": "条款",
    "This branch": "此分支",
    "This repository": "本仓库",
    "Topics": "主题",
    "Top repositories": "常用仓库",
    "Today": "今天",
    "Trending": "趋势",
    "Trending developers": "趋势开发者",
    "Trending repositories": "趋势仓库",
    "Trending repositories today": "今日趋势仓库",
    "Try Enterprise": "试用 Enterprise",
    "Type:": "类型：",
    "Type: All": "类型：全部",
    "Type / to search": "输入 / 搜索",
    "Unarchive": "取消归档",
    "Unfork": "取消派生",
    "Unpin": "取消固定",
    "Unstar": "取消星标",
    "Unstar this repository": "取消本仓库星标",
    "Unwatch": "取消关注",
    "Updated": "已更新",
    "Unread": "未读",
    "Upload files": "上传文件",
    "Users": "用户",
    "Variables": "变量",
    "View all": "查看全部",
    "View license": "查看许可证",
    "Watch": "关注",
    "Watchers": "关注者",
    "Watching": "正在关注",
    "watching": "关注者",
    "Webhooks": "Webhooks",
    "Wiki": "Wiki",
    "Write": "编写",
    "Write code": "编写代码",
    "Ask": "提问",
    "Any": "任意",
    "Close user navigation menu": "关闭用户导航菜单",
    "Clear out the clutter.": "清理杂乱通知。",
    "Collections": "集合",
    "Community": "社区",
    "Contact": "联系",
    "Copilot settings": "Copilot 设置",
    "Feature preview": "功能预览",
    "Footer": "页脚",
    "Footer navigation": "页脚导航",
    "Free": "免费",
    "Manage cookies": "管理 Cookie",
    "Manage notifications": "管理通知",
    "Privacy": "隐私",
    "Set status": "设置状态",
    "Single sign-on": "单点登录",
    "Sort": "排序",
    "Sort by: Recently starred": "排序：最近星标",
    "Sort by: Newest to oldest": "排序：从新到旧",
    "Status": "状态",
    "Try Enterprise Free": "免费试用 Enterprise",
    "You have unread notifications": "你有未读通知",
    "Name": "名称",
    "Your codespaces": "你的 Codespaces",
    "Your discussions": "你的讨论",
    "Your enterprises": "你的企业",
    "Your gists": "你的 Gists",
    "Your issues": "你的议题",
    "Your organizations": "你的组织",
    "Your profile": "你的个人资料",
    "Your projects": "你的项目",
    "Your repositories": "你的仓库",
    "Your sponsors": "你的赞助",
    "Your stars": "你的星标",
    "Your Stars": "你的星标",
    "Showing results": "显示结果",
    "Recently starred": "最近星标",
    "Change your avatar": "更改头像",
    "User navigation": "用户导航",
    "No description, website, or topics provided.": "未提供描述、网站或主题。"
  };

  const UNIT_MAP = {
    second: "秒",
    seconds: "秒",
    minute: "分钟",
    minutes: "分钟",
    hour: "小时",
    hours: "小时",
    day: "天",
    days: "天",
    week: "周",
    weeks: "周",
    month: "个月",
    months: "个月",
    year: "年",
    years: "年"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeSettings(stored) {
    const base = clone(DEFAULT_SETTINGS);
    if (!stored || typeof stored !== "object") return base;
    const next = { ...base, ...stored };
    next.ai = { ...base.ai, ...(stored.ai || {}) };
    if (typeof next.glossary !== "string") next.glossary = DEFAULT_GLOSSARY;
    if (typeof next.protectedTerms !== "string") next.protectedTerms = DEFAULT_PROTECTED_TERMS;
    if (typeof next.protectProperNouns !== "boolean") next.protectProperNouns = true;
    if (!Number.isFinite(next.maxBlocksPerRun)) next.maxBlocksPerRun = base.maxBlocksPerRun;
    return next;
  }

  function normalizeLabel(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  function translatePattern(core) {
    let match = core.match(/^(\d[\d,.kKmM]*)\s+stars?$/i);
    if (match) return `${match[1]} 星标`;
    match = core.match(/^star\s+(\d[\d,.kKmM]*)$/i);
    if (match) return `${match[1]} 星标`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+forks?$/i);
    if (match) return `${match[1]} 派生`;
    match = core.match(/^fork\s+(\d[\d,.kKmM]*)$/i);
    if (match) return `${match[1]} 派生`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+watch(?:ing|ers)?$/i);
    if (match) return `${match[1]} 关注者`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+commits?$/i);
    if (match) return `${match[1]} 次提交`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+repositories?$/i);
    if (match) return `${match[1]} 个仓库`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+followers?$/i);
    if (match) return `${match[1]} 关注者`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+following$/i);
    if (match) return `${match[1]} 正在关注`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+changed files?$/i);
    if (match) return `${match[1]} 个变更文件`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+conversations?$/i);
    if (match) return `${match[1]} 条对话`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+branches?$/i);
    if (match) return `${match[1]} 个分支`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+tags?$/i);
    if (match) return `${match[1]} 个标签`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+open$/i);
    if (match) return `${match[1]} 个未关闭`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+closed$/i);
    if (match) return `${match[1]} 个已关闭`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+merged$/i);
    if (match) return `${match[1]} 个已合并`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+results?$/i);
    if (match) return `${match[1]} 个结果`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+stars?\s+today$/i);
    if (match) return `今天 ${match[1]} 个星标`;
    match = core.match(/^(\d[\d,.kKmM]*)\s+users?\s+starred\s+this\s+repository$/i);
    if (match) return `${match[1]} 位用户已星标此仓库`;
    match = core.match(/^Sponsor\s+(.+)$/i);
    if (match) return `赞助 ${match[1]}`;
    match = core.match(/^Showing\s+(\d+)-(\d+)\s+of\s+(\d+)\s+items?$/i);
    if (match) return `显示第 ${match[1]}-${match[2]} 项，共 ${match[3]} 项`;
    match = core.match(/^\+\s*(\d[\d,.kKmM]*)\s+contributors?$/i);
    if (match) return `+ ${match[1]} 位贡献者`;
    match = core.match(/^\+\s*more\s+deployments$/i);
    if (match) return "+ 更多部署";
    match = core.match(/^Updated\s+(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago$/i);
    if (match) return `${match[1]} ${UNIT_MAP[match[2].toLowerCase()] || match[2]}前更新`;
    match = core.match(/^(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago$/i);
    if (match) return `${match[1]} ${UNIT_MAP[match[2].toLowerCase()] || match[2]}前`;
    if (/^Updated yesterday$/i.test(core)) return "昨天更新";
    if (/^Updated last week$/i.test(core)) return "上周更新";
    if (/^Updated last month$/i.test(core)) return "上个月更新";
    if (/^Updated last year$/i.test(core)) return "去年更新";
    if (/^last week$/i.test(core)) return "上周";
    if (/^last month$/i.test(core)) return "上个月";
    if (/^last year$/i.test(core)) return "去年";
    return "";
  }

  function translateUiText(text) {
    const leading = String(text || "").match(/^\s*/)?.[0] || "";
    const trailing = String(text || "").match(/\s*$/)?.[0] || "";
    const core = normalizeLabel(text);
    if (!core) return "";
    const direct = UI_DICTIONARY[core] || translatePattern(core);
    return direct ? `${leading}${direct}${trailing}` : "";
  }

  function parseGlossary(glossaryText) {
    return String(glossaryText || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s*=\s*/);
        if (parts.length < 2) return null;
        return { source: parts[0].trim(), target: parts.slice(1).join(" = ").trim() };
      })
      .filter((entry) => entry && entry.source && entry.target);
  }

  function parseProtectedTerms(termsText) {
    return String(termsText || "")
      .split(/\r?\n|,/)
      .map((term) => term.trim())
      .filter(Boolean)
      .filter((term, index, terms) => terms.indexOf(term) === index);
  }

  function looksLikeProtectedName(token) {
    const value = String(token || "").trim();
    if (!value || value.length < 2 || value.length > 72) return false;
    if (/^[a-f0-9]{7,40}$/i.test(value)) return true;
    if (/^[@#]?[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value)) return true;
    if (/^@?[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value) && /[A-Z0-9_.-]/.test(value.slice(1))) return true;
    if (/^[A-Za-z][A-Za-z0-9_.-]*(?:\.[A-Za-z0-9_.-]+)+$/.test(value)) return true;
    return false;
  }

  function extractProtectedTerms(text) {
    const source = String(text || "");
    const matches = source.match(/@?[A-Za-z0-9][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9][A-Za-z0-9_.-]*)?|[A-Za-z][A-Za-z0-9_.-]*(?:\.[A-Za-z0-9_.-]+)+/g) || [];
    return matches.filter(looksLikeProtectedName);
  }

  function hashString(input) {
    let hash = 2166136261;
    const text = String(input || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function isLocalBaseUrl(baseUrl) {
    try {
      const url = new URL(baseUrl);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch (error) {
      return false;
    }
  }

  function hasAiConfig(settings) {
    const ai = settings?.ai || {};
    if (!ai.baseUrl || !ai.model) return false;
    return Boolean(ai.apiKey || isLocalBaseUrl(ai.baseUrl));
  }

  globalThis.GHZH_DEFAULTS = {
    DEFAULT_SETTINGS,
    DEFAULT_GLOSSARY,
    DEFAULT_PROTECTED_TERMS,
    AI_PRESETS,
    UI_DICTIONARY,
    mergeSettings,
    normalizeLabel,
    translateUiText,
    parseGlossary,
    parseProtectedTerms,
    extractProtectedTerms,
    looksLikeProtectedName,
    hashString,
    hasAiConfig,
    isLocalBaseUrl
  };
})();
