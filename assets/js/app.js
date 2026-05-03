/* ===== 站点目录配置 =====
 * 新增笔记时，在此处添加对应条目即可，无需修改其他文件。
 * path: notes/ 目录下的相对路径（不含 .md 后缀）
 */
const SITE_CONFIG = {
  title: 'Agent 学习笔记',
  nav: [
    {
      section: '基础概念',
      icon: '📖',
      desc: 'Agent 核心概念与原理',
      items: [
        { title: '什么是 Agent', path: 'basics/what-is-agent' },
        { title: 'LLM 与 Agent 的关系', path: 'basics/llm-and-agent' },
        { title: 'ReAct 框架原理', path: 'basics/react-framework' },
      ]
    },
    {
      section: '主流框架',
      icon: '🔧',
      desc: '常用 Agent 框架对比与使用',
      items: [
        { title: 'LangChain 入门', path: 'frameworks/langchain-intro' },
        { title: 'AutoGPT 解析', path: 'frameworks/autogpt' },
        { title: 'CrewAI 多智能体', path: 'frameworks/crewai' },
      ]
    },
    {
      section: '实战笔记',
      icon: '🚀',
      desc: '动手实践与项目经验',
      items: [
        { title: '构建第一个 Agent', path: 'practice/first-agent' },
        { title: 'Tool Use 实战', path: 'practice/tool-use' },
        { title: 'Memory 机制设计', path: 'practice/memory-design' },
      ]
    },
  ]
};

/* ===== 主题管理 ===== */
const ThemeManager = {
  key: 'theme',
  init() {
    const saved = localStorage.getItem(this.key) || 'light';
    this.apply(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.apply(next);
    localStorage.setItem(this.key, next);
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    // highlight.js 主题切换
    document.getElementById('hljs-theme-light').disabled = (theme === 'dark');
    document.getElementById('hljs-theme-dark').disabled = (theme === 'light');
  }
};

/* ===== 侧边栏管理 ===== */
const SidebarManager = {
  init() {
    this.render();
    document.getElementById('sidebarToggle').addEventListener('click', () => this.toggle());
    document.getElementById('sidebarOverlay').addEventListener('click', () => this.close());
  },
  render() {
    const container = document.getElementById('navContent');
    let html = '';
    SITE_CONFIG.nav.forEach(group => {
      html += `<div class="nav-section">
        <div class="nav-section-title">${group.section}</div>
        <ul class="nav-list nav-sub">`;
      group.items.forEach(item => {
        html += `<li>
          <a class="nav-item" href="#${item.path}" onclick="loadNote('${item.path}', this)">${item.title}</a>
        </li>`;
      });
      html += `</ul></div>`;
    });
    container.innerHTML = html;
  },
  toggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  },
  close() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  },
  setActive(path) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`.nav-item[href="#${path}"]`);
    if (target) target.classList.add('active');
  }
};

/* ===== Markdown 渲染 ===== */
function setupMarked() {
  marked.setOptions({
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
  });
}

/* ===== 内容加载 ===== */
function setContent(html) {
  document.getElementById('mainContent').innerHTML = html;
  // 重新高亮代码块
  document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
  // 移动端关闭侧边栏
  SidebarManager.close();
  // 滚动到顶部
  window.scrollTo(0, 0);
}

function loadHome() {
  SidebarManager.setActive('');
  // 更新 hash
  history.pushState(null, '', '#');

  let cardsHtml = SITE_CONFIG.nav.map(group => `
    <div class="card" onclick="loadNote('${group.items[0].path}', null)">
      <div class="card-icon">${group.icon}</div>
      <div class="card-title">${group.section}</div>
      <div class="card-desc">${group.desc}</div>
    </div>
  `).join('');

  setContent(`
    <div class="home-hero">
      <div class="emoji">🤖</div>
      <h1>Agent 学习笔记</h1>
      <p>记录 AI Agent 学习过程中的概念、框架与实战经验</p>
    </div>
    <div class="card-grid">${cardsHtml}</div>
  `);
}

async function loadNote(path, linkEl) {
  SidebarManager.setActive(path);
  history.pushState(null, '', `#${path}`);

  setContent(`<div class="loading">⏳ 加载中...</div>`);

  try {
    const res = await fetch(`notes/${path}.md`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // 解析 frontmatter（--- ... --- 格式）
    let meta = { title: '', date: '', tags: [] };
    let content = text;
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      const fm = fmMatch[1];
      content = fmMatch[2];
      meta.title = (fm.match(/^title:\s*(.+)$/m) || [])[1] || '';
      meta.date = (fm.match(/^date:\s*(.+)$/m) || [])[1] || '';
      const tagsMatch = fm.match(/^tags:\s*\[(.+)\]$/m);
      if (tagsMatch) meta.tags = tagsMatch[1].split(',').map(t => t.trim());
    }

    const tagsHtml = meta.tags.map(t => `<span class="post-tag">${t}</span>`).join('');
    const metaHtml = (meta.date || meta.tags.length)
      ? `<div class="post-meta">
          ${meta.date ? `<span>📅 ${meta.date}</span>` : ''}
          ${tagsHtml}
         </div>`
      : '';

    setContent(`
      <article class="markdown-body">
        ${metaHtml}
        ${marked.parse(content)}
      </article>
    `);
  } catch (e) {
    setContent(`
      <div class="markdown-body">
        <h1>页面未找到</h1>
        <p>笔记 <code>${path}.md</code> 尚未创建，请先添加对应的 Markdown 文件。</p>
      </div>
    `);
  }
}

/* ===== 路由处理 ===== */
function handleRoute() {
  const hash = location.hash.slice(1); // 去掉 #
  if (hash && hash !== '/') {
    loadNote(hash, null);
  } else {
    loadHome();
  }
}

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  setupMarked();
  SidebarManager.init();

  document.getElementById('themeToggle').addEventListener('click', () => ThemeManager.toggle());

  // 处理浏览器前进/后退
  window.addEventListener('popstate', handleRoute);

  // 初始路由
  handleRoute();
});
