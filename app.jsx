/* app.jsx — 앱 셸: 상태 머신, 화면 전환 */
const { MainScreen, FilterScreen, LoadingScreen, ResultsScreen, EmptyScreen,
        DetailScreen, SummarySheet, ChatScreen, SavedScreen, BottomTabBar,
        ChatMessage, DesktopShell } = window;
const { SCHOLARSHIPS, DEFAULT_FILTERS, ddays } = window.SR_DATA;

function runSearch(f) {
  return SCHOLARSHIPS.filter(it => {
    if (f.status !== '전체' && it.status !== f.status) return false;
    if (f.types.length && !f.types.includes(it.type)) return false;
    if (!(it.tierMax >= f.tierMin && it.tierMin <= f.tierMax)) return false;
    const kw = (f.keyword || '').trim();
    if (kw && !(it.name.includes(kw) || it.org.includes(kw) || it.type.includes(kw))) return false;
    const sc = (f.school || '').trim();
    if (sc && !it.org.includes(sc)) return false;
    return true;
  });
}

const RECRUITING = SCHOLARSHIPS.filter(s => s.status === '모집중');
const TOP_CARDS = [...RECRUITING].sort((a, b) => ddays(a.deadline) - ddays(b.deadline)).slice(0, 3);
const DEMO_ITEM = SCHOLARSHIPS.find(s => s.id === 's3');
const TOP_LEVEL = ['chat', 'main', 'saved'];

const CHAT_WELCOME = '안녕하세요, 장학레이더예요. 어떤 장학금이 필요한지 편하게 말씀해 주세요. 조건을 알려주시면 공식 공고를 먼저 확인해 맞는 공고를 찾아드릴게요.';
const CHAT_CHIPS = ['등록금 지원이 필요해요', '생활비가 급해요', '이공계 전공이에요'];

const ROOT_VARS = {
  '--sr-font-scale': 1,
  '--sr-gap': '13px',
  '--sr-pad': '16px',
  '--sr-scrollpad': '18px',
  '--sr-card-radius': '16px',
  '--sr-card-shadow': '0 1px 2px rgba(20,30,55,.05), 0 4px 14px rgba(20,30,55,.05)',
};

function useViewMode() {
  const [mode, setMode] = React.useState(() => window.innerWidth >= 1000 ? 'desktop' : 'mobile');
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const h = (e) => setMode(e.matches ? 'desktop' : 'mobile');
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mode;
}

function App() {
  const viewMode = useViewMode();
  const [screen, setScreen] = React.useState('chat');
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);
  const [results, setResults] = React.useState(TOP_CARDS);
  const [selected, setSelected] = React.useState(null);
  const [detailFrom, setDetailFrom] = React.useState('chat');
  const [summary, setSummary] = React.useState(null); // { mode: 'loading'|'done'|'error' }
  const [summaryText, setSummaryText] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const [chat, setChat] = React.useState([{ role: 'ai', text: CHAT_WELCOME, chips: CHAT_CHIPS }]);
  const [thinking, setThinking] = React.useState(false);
  const timer = React.useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };

  const doSearch = (f) => {
    const use = f || filters;
    setFilters(use);
    setScreen('loading');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = runSearch(use);
      setResults(r);
      setScreen(r.length ? 'results' : 'empty');
    }, 900);
  };

  const openCard = (it) => { setDetailFrom(screen); setSelected(it); setScreen('detail'); };

  const sendChat = async (q) => {
    const text = (q || '').trim();
    if (!text || thinking) return;
    setChat(c => [...c, { role: 'user', text }]);
    setThinking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setThinking(false);
      setChat(c => [...c, {
        role: 'ai',
        text: data.reply || '답변을 가져오지 못했어요.',
        cards: Array.isArray(data.scholarships) && data.scholarships.length ? data.scholarships.slice(0, 3) : null,
        chips: (!data.scholarships || !data.scholarships.length) ? CHAT_CHIPS : null,
      }]);
    } catch {
      setThinking(false);
      setChat(c => [...c, {
        role: 'ai',
        text: '연결에 실패했어요. 잠시 후 다시 시도해 주세요.',
        chips: CHAT_CHIPS,
      }]);
    }
  };

  const openSummary = () => {
    setSummary({ mode: 'loading' });
    setSummaryText('');
    const item = selected || DEMO_ITEM;
    const text = item
      ? [item.name, item.org, ...item.eligibility].join('\n')
      : '장학금 공고문';
    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        const t = data.result?.text || data.text || '';
        setSummaryText(t);
        setSummary({ mode: 'done' });
      })
      .catch(() => setSummary({ mode: 'error' }));
  };

  const noticeAction = () => showToast('데모 링크입니다 — 실제 페이지로 이동하지 않습니다');
  const applyAction = () => showToast('데모용 화면입니다 — 신청은 공식 창구에서 진행하세요');

  const ctx = {
    screen, setScreen, filters, setFilters, results, selected, detailFrom,
    summary, setSummary, summaryText, toast, chat, thinking,
    doSearch, openCard, sendChat, openSummary, noticeAction, applyAction,
    recruiting: RECRUITING, topCards: TOP_CARDS, demoItem: DEMO_ITEM, rootVars: ROOT_VARS,
  };

  return (
    <div className="sr-root" style={ROOT_VARS}>
      {viewMode === 'mobile' ? <MobileShell ctx={ctx} /> : <DesktopShell ctx={ctx} />}
    </div>
  );
}

function MobileShell({ ctx }) {
  const { screen, setScreen, filters, setFilters, results, selected, detailFrom,
    summary, setSummary, summaryText, toast, chat, thinking,
    doSearch, openCard, sendChat, openSummary, noticeAction, applyAction,
    topCards, demoItem } = ctx;

  let body;
  if (screen === 'chat') body = <ChatScreen messages={chat} thinking={thinking} onSend={sendChat} onOpenCard={openCard} />;
  else if (screen === 'saved') body = <SavedScreen onGoChat={() => setScreen('chat')} />;
  else if (screen === 'main') body = <MainScreen filters={filters} setFilters={setFilters} recruitingCount={RECRUITING.length} topCards={topCards} onSearch={() => doSearch(filters)} onOpenFilter={() => setScreen('filter')} onOpenCard={openCard} />;
  else if (screen === 'filter') body = <FilterScreen filters={filters} onApply={(f) => doSearch(f)} onReset={() => setFilters(DEFAULT_FILTERS)} onClose={() => setScreen('main')} />;
  else if (screen === 'loading') body = <LoadingScreen onBack={() => setScreen('main')} />;
  else if (screen === 'results') body = <ResultsScreen filters={filters} results={results} onOpenFilter={() => setScreen('filter')} onOpenCard={openCard} onBack={() => setScreen('main')} />;
  else if (screen === 'empty') body = <EmptyScreen onAdjust={() => setScreen('filter')} onBack={() => setScreen('main')} />;
  else if (screen === 'detail') body = <DetailScreen item={selected || demoItem} onBack={() => setScreen(detailFrom)} onSummary={openSummary} onNotice={noticeAction} onApply={applyAction} />;

  const showTabBar = TOP_LEVEL.includes(screen) && !summary;

  return (
    <div className="sr-mobile">
      <div className="sr-viewport">{body}</div>
      {showTabBar && <BottomTabBar active={screen} onGo={(id) => { setSummary(null); setScreen(id); }} />}
      {summary && (
        <SummarySheet item={selected || demoItem} mode={summary.mode} summaryText={summaryText}
          onClose={() => setSummary(null)}
          onRetry={openSummary}
          onNotice={noticeAction}
          onApply={applyAction} />
      )}
      {toast && <div className="sr-toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
