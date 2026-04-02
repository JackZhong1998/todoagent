import React from 'react';

type Props = {
  isZh: boolean;
};

/** 官网用：待办 + Agent 对话 + AI 替代性评估 三栏示意图（SVG） */
export const ProductWorkspaceIllustration: React.FC<Props> = ({ isZh }) => {
  const L = isZh
    ? {
        todo: '待办',
        agent: 'Agent',
        rep: 'AI 替代性',
        line1: '整理本周目标与交付物',
        line2: '评审需求文档 v2',
        line3: '（已完成 · 已分析）',
        chatHdr: '当前任务 · 对话',
        usr: '把这条拆成可执行步骤？',
        ai: '可先列三个检查点，再⋯',
        repHdr: '完成项评估',
        r1: '可替代',
        r2: '不可替代',
        r3: '待观察',
        aria: 'TodoAgent 产品界面示意图：待办列表、Agent 对话、AI 替代性评估',
      }
    : {
        todo: 'To-do',
        agent: 'Agent',
        rep: 'AI replaceability',
        line1: 'Shape weekly goals & deliverables',
        line2: 'Review requirements doc v2',
        line3: '(Done · analyzed)',
        chatHdr: 'Task chat',
        usr: 'Break this into concrete steps?',
        ai: 'Start with three checkpoints, then…',
        repHdr: 'Completed tasks',
        r1: 'Replaceable',
        r2: 'Not replaceable',
        r3: 'Unclear',
        aria: 'TodoAgent product mockup: todo list, Agent chat, AI replaceability',
      };

  return (
    <figure className="mt-10 w-full">
      <div className="rounded-2xl border border-neutral-200/90 bg-[#fafafa] p-3 sm:p-5 shadow-sm">
        <svg
          viewBox="0 0 880 300"
          className="w-full h-auto"
          role="img"
          aria-label={L.aria}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="8" width="864" height="284" rx="14" fill="#ffffff" stroke="#e5e5e5" strokeWidth="1" />

          {/* column guides */}
          <line x1="298" y1="24" x2="298" y2="276" stroke="#f0f0f0" strokeWidth="1" />
          <line x1="583" y1="24" x2="583" y2="276" stroke="#f0f0f0" strokeWidth="1" />

          {/* —— Todo column —— */}
          <text x="24" y="40" fill="#a3a3a3" fontSize="11" fontWeight="600" letterSpacing="0.06em" fontFamily="system-ui,sans-serif">
            {L.todo}
          </text>
          <rect x="20" y="52" width="258" height="40" rx="8" fill="#fafafa" stroke="#eeeeee" strokeWidth="1" />
          <rect x="32" y="66" width="12" height="12" rx="3" fill="#fff" stroke="#d4d4d4" strokeWidth="1" />
          <text x="52" y="76" fill="#404040" fontSize="12" fontFamily="system-ui,sans-serif">
            {L.line1}
          </text>

          <rect x="20" y="100" width="258" height="40" rx="8" fill="#fafafa" stroke="#eeeeee" strokeWidth="1" />
          <rect x="32" y="114" width="12" height="12" rx="3" fill="#fff" stroke="#d4d4d4" strokeWidth="1" />
          <text x="52" y="124" fill="#404040" fontSize="12" fontFamily="system-ui,sans-serif">
            {L.line2}
          </text>

          <rect x="20" y="148" width="258" height="40" rx="8" fill="#f5f5f5" stroke="#e5e5e5" strokeWidth="1.5" />
          <rect x="32" y="162" width="12" height="12" rx="3" fill="#171717" stroke="#171717" strokeWidth="1" />
          <path d="M36 167 L38 169.5 L43 164" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <text x="52" y="172" fill="#171717" fontSize="12" fontWeight="600" fontFamily="system-ui,sans-serif">
            {L.line3}
          </text>

          {/* —— Agent column —— */}
          <text x="312" y="40" fill="#a3a3a3" fontSize="11" fontWeight="600" letterSpacing="0.06em" fontFamily="system-ui,sans-serif">
            {L.agent}
          </text>
          <text x="312" y="58" fill="#737373" fontSize="10" fontFamily="system-ui,sans-serif">
            {L.chatHdr}
          </text>
          <rect x="310" y="68" width="255" height="36" rx="10" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
          <text x="322" y="90" fill="#3f3f46" fontSize="11" fontFamily="system-ui,sans-serif">
            {L.usr}
          </text>
          <rect x="310" y="114" width="255" height="44" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1" />
          <text x="322" y="134" fill="#52525b" fontSize="11" fontFamily="system-ui,sans-serif">
            {L.ai}
          </text>
          <rect x="310" y="172" width="255" height="28" rx="8" fill="#ffffff" stroke="#d4d4d4" strokeWidth="1" strokeDasharray="4 3" />
          <text x="322" y="190" fill="#a1a1aa" fontSize="10" fontFamily="system-ui,sans-serif">
            ⋯
          </text>

          {/* —— Replaceability column —— */}
          <text x="598" y="40" fill="#a3a3a3" fontSize="11" fontWeight="600" letterSpacing="0.06em" fontFamily="system-ui,sans-serif">
            {L.rep}
          </text>
          <text x="598" y="58" fill="#737373" fontSize="10" fontFamily="system-ui,sans-serif">
            {L.repHdr}
          </text>

          <text x="598" y="88" fill="#52525b" fontSize="11" fontFamily="system-ui,sans-serif">
            {L.r1}
          </text>
          <rect x="598" y="94" width="260" height="10" rx="5" fill="#f4f4f5" />
          <rect x="598" y="94" width="198" height="10" rx="5" fill="#525252" />

          <text x="598" y="124" fill="#52525b" fontSize="11" fontFamily="system-ui,sans-serif">
            {L.r2}
          </text>
          <rect x="598" y="130" width="260" height="10" rx="5" fill="#f4f4f5" />
          <rect x="598" y="130" width="124" height="10" rx="5" fill="#737373" />

          <text x="598" y="160" fill="#52525b" fontSize="11" fontFamily="system-ui,sans-serif">
            {L.r3}
          </text>
          <rect x="598" y="166" width="260" height="10" rx="5" fill="#f4f4f5" />
          <rect x="598" y="166" width="48" height="10" rx="5" fill="#a3a3a3" />

          <rect x="598" y="198" width="260" height="64" rx="10" fill="#fafafa" stroke="#eee" strokeWidth="1" />
          <text x="610" y="224" fill="#71717a" fontSize="10" fontFamily="system-ui,sans-serif">
            {isZh ? '单条 todo · 可替代性结论 + 推理摘要' : 'Per-todo verdict + brief rationale'}
          </text>
          <line x1="610" y1="234" x2="846" y2="234" stroke="#e5e5e5" strokeWidth="1" />
          <text x="610" y="252" fill="#a1a1aa" fontSize="9" fontFamily="system-ui,sans-serif">
            {isZh ? '完成标记后自动更新 · 统计页可汇总' : 'Updates on completion · stats overview'}
          </text>
        </svg>
      </div>
    </figure>
  );
};
