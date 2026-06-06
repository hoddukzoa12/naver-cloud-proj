/* data.js — 데모용 샘플 데이터 (기관·공고 단위 정보만)
   ⚠ 실제 개인정보·금융정보·API 키 일절 없음. 기관명은 모두 가상의 샘플입니다. */
(function () {
const TODAY = new Date('2026-06-06');

function ddays(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

const SCHOLARSHIPS = [
  {
    id: 's1',
    name: '신입생 성적우수 장학금',
    org: '한빛대학교 장학복지처',
    type: '등록금',
    status: '모집중',
    tier: '1~4구간',
    tierMin: 1, tierMax: 4,
    amountSemester: 2000000,
    amountYear: 4000000,
    deadline: '2026-06-20',
    verification_status: 'verified',
    eligibility: ['직전 학기 평점 3.5 이상', '재학 중인 학부생', '타 교내 장학금과 중복 수혜 불가'],
    noticeUrl: 'https://example.kr/notice/s1',
    applyUrl: 'https://example.kr/apply/s1',
  },
  {
    id: 's2',
    name: '저소득층 생활비 지원',
    org: '미래나눔장학재단',
    type: '생활비',
    status: '모집중',
    tier: '1~3구간',
    tierMin: 1, tierMax: 3,
    amountSemester: 1500000,
    amountYear: 3000000,
    deadline: '2026-06-12',
    verification_status: 'verified',
    eligibility: ['학자금 지원구간 1~3구간', '직전 학기 12학점 이상 이수', '소득 증빙 서류 제출'],
    noticeUrl: 'https://example.kr/notice/s2',
    applyUrl: 'https://example.kr/apply/s2',
  },
  {
    id: 's3',
    name: '이공계 미래인재 장학금',
    org: '푸른꿈과학장학회',
    type: '혼합',
    status: '모집중',
    tier: '전 구간',
    tierMin: 1, tierMax: 10,
    amountSemester: 1800000,
    amountYear: 3600000,
    deadline: '2026-06-30',
    verification_status: 'unverified',
    eligibility: ['이공계열 재학생', '직전 학기 평점 3.0 이상', '공고문 기준 추가 서류 확인 필요'],
    noticeUrl: 'https://example.kr/notice/s3',
    applyUrl: 'https://example.kr/apply/s3',
  },
  {
    id: 's6',
    name: '전공우수 등록금 장학금',
    org: '한빛대학교 공과대학',
    type: '등록금',
    status: '모집중',
    tier: '전 구간',
    tierMin: 1, tierMax: 10,
    amountSemester: 2400000,
    amountYear: 4800000,
    deadline: '2026-06-25',
    verification_status: 'verified',
    eligibility: ['공과대학 소속 재학생', '직전 학기 전공 평점 4.0 이상', '학과 추천 필요'],
    noticeUrl: 'https://example.kr/notice/s6',
    applyUrl: 'https://example.kr/apply/s6',
  },
  {
    id: 's7',
    name: '글로벌 교환학생 지원금',
    org: '세계로장학문화재단',
    type: '생활비',
    status: '모집중',
    tier: '1~8구간',
    tierMin: 1, tierMax: 8,
    amountSemester: 1300000,
    amountYear: 2600000,
    deadline: '2026-07-05',
    verification_status: 'verified',
    eligibility: ['교환학생 파견 확정자', '공인 어학 성적 보유', '직전 학기 평점 3.2 이상'],
    noticeUrl: 'https://example.kr/notice/s7',
    applyUrl: 'https://example.kr/apply/s7',
  },
  {
    id: 's4',
    name: '지역인재 육성 장학금',
    org: '한빛시 인재육성재단',
    type: '혼합',
    status: '예정',
    tier: '1~6구간',
    tierMin: 1, tierMax: 6,
    amountSemester: 1200000,
    amountYear: 2400000,
    deadline: '2026-07-15',
    verification_status: 'verified',
    eligibility: ['지역 소재 고교 졸업자', '관내 대학 재학생', '모집 시작 후 신청 가능'],
    noticeUrl: 'https://example.kr/notice/s4',
    applyUrl: 'https://example.kr/apply/s4',
  },
  {
    id: 's5',
    name: '근로·복지 연계 장학금',
    org: '함께걷는복지재단',
    type: '생활비',
    status: '마감',
    tier: '1~5구간',
    tierMin: 1, tierMax: 5,
    amountSemester: 1000000,
    amountYear: 2000000,
    deadline: '2026-05-30',
    verification_status: 'verified',
    eligibility: ['교내 근로장학 참여자', '학자금 지원구간 1~5구간', '마감된 공고'],
    noticeUrl: 'https://example.kr/notice/s5',
    applyUrl: 'https://example.kr/apply/s5',
  },
];

const TYPE_OPTIONS = ['등록금', '생활비', '혼합'];
const STATUS_OPTIONS = ['전체', '모집중', '예정', '마감'];

const DEFAULT_FILTERS = {
  keyword: '',
  school: '',
  tierMin: 1,
  tierMax: 10,
  status: '모집중',
  types: [],
};

window.SR_DATA = { SCHOLARSHIPS, TYPE_OPTIONS, STATUS_OPTIONS, DEFAULT_FILTERS, ddays, TODAY };
})();
