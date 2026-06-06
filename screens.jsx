/* screens.jsx — 화면들 */
const { Icon, won, dlabel, StatusBadge, TypeChip, SampleTag, UnverifiedBanner,
  ScholarshipCard, SkeletonCard, Field, Segmented, MultiChips } = window;

function BrandHeader() {
  return (
    <header className="sr-appbar">
      <div className="sr-brand">
        <span className="sr-logo"><Icon.radar s={20} c="#fff" /></span>
        <span className="sr-brandtxt">
          <b>장학레이더</b>
          <i>HyperCLOVA X 맞춤 검색</i>
        </span>
      </div>
      <span className="sr-demoflag">데모</span>
    </header>
  );
}

function SubHeader({ title, onBack, right }) {
  return (
    <header className="sr-subbar">
      <button className="sr-iconbtn" onClick={onBack} aria-label="뒤로"><Icon.back s={22} c="var(--ink)" /></button>
      <span className="sr-subtitle">{title}</span>
      <span className="sr-subright">{right}</span>
    </header>
  );
}

function filterSummary(f) {
  const parts = [];
  parts.push(f.status === '전체' ? '전체 상태' : f.status);
  parts.push(f.tierMin === 1 && f.tierMax === 10 ? '전 구간' : `${f.tierMin}~${f.tierMax}구간`);
  parts.push(f.types.length ? f.types.join('·') : '전 유형');
  if (f.school) parts.push(f.school);
  return parts;
}

function MainScreen({ filters, setFilters, recruitingCount, topCards, onSearch, onOpenFilter, onOpenCard }) {
  return (
    <div className="sr-screen">
      <BrandHeader />
      <div className="sr-scroll">
        <div className="sr-searchwrap">
          <div className="sr-searchfield">
            <Icon.search s={20} c="var(--muted)" />
            <input className="sr-searchinput" placeholder="장학금·운영기관 키워드"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }} />
            {filters.keyword &&
              <button className="sr-clearbtn" onClick={() => setFilters({ ...filters, keyword: '' })} aria-label="지우기"><Icon.close s={16} c="var(--muted)" /></button>
            }
          </div>
          <button className="sr-btn sr-btn-primary sr-search-btn" onClick={onSearch}>검색</button>
        </div>

        <div className="sr-filterrow">
          <button className="sr-filterbtn" onClick={onOpenFilter}>
            <Icon.filter s={16} c="var(--blue)" /> 필터
          </button>
          <div className="sr-filterchips">
            {filterSummary(filters).map((p, i) =>
              <button key={i} className="sr-fchip" onClick={onOpenFilter}>{p}</button>
            )}
          </div>
        </div>

        <div className="sr-sectionhead">
          <span className="sr-sectiontitle">조건에 맞는 추천</span>
          <span className="sr-sectioncount">{topCards.length}건</span>
        </div>
        <div className="sr-cardlist">
          {topCards.map((it) => <ScholarshipCard key={it.id} item={it} onClick={() => onOpenCard(it)} />)}
        </div>
      </div>
    </div>
  );
}

function FilterScreen({ filters, onApply, onReset, onClose }) {
  const [f, setF] = React.useState(filters);
  const { TYPE_OPTIONS, STATUS_OPTIONS } = window.SR_DATA;
  const toggleType = (t) => setF((s) => ({ ...s, types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t] }));
  return (
    <div className="sr-screen">
      <SubHeader title="필터" onBack={onClose}
        right={<button className="sr-textbtn" onClick={() => setF(window.SR_DATA.DEFAULT_FILTERS)}>초기화</button>} />
      <div className="sr-scroll sr-filterbody">
        <Field label="키워드">
          <div className="sr-input"><Icon.search s={18} c="var(--muted)" />
            <input placeholder="예: 성적우수, 생활비" value={f.keyword}
              onChange={(e) => setF({ ...f, keyword: e.target.value })} />
          </div>
        </Field>
        <Field label="학교명">
          <div className="sr-input"><Icon.building s={18} c="var(--muted)" />
            <input placeholder="예: 한빛대학교" value={f.school}
              onChange={(e) => setF({ ...f, school: e.target.value })} />
          </div>
        </Field>
        <Field label="학자금 지원구간" hint={`${f.tierMin}구간 ~ ${f.tierMax}구간`}>
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
        </Field>
        <Field label="모집 상태">
          <Segmented options={STATUS_OPTIONS} value={f.status} onChange={(v) => setF({ ...f, status: v })} />
        </Field>
        <Field label="장학금 유형" hint="복수 선택 가능 · 선택 안 하면 전 유형">
          <MultiChips options={TYPE_OPTIONS} value={f.types} onToggle={toggleType} />
        </Field>
      </div>
      <div className="sr-actionbar">
        <button className="sr-btn sr-btn-ghost" onClick={() => { onReset(); }}>초기화</button>
        <button className="sr-btn sr-btn-primary" style={{ flex: 2 }} onClick={() => onApply(f)}>이 조건으로 검색</button>
      </div>
    </div>
  );
}

