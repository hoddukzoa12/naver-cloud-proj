/* desktop.jsx — 데스크톱 웹 셸 */
const { Icon: DTIcon, ScholarshipCard: DTCard, SkeletonCard: DTSkel,
        Field: DTField, Segmented: DTSeg, MultiChips: DTChips,
        ChatMessage: DTMsg, DetailScreen: DTDetail, SummarySheet: DTSummary } = window;

function DesktopNav({ active, onGo, recruiting }) {
  const tabs = [['chat', 'AI 찾기', 'sparkle'], ['home', '장학금 검색', 'search'], ['saved', '관심 목록', 'bookmark']];
  return (
    <header className="dt-nav">
      <div className="dt-nav-inner">
        <div className="dt-brand">
          <span className="dt-logo"><DTIcon.radar s={22} c="#fff" /></span>
          <span className="dt-brandtxt"><b>장학레이더</b><i>HyperCLOVA X 맞춤 검색</i></span>
          <span className="sr-demoflag">데모</span>
        </div>
        <nav className="dt-navtabs">
          {tabs.map(([id, label, ic]) => {
            const Ic = DTIcon[ic];
            return (
              <button key={id} className={'dt-navtab' + (active === id ? ' on' : '')} onClick={() => onGo(id)}>
                <Ic s={17} c="currentColor" />{label}
              </button>
            );
          })}
        </nav>
        <div className="dt-nav-stat">
          <span className="sr-livedot" /> 모집 중 <b>{recruiting}건</b>
        </div>
      </div>
    </header>
  );
}

