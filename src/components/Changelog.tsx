import React from 'react';
import { History, GitCommit } from 'lucide-react';

interface ChangelogItem {
  version: string;
  features: string[];
  date: string;
}

const changelogData: ChangelogItem[] = [
  {
    version: 'v1.5.0',
    date: '2026-02-09',
    features: [
      'Markdown 内容校验集成：新增保存前的语法内容校验，自动检测未闭合代码块与空的 Mermaid 图表块，保障文档结构严谨',
      '全量进度反馈系统：重构并统一了文件保存与 HTML 导出的进度反馈 UI，支持细粒度的执行状态展示与错误溯源',
      '编辑器交互深度优化：优化了退出编辑模式的逻辑，支持自动从磁盘同步最新内容，并完善了快捷键保存的反馈机制',
      '全局状态通知增强：集成了响应式 Toast 通知系统，确保保存、导出及各类异常操作均有即时、清晰的视觉反馈',
      '离线导出性能提升：优化了图片 Base64 转换与静态资源离线化的处理性能，并适配了导出过程中的实时进度追踪',
      '代码架构模块化升级：移除了冗余的组件定义，完成了公共 UI 模块（如 ProgressModal）的解耦，大幅提升了代码的可维护性'
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-02-06',
    features: [
      '离线化 HTML 导出：支持图片自动 Base64 转换与静态资源离线化，生成完全自包含的单文件，并适配主题自适应切换',
      '中文标题跳转优化：重构 Slug 生成算法以完美支持中文标题锚点，实现 TOC 与文档内容的平滑滚动定位',
      '渲染稳定性增强：为图片引入预加载占位容器与 Lazy-loading，有效防止因图片异步加载引起的页面布局抖动 (Layout Shift)',
      '极致渲染性能：集成 Mermaid 渲染结果缓存机制，并结合 ECharts 的 ResizeObserver 响应式监听，大幅提升图表处理效率',
      '表格交互升级：集成 Tablesort 插件支持点击表头实时排序，并针对表格容器增加了响应式水平滚动与阴影样式',
      '交互细节打磨：新增全局“返回顶部”悬浮按钮，优化 Markdown 预览区域的行间距与排版细节'
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-02-05',
    features: [
      '核心编辑器增强：集成 Monaco Editor，支持双向同步滚动、快捷键保存及中文输入 (IME) 优化',
      '预览反向跳转：支持点击预览区域或选取文字，自动定位并高亮编辑器中对应的代码段',
      'Markdown 渲染升级：深度支持数学公式 (KaTeX)、脚注、任务列表、目录生成 (TOC) 等高级语法',
      '多维图表集成：内置 Mermaid、PlantUML 流程图与 ECharts 数据图表渲染能力',
      '导出与发布：集成 GitHub Actions 实现自动化部署至 GitHub Pages',
      '安全与校验：引入 .md.bak 备份机制，新增 Markdown 语法内容校验（如未闭合代码块检测）',
      'UI/UX 全面优化：引入平滑过渡动画、自定义滚动条与全局 Toast 通知系统',
      '架构重构：完成核心逻辑解耦，优化大文件处理性能，并适配二级目录部署环境'
    ]
  },
  {
    version: 'v1.2.0',
    date: '2026-02-02',
    features: [
      '优化编辑器架构，提升大文件处理性能',
      '修复 Monaco 编辑器在特定情况下的类型错误',
      '改进组件间的状态管理逻辑',
      '清理冗余代码与测试文件，减小打包体积'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-01-25',
    features: [
      '集成 GitHub Actions 自动化部署流程',
      '增强预览界面的同步滚动精度',
      '修复预览区域内容渲染不及时的问题'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-01-10',
    features: [
      'Super-MDEditor 初始版本发布',
      '支持本地文件系统读写，实现即时保存',
      '深度集成 Monaco Editor，提供丝滑编辑体验',
      '内置实时 Markdown 预览与数学公式渲染支持'
    ]
  }
];

export const Changelog: React.FC = () => {
  return (
    <div className="absolute top-6 right-6 bottom-6 w-80 bg-white dark:bg-secondary-800 shadow-2xl rounded-2xl border border-secondary-100 dark:border-secondary-700 flex flex-col overflow-hidden animate-slide-in-right z-50">
      <div className="flex items-center gap-2 p-4 border-b border-secondary-100 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-800/50">
        <History className="text-primary-600 dark:text-primary-400" size={16} />
        <h2 className="text-base font-bold text-secondary-900 dark:text-secondary-100">功能更新日志</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-8">
          {changelogData.map((item) => (
            <div key={item.version} className="relative pl-6 before:absolute before:left-2 before:top-2.5 before:bottom-[-32px] before:w-[1.5px] before:bg-secondary-100 dark:before:bg-secondary-700 last:before:hidden">
              <div className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 z-10">
                <GitCommit size={10} />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full flex items-center h-5">
                    {item.version}
                  </span>
                  <span className="text-[10px] text-secondary-400 dark:text-secondary-500 whitespace-nowrap">
                    {item.date}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="text-secondary-700 dark:text-secondary-300 text-xs leading-relaxed flex items-start gap-1.5">
                      <span className="text-primary-400/70 shrink-0 flex items-center justify-center w-1 h-[1.625em]">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