function LoadingScreen({ onBack }) {
  return (
    <div className="sr-screen">
      <SubHeader title="검색 중" onBack={onBack} />
      <div className="sr-scroll">
        <div className="sr-loadmsg">
          <span className="sr-spinner" />
          공식 공고를 확인하며 맞는 장학금을 찾고 있어요…
        </div>
        <div className="sr-cardlist">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ filters, results, onOpenFilter, onOpenCard, onBack }) {
  return (
    <div className="sr-screen">
      <SubHeader title="검색 결과" onBack={onBack}
        right={<button className="sr-iconbtn" onClick={onOpenFilter} aria-label="필터"><Icon.filter s={20} c="var(--ink)" /></button>} />
      <div className="sr-resultsummary">
        <span><b>{results.length}건</b>의 장학금</span>
        <div className="sr-rs-chips">
          {filterSummary(filters).map((p, i) => <span key={i} className="sr-fchip sr-fchip-static">{p}</span>)}
        </div>
      </div>
      <div className="sr-scroll">
        <div className="sr-cardlist">
          {results.map((it) => <ScholarshipCard key={it.id} item={it} onClick={() => onOpenCard(it)} />)}
        </div>
      </div>
    </div>
  );
}

function EmptyScreen({ onAdjust, onBack }) {
  return (
    <div className="sr-screen">
      <SubHeader title="검색 결과" onBack={onBack} />
      <div className="sr-empty">
        <span className="sr-empty-ic"><Icon.search s={30} c="var(--muted)" /></span>
        <h2>조건에 맞는 장학금이 없습니다</h2>
        <p>필터를 조정하면 더 많은 공고를 볼 수 있어요.</p>
        <button className="sr-btn sr-btn-primary" onClick={onAdjust}>
          <Icon.filter s={18} c="#fff" /> 필터 조정하기
        </button>
      </div>
    </div>
  );
}

function DetailScreen({ item, onBack, onSummary, onNotice, onApply }) {
  const { ddays } = window.SR_DATA;
  const d = ddays(item.deadline);
  const unv = item.verification_status !== 'verified';
  return (
    <div className="sr-screen">
      <SubHeader title="장학금 상세" onBack={onBack} />
      <div className="sr-scroll sr-detailbody">
        {unv && <div className="sr-detail-warn"><UnverifiedBanner /></div>}
        <div className="sr-detail-head">
          <div className="sr-card-top">
            <StatusBadge status={item.status} />
            <TypeChip type={item.type} />
            <span className="sr-card-dday" data-closed={item.status === '마감'}>{item.status === '마감' ? '마감' : dlabel(d)}</span>
          </div>
          <h1 className="sr-detail-name">{item.name}</h1>
          <div className="sr-card-org"><Icon.building s={15} c="var(--muted)" /><span>{item.org}</span><SampleTag /></div>
        </div>

        <div className="sr-infocard">
          <div className="sr-infocard-h"><Icon.won s={17} c="var(--blue)" /> 지원 금액</div>
          <div className="sr-amtgrid">
            <div><span className="sr-amt-cap">학기당</span><span className="sr-amt-v">{won(item.amountSemester)}</span></div>
            <div><span className="sr-amt-cap">연간</span><span className="sr-amt-v">{won(item.amountYear)}</span></div>
          </div>
        </div>

        <div className="sr-infocard">
          <div className="sr-infocard-h"><Icon.check s={16} c="var(--blue)" /> 지원 자격</div>
          <ul className="sr-eliglist">
            {item.eligibility.map((e, i) => <li key={i}><span className="sr-eli-dot" />{e}</li>)}
          </ul>
          <div className="sr-tierline">학자금 지원구간 · <b>{item.tier}</b></div>
        </div>

        <div className="sr-infocard sr-inforow">
          <div className="sr-infocard-h" style={{ margin: 0 }}><Icon.calendar s={16} c="var(--blue)" /> 마감일</div>
          <span className="sr-deadval">{item.deadline ? item.deadline.replace(/-/g, '.') : '미정'} {item.status !== '마감' && <em>({dlabel(d)})</em>}</span>
        </div>

        <div className="sr-infocard">
          <div className="sr-infocard-h"><Icon.doc s={16} c="var(--blue)" /> 공식 링크</div>
          <button className="sr-linkrow" onClick={onNotice}>
            <span><b>공식 공고 보기</b><i>공고 원문 확인</i></span><Icon.external s={18} c="var(--muted)" />
          </button>
          <button className="sr-linkrow" onClick={onApply}>
            <span><b>신청 페이지</b><i>운영기관 신청 창구</i></span><Icon.external s={18} c="var(--muted)" />
          </button>
        </div>

        <button className="sr-clovabtn" onClick={onSummary}>
          <Icon.sparkle s={19} c="var(--blue)" />
          <span><b>CLOVA로 공고문 요약</b><i>긴 공고문을 핵심만 3줄로</i></span>
          <Icon.chevron s={18} c="var(--blue)" />
        </button>
        <div className="sr-pad-bottom" />
      </div>

      <div className="sr-actionbar sticky">
        <button className="sr-btn sr-btn-outline" onClick={onNotice}><Icon.external s={17} c="var(--blue)" /> 공식 공고</button>
        <button className="sr-btn sr-btn-primary" style={{ flex: 1.4 }} onClick={onApply}>신청하기</button>
      </div>
    </div>
  );
}