function DesktopChat({ messages, thinking, onSend, onOpenCard }) {
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, thinking]);
  const submit = () => { const q = text.trim(); if (!q) return; setText(''); onSend(q); };
  return (
    <div className="dt-chatwrap">
      <div className="dt-chat">
        <div className="dt-chat-head">
          <span className="sr-msg-av"><DTIcon.sparkle s={18} c="#fff" /></span>
          <div><b>AI 맞춤 찾기</b><i>공식 공고를 먼저 확인해 조건에 맞는 장학금을 찾아드려요 · 데모</i></div>
        </div>
        <div className="dt-chat-scroll" ref={scrollRef}>
          {messages.map((m, i) => <DTMsg key={i} msg={m} onOpenCard={onOpenCard} onChip={onSend} />)}
          {thinking &&
            <div className="sr-msg sr-msg-ai">
              <span className="sr-msg-av"><DTIcon.sparkle s={17} c="#fff" /></span>
              <div className="sr-typing"><i /><i /><i /></div>
            </div>}
        </div>
        <div className="dt-chat-input">
          <div className="sr-searchfield">
            <DTIcon.search s={19} c="var(--muted)" />
            <input className="sr-searchinput" placeholder="조건을 말해보세요 — 예: 이공계 등록금 장학금"
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          </div>
          <button className="sr-chatsend" onClick={submit} disabled={!text.trim()} aria-label="보내기">
            <DTIcon.send s={20} c="#fff" fill="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopFilters({ filters, onApply, onReset }) {
  const [f, setF] = React.useState(filters);
  React.useEffect(() => { setF(filters); }, [filters]);
  const { TYPE_OPTIONS, STATUS_OPTIONS, DEFAULT_FILTERS } = window.SR_DATA;
  const toggleType = (ty) => setF((s) => ({ ...s, types: s.types.includes(ty) ? s.types.filter((x) => x !== ty) : [...s.types, ty] }));
  return (
    <aside className="dt-sidebar">
      <div className="dt-sidebar-h"><DTIcon.filter s={18} c="var(--blue)" /> 조건 필터</div>
      <div className="dt-sidebar-body">
        <DTField label="키워드">
          <div className="sr-input"><DTIcon.search s={18} c="var(--muted)" />
            <input placeholder="예: 성적우수, 생활비" value={f.keyword}
              onChange={(e) => setF({ ...f, keyword: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') onApply(f); }} />
          </div>
        </DTField>
        <DTField label="학교명">
          <div className="sr-input"><DTIcon.building s={18} c="var(--muted)" />
            <input placeholder="예: 한빛대학교" value={f.school}
              onChange={(e) => setF({ ...f, school: e.target.value })} />
          </div>
        </DTField>
        <DTField label="학자금 지원구간" hint={`${f.tierMin}구간 ~ ${f.tierMax}구간`}>
          <div className="sr-range">
            <div className="sr-range-row">
              <span className="sr-range-cap">최소 {f.tierMin}</span>
              <input type="range" min="1" max="10" value={f.tierMin}
                onChange={(e) => setF({ ...f, tierMin: Math.min(+e.target.value, f.tierMax) })} />
            </div>
            <div className="sr-range-row">
              <span className="sr-range-cap">최대 {f.tierMax}</span>
              <input type="range" min="1" max="10" value={f.tierMax}
                onChange={(e) => setF({ ...f, tierMax: Math.max(+e.target.value, f.tierMin) })} />
            </div>
          </div>
        </DTField>
        <DTField label="모집 상태">
          <DTSeg options={STATUS_OPTIONS} value={f.status} onChange={(v) => setF({ ...f, status: v })} />
        </DTField>
        <DTField label="장학금 유형" hint="복수 선택 · 선택 안 하면 전 유형">
          <DTChips options={TYPE_OPTIONS} value={f.types} onToggle={toggleType} />
        </DTField>
      </div>
      <div className="dt-sidebar-foot">
        <button className="sr-btn sr-btn-ghost" onClick={() => { setF(DEFAULT_FILTERS); onReset(); }}>초기화</button>
        <button className="sr-btn sr-btn-primary" style={{ flex: 2 }} onClick={() => onApply(f)}>
          <DTIcon.search s={17} c="#fff" /> 검색
        </button>
      </div>
    </aside>
  );
}

function filterSummaryDT(f) {
  const parts = [f.status === '전체' ? '전체 상태' : f.status,
    (f.tierMin === 1 && f.tierMax === 10) ? '전 구간' : `${f.tierMin}~${f.tierMax}구간`,
    f.types.length ? f.types.join('·') : '전 유형'];
  if (f.school) parts.push(f.school);
  return parts;
}

function DesktopHome({ ctx }) {
  const { screen, filters, results, doSearch, setFilters, openCard } = ctx;
  const { DEFAULT_FILTERS } = window.SR_DATA;
  const loading = screen === 'loading';
  const empty = screen === 'empty';
  const searched = screen === 'results' || screen === 'empty' || screen === 'loading';
  const { SCHOLARSHIPS } = window.SR_DATA;
  const recruiting = SCHOLARSHIPS.filter(s => s.status === '모집중');
  const list = searched ? results : recruiting;
  return (
    <div className="dt-home">
      <div className="dt-home-inner">
        <DesktopFilters filters={filters} onApply={(f) => doSearch(f)} onReset={() => { setFilters(DEFAULT_FILTERS); }} />
        <section className="dt-content">
          <div className="dt-content-h">
            <div>
              <h1 className="dt-content-title">{searched ? '검색 결과' : '지금 모집 중인 장학금'}</h1>
              <p className="dt-content-sub">
                {loading ? '공식 공고를 확인하며 찾고 있어요…' : <><b>{list.length}건</b>의 공고 · 공식 공고를 먼저 확인하는 원칙</>}
              </p>
            </div>
            <div className="dt-content-chips">
              {filterSummaryDT(filters).map((p, i) => <span key={i} className="sr-fchip sr-fchip-static">{p}</span>)}
            </div>
          </div>
          {loading && <div className="dt-grid">{[0, 1, 2, 3, 4, 5].map((i) => <DTSkel key={i} />)}</div>}
          {empty &&
            <div className="dt-empty">
              <span className="sr-empty-ic"><DTIcon.search s={30} c="var(--muted)" /></span>
              <h2>조건에 맞는 장학금이 없습니다</h2>
              <p>왼쪽 필터를 조정하면 더 많은 공고를 볼 수 있어요.</p>
            </div>}
          {!loading && !empty &&
            <div className="dt-grid">
              {list.map((it) => <DTCard key={it.id} item={it} onClick={() => openCard(it)} />)}
            </div>}
          <p className="sr-disclaimer" style={{ textAlign: 'left', marginTop: 18 }}>
            표시된 정보는 데모용 샘플입니다. 신청 전 반드시 공식 공고를 확인하세요.
          </p>
        </section>
      </div>
    </div>
  );
}

function DesktopSaved({ onGoChat }) {
  return (
    <div className="dt-home">
      <div className="dt-saved">
        <span className="sr-empty-ic"><DTIcon.heart s={30} c="var(--muted)" /></span>
        <h2>저장한 공고가 없어요</h2>
        <p>마음에 드는 공고의 ♡를 누르면 여기에 모아 볼 수 있어요.</p>
        <button className="sr-btn sr-btn-primary" onClick={onGoChat}>
          <DTIcon.sparkle s={18} c="#fff" /> AI로 공고 찾기
        </button>
      </div>
    </div>
  );
}

function DesktopShell({ ctx }) {
  const { screen, setScreen, selected, detailFrom, summary, setSummary, summaryText, toast,
    chat, thinking, sendChat, openCard, openSummary, noticeAction, applyAction,
    recruiting, demoItem, rootVars } = ctx;

  const group = (s) => (s === 'chat' ? 'chat' : s === 'saved' ? 'saved' : 'home');
  const baseScreen = screen === 'detail' ? detailFrom : screen;
  const navActive = group(baseScreen);

  return (
    <div className="dt-app" style={rootVars}>
      <DesktopNav active={navActive} onGo={(id) => { setSummary(null); setScreen(id); }} recruiting={recruiting.length} />
      <main className="dt-main">
        {navActive === 'chat' && <DesktopChat messages={chat} thinking={thinking} onSend={sendChat} onOpenCard={openCard} />}
        {navActive === 'home' && <DesktopHome ctx={ctx} />}
        {navActive === 'saved' && <DesktopSaved onGoChat={() => setScreen('chat')} />}
      </main>

      {screen === 'detail' &&
        <div className="dt-drawer-overlay" onClick={() => setScreen(detailFrom)}>
          <div className="dt-drawer" onClick={(e) => e.stopPropagation()}>
            <DTDetail item={selected || demoItem} onBack={() => setScreen(detailFrom)}
              onSummary={openSummary} onNotice={noticeAction} onApply={applyAction} />
          </div>
        </div>}

      {summary &&
        <DTSummary desktop item={selected || demoItem} mode={summary.mode} summaryText={summaryText}
          onClose={() => setSummary(null)} onRetry={openSummary}
          onNotice={noticeAction} onApply={applyAction} />}

      {toast && <div className="sr-toast dt-toast">{toast}</div>}
    </div>
  );
}

Object.assign(window, { DesktopShell });
