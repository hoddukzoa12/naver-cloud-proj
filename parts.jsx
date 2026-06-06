/* parts.jsx — 공통 컴포넌트 (아이콘, 배지, 카드, 경고배너, 스켈레톤, 폼) */

const Icon = {
  search: (p) => (<svg viewBox="0 0 24 24" width={p?.s||20} height={p?.s||20} fill="none"><circle cx="11" cy="11" r="7" stroke={p?.c||'currentColor'} strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round"/></svg>),
  filter: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="M3 5h18M6 12h12M10 19h4" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round"/></svg>),
  chevron: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="m9 6 6 6-6 6" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" width={p?.s||22} height={p?.s||22} fill="none"><path d="m15 6-6 6 6 6" stroke={p?.c||'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  external: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H11" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  warning: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="M12 4.5 21 19.5H3L12 4.5Z" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinejoin="round"/><path d="M12 10v4.2" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17.2" r="1.1" fill={p?.c||'currentColor'}/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" width={p?.s||16} height={p?.s||16} fill="none"><path d="m5 12.5 4.5 4.5L19 7" stroke={p?.c||'currentColor'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  sparkle: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="M12 3.5c.6 3.7 1.8 4.9 5.5 5.5-3.7.6-4.9 1.8-5.5 5.5-.6-3.7-1.8-4.9-5.5-5.5 3.7-.6 4.9-1.8 5.5-5.5Z" fill={p?.c||'currentColor'}/><path d="M18.5 14c.3 1.6.8 2.1 2.5 2.5-1.7.4-2.2.9-2.5 2.5-.3-1.6-.8-2.1-2.5-2.5 1.7-.4 2.2-.9 2.5-2.5Z" fill={p?.c||'currentColor'}/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" width={p?.s||16} height={p?.s||16} fill="none"><rect x="4" y="5.5" width="16" height="14" rx="2.5" stroke={p?.c||'currentColor'} strokeWidth="1.8"/><path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke={p?.c||'currentColor'} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  won: (p) => (<svg viewBox="0 0 24 24" width={p?.s||16} height={p?.s||16} fill="none"><path d="M4 8h16M4 11.5h16" stroke={p?.c||'currentColor'} strokeWidth="1.6"/><path d="m5 8 2.4 8L12 9l4.6 7L19 8" stroke={p?.c||'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" width={p?.s||16} height={p?.s||16} fill="none"><rect x="5" y="4" width="14" height="16" rx="1.5" stroke={p?.c||'currentColor'} strokeWidth="1.7"/><path d="M9 8h2M13 8h2M9 11.5h2M13 11.5h2M9 15h2M13 15h2" stroke={p?.c||'currentColor'} strokeWidth="1.6" strokeLinecap="round"/></svg>),
  doc: (p) => (<svg viewBox="0 0 24 24" width={p?.s||16} height={p?.s||16} fill="none"><path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7 3.5Z" stroke={p?.c||'currentColor'} strokeWidth="1.7" strokeLinejoin="round"/><path d="M13.5 3.5V8h4M9 13h6M9 16.5h4" stroke={p?.c||'currentColor'} strokeWidth="1.6" strokeLinecap="round"/></svg>),
  radar: (p) => (<svg viewBox="0 0 24 24" width={p?.s||20} height={p?.s||20} fill="none"><circle cx="12" cy="12" r="8.5" stroke={p?.c||'currentColor'} strokeWidth="1.6" opacity="0.4"/><circle cx="12" cy="12" r="4.5" stroke={p?.c||'currentColor'} strokeWidth="1.6" opacity="0.7"/><path d="M12 12 18 6.5" stroke={p?.c||'currentColor'} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="1.6" fill={p?.c||'currentColor'}/></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" width={p?.s||20} height={p?.s||20} fill="none"><path d="M6 6l12 12M18 6 6 18" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round"/></svg>),
  refresh: (p) => (<svg viewBox="0 0 24 24" width={p?.s||18} height={p?.s||18} fill="none"><path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 4.5V9h-4.5" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 15" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 19.5V15h4.5" stroke={p?.c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  home: (p) => (<svg viewBox="0 0 24 24" width={p?.s||22} height={p?.s||22} fill="none"><path d="M4 11 12 4l8 7" stroke={p?.c||'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.6 9.6V19a1 1 0 0 0 1 1H10v-5h4v5h3.4a1 1 0 0 0 1-1V9.6" stroke={p?.c||'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  bookmark: (p) => (<svg viewBox="0 0 24 24" width={p?.s||22} height={p?.s||22} fill="none"><path d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z" stroke={p?.c||'currentColor'} strokeWidth="1.9" strokeLinejoin="round"/></svg>),
  send: (p) => (<svg viewBox="0 0 24 24" width={p?.s||20} height={p?.s||20} fill="none"><path d="M4.5 11.5 19 5l-6.5 14.5-2.2-6.3-5.8-1.7Z" stroke={p?.c||'currentColor'} strokeWidth="1.9" strokeLinejoin="round" fill={p?.fill||'none'}/></svg>),
  heart: (p) => (<svg viewBox="0 0 24 24" width={p?.s||22} height={p?.s||22} fill="none"><path d="M12 19.5 4.8 12.3a4.3 4.3 0 0 1 6.1-6.05l1.1 1.07 1.1-1.07a4.3 4.3 0 0 1 6.1 6.05L12 19.5Z" stroke={p?.c||'currentColor'} strokeWidth="1.9" strokeLinejoin="round" fill={p?.fill||'none'}/></svg>),
};

function won(n) { return n.toLocaleString('ko-KR') + '원'; }
function dlabel(d) {
  if (d > 0) return `D-${d}`;
  if (d === 0) return 'D-DAY';
  return '마감';
}

function StatusBadge({ status }) {
  const map = {
    '모집중': { c: 'var(--ok)', bg: 'var(--ok-bg)', dot: true },
    '예정':   { c: 'var(--warn)', bg: 'var(--warn-bg)', dot: false },
    '마감':   { c: 'var(--closed)', bg: 'var(--closed-bg)', dot: false },
  };
  const s = map[status] || map['마감'];
  return (
    <span className="sr-badge" style={{ color: s.c, background: s.bg }}>
      {s.dot && <span className="sr-dot" style={{ background: s.c }} />}
      {status}
    </span>
  );
}

function TypeChip({ type }) {
  return <span className="sr-typechip">{type}</span>;
}

function SampleTag() {
  return <span className="sr-sample">샘플</span>;
}

function UnverifiedBanner({ compact }) {
  return (
    <div className={'sr-warnbanner' + (compact ? ' compact' : '')}>
      <span className="sr-warnicon"><Icon.warning s={compact ? 15 : 17} c="var(--alert)" /></span>
      <span className="sr-warntext">
        <strong>미검증 공고</strong>
        {!compact && <> · 공식 공고를 직접 확인하세요</>}
      </span>
    </div>
  );
}

function ScholarshipCard({ item, onClick }) {
  const { ddays } = window.SR_DATA;
  const d = ddays(item.deadline);
  const unv = item.verification_status !== 'verified';
  return (
    <button className="sr-card" onClick={onClick}>
      {unv && <UnverifiedBanner compact />}
      <div className="sr-card-top">
        <StatusBadge status={item.status} />
        <TypeChip type={item.type} />
        <span className="sr-card-dday" data-closed={item.status === '마감'}>
          {item.status === '마감' ? '마감' : dlabel(d)}
        </span>
      </div>
      <div className="sr-card-name">{item.name}</div>
      <div className="sr-card-org">
        <Icon.building s={14} c="var(--muted)" />
        <span>{item.org}</span>
        <SampleTag />
      </div>
      <div className="sr-card-meta">
        <span className="sr-meta-amt">{won(item.amountSemester)}<i>/ 학기</i></span>
        <span className="sr-meta-sep" />
        <span className="sr-meta-dl"><Icon.calendar s={14} c="var(--muted)" />{item.deadline ? item.deadline.slice(5).replace('-', '.') : '미정'} 마감</span>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="sr-card sr-skel" aria-hidden="true">
      <div className="sr-card-top">
        <span className="skel-pill" style={{ width: 56 }} />
        <span className="skel-pill" style={{ width: 40 }} />
      </div>
      <span className="skel-line" style={{ width: '72%', height: 17, marginTop: 4 }} />
      <span className="skel-line" style={{ width: '48%', height: 13, marginTop: 10 }} />
      <div className="sr-card-meta" style={{ marginTop: 14 }}>
        <span className="skel-line" style={{ width: 90, height: 14 }} />
        <span className="skel-line" style={{ width: 70, height: 14 }} />
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="sr-field">
      <span className="sr-field-label">{label}</span>
      {children}
      {hint && <span className="sr-field-hint">{hint}</span>}
    </label>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="sr-seg" role="tablist">
      {options.map(o => (
        <button key={o} role="tab" aria-selected={value === o}
          className={'sr-seg-btn' + (value === o ? ' on' : '')}
          onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function MultiChips({ options, value, onToggle }) {
  return (
    <div className="sr-chips">
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button key={o} className={'sr-chip' + (on ? ' on' : '')} onClick={() => onToggle(o)}>
            {on && <Icon.check s={14} c="#fff" />}{o}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  Icon, won, dlabel, StatusBadge, TypeChip, SampleTag, UnverifiedBanner,
  ScholarshipCard, SkeletonCard, Field, Segmented, MultiChips,
});