function SummarySheet({ item, mode, summaryText, onClose, onRetry, onNotice, onApply, desktop }) {
  const defaultSummary = [
    '이공계 학부 재학생 대상, 직전 학기 평점 3.0 이상이면 지원할 수 있어요.',
    '학기당 ' + (item ? won(item.amountSemester) : '') + ' 지급, 등록금·생활비 혼합 지원입니다.',
    '제출 서류와 추가 자격은 공고문 기준으로 다를 수 있어 원문 확인이 필요해요.',
  ];
  const summary = summaryText
    ? summaryText.split(/\n+/).filter(Boolean).slice(0, 3).map(s => s.replace(/^\d+\.\s*/, ''))
    : defaultSummary;
  const unv = item && item.verification_status !== 'verified';
  return (
    <div className={'sr-sheet-overlay' + (desktop ? ' sr-sheet-overlay-c' : '')} onClick={onClose}>
      <div className={'sr-sheet' + (desktop ? ' sr-sheet-modal' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="sr-sheet-grip" />
        <div className="sr-sheet-head">
          <span className="sr-sheet-title"><Icon.sparkle s={18} c="var(--blue)" /> CLOVA 요약</span>
          <button className="sr-iconbtn" onClick={onClose} aria-label="닫기"><Icon.close s={20} c="var(--muted)" /></button>
        </div>

        {mode === 'loading' &&
          <div className="sr-sheet-body">
            <div className="sr-loadmsg" style={{ margin: '8px 0 16px' }}><span className="sr-spinner" /> 공고문을 요약하는 중…</div>
            <span className="skel-line" style={{ width: '94%', height: 13, marginBottom: 10 }} />
            <span className="skel-line" style={{ width: '88%', height: 13, marginBottom: 10 }} />
            <span className="skel-line" style={{ width: '70%', height: 13 }} />
          </div>
        }

        {mode === 'error' &&
          <div className="sr-sheet-body">
            <div className="sr-errbox">
              <span className="sr-errbox-ic"><Icon.warning s={20} c="var(--alert)" /></span>
              <div>
                <b>요약에 실패했어요</b>
                <p>요약 결과를 불러오지 못했습니다. 공식 공고를 직접 확인해 주세요.</p>
              </div>
            </div>
            <div className="sr-sheet-actions">
              <button className="sr-btn sr-btn-ghost" onClick={onRetry}><Icon.refresh s={17} c="var(--blue)" /> 다시 시도</button>
              <button className="sr-btn sr-btn-primary" style={{ flex: 1.4 }} onClick={onNotice}><Icon.external s={17} c="#fff" /> 공식 공고 보기</button>
            </div>
          </div>
        }

        {mode === 'done' &&
          <div className="sr-sheet-body">
            <div className="sr-sum-block">
              <span className="sr-sum-cap">요약</span>
              <ul className="sr-sum-list">
                {summary.map((s, i) => <li key={i}><span className="sr-sum-num">{i + 1}</span>{s}</li>)}
              </ul>
            </div>
            <div className="sr-sum-block">
              <span className="sr-sum-cap">근거 · 출처</span>
              <button className="sr-sourcerow" onClick={onNotice}>
                <Icon.doc s={16} c="var(--muted)" />
                <span>{item ? item.org : ''} 공식 공고문 <SampleTag /></span>
                <Icon.external s={16} c="var(--muted)" />
              </button>
              <p className="sr-sum-note">CLOVA Studio가 위 공고문을 바탕으로 생성했습니다. 원문과 다를 수 있어요.</p>
              {unv && <UnverifiedBanner />}
            </div>
            <div className="sr-sum-block">
              <span className="sr-sum-cap">다음 행동</span>
              <div className="sr-sheet-actions">
                <button className="sr-btn sr-btn-outline" onClick={onNotice}><Icon.external s={17} c="var(--blue)" /> 공식 공고</button>
                <button className="sr-btn sr-btn-primary" style={{ flex: 1.4 }} onClick={onApply}>신청하기</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

function ChatMessage({ msg, onOpenCard, onChip }) {
  if (msg.role === 'user') {
    return (
      <div className="sr-msg sr-msg-user">
        <div className="sr-bubble sr-bubble-user">{msg.text}</div>
      </div>
    );
  }
  return (
    <div className="sr-msg-block">
      <div className="sr-msg sr-msg-ai">
        <span className="sr-msg-av"><Icon.sparkle s={17} c="#fff" /></span>
        <div className="sr-bubble sr-bubble-ai">{msg.text}</div>
      </div>
      {msg.cards && msg.cards.length > 0 &&
        <div className="sr-chat-cards">
          {msg.cards.map((it) => <ScholarshipCard key={it.id} item={it} onClick={() => onOpenCard(it)} />)}
        </div>
      }
      {msg.chips && msg.chips.length > 0 &&
        <div className="sr-chat-chips">
          {msg.chips.map((c) => <button key={c} className="sr-chat-chip" onClick={() => onChip(c)}>{c}</button>)}
        </div>
      }
    </div>
  );
}

function ChatScreen({ messages, thinking, onSend, onOpenCard }) {
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);
  const submit = () => { const q = text.trim(); if (!q) return; setText(''); onSend(q); };
  return (
    <div className="sr-screen">
      <BrandHeader />
      <div className="sr-chatscroll" ref={scrollRef}>
        <div className="sr-chat-note"><Icon.sparkle s={13} c="var(--blue)" /> 공식 공고를 먼저 확인하는 AI 맞춤 찾기 · 데모</div>
        {messages.map((m, i) => <ChatMessage key={i} msg={m} onOpenCard={onOpenCard} onChip={onSend} />)}
        {thinking &&
          <div className="sr-msg sr-msg-ai">
            <span className="sr-msg-av"><Icon.sparkle s={17} c="#fff" /></span>
            <div className="sr-typing"><i /><i /><i /></div>
          </div>
        }
      </div>
      <div className="sr-chatinput">
        <div className="sr-searchfield">
          <input className="sr-searchinput" placeholder="조건을 말해보세요 — 예: 생활비 지원"
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        </div>
        <button className="sr-chatsend" onClick={submit} disabled={!text.trim()} aria-label="보내기">
          <Icon.send s={20} c="#fff" fill="#fff" />
        </button>
      </div>
    </div>
  );
}

function SavedScreen({ onGoChat }) {
  return (
    <div className="sr-screen">
      <header className="sr-subbar" style={{ paddingLeft: 16 }}>
        <span className="sr-subtitle">관심 목록</span>
        <span className="sr-demoflag">데모</span>
      </header>
      <div className="sr-empty">
        <span className="sr-empty-ic"><Icon.heart s={30} c="var(--muted)" /></span>
        <h2>저장한 공고가 없어요</h2>
        <p>마음에 드는 공고의 ♡를 누르면<br />여기에 모아 볼 수 있어요.</p>
        <button className="sr-btn sr-btn-primary" onClick={onGoChat}>
          <Icon.sparkle s={18} c="#fff" /> AI로 공고 찾기
        </button>
      </div>
    </div>
  );
}

function BottomTabBar({ active, onGo }) {
  return (
    <nav className="sr-tabbar">
      <button className={'sr-tab' + (active === 'main' ? ' on' : '')} onClick={() => onGo('main')} aria-label="홈">
        <span className="sr-tab-ic"><Icon.home s={24} c="currentColor" /></span>
      </button>
      <div className="sr-tab-center">
        <button className={'sr-tab-fab' + (active === 'chat' ? ' on' : '')} onClick={() => onGo('chat')} aria-label="AI 찾기">
          <Icon.sparkle s={25} c="#fff" />
        </button>
      </div>
      <button className={'sr-tab' + (active === 'saved' ? ' on' : '')} onClick={() => onGo('saved')} aria-label="관심">
        <span className="sr-tab-ic"><Icon.bookmark s={23} c="currentColor" /></span>
      </button>
    </nav>
  );
}

Object.assign(window, {
  BrandHeader, SubHeader, filterSummary, MainScreen, FilterScreen,
  LoadingScreen, ResultsScreen, EmptyScreen, DetailScreen, SummarySheet,
  ChatScreen, SavedScreen, BottomTabBar, ChatMessage,
});
