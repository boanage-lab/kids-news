<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:news-data-rules -->
# 뉴스 데이터 작성 규칙 (할루시네이션 방지)

이 앱의 뉴스는 **사실 정확성이 전부**다. 아래 규칙을 어기면 사용자 신뢰가 즉시 무너진다.

## 절대 원칙

1. **뉴스 본문을 손으로 쓰지 마라.**
   - `title`, `summary`, `detail`, `impact`, `point` 필드는 절대 추론·창작·"그럴듯하게 채우기" 금지.
   - 검색 스니펫(2~3문장)만 보고 5~7문장 본문을 만드는 것이 대표적인 할루시네이션 패턴이다.

2. **뉴스 아이템은 반드시 2단계로 만든다.**
   - **Step 1**: WebSearch로 후보 URL 수집.
   - **Step 2**: 각 URL에 대해 **WebFetch로 실제 페이지를 읽고**, 반환된 내용만 사용해 필드를 작성.
   - WebFetch가 실패하거나 페이지가 일반 랜딩/목록 페이지(홈, 뉴스 리스트 등)면 **해당 아이템 폐기**.

3. **url 필드는 필수다.**
   - `scripts/ingest-news.ts`는 기본값에서 URL 없는 아이템을 거부한다.
   - 일반 도메인 홈페이지(`https://www.mohw.go.kr/` 등)는 특정 기사 URL이 아니므로 사용 금지.
   - URL은 구체적인 기사/공지 페이지로 연결되어야 한다.

4. **확신 없는 수치·날짜는 비워두거나 제거한다.**
   - "월 50만 원", "500개소", "7.5% 인상" 같은 구체적 숫자는 원문에서 확인된 경우에만 사용.
   - 모르면 비우거나 해당 문장 자체를 빼라. "있어 보이게" 채우지 마라.

5. **시드/샘플 데이터는 명시적으로 표기한다.**
   - 테스트용 가짜 데이터를 DB에 넣을 일이 생기면 반드시 `verified=false`로 두고 사용자에게 "샘플 데이터"라고 고지.

## 위반 시 자동 차단

- `scripts/ingest-news.ts`가 URL 없거나 URL이 도달 불가능하면 기본값에서 거부 (bypass: `INGEST_ALLOW_NO_URL=1`).
- `verified=true`는 HEAD 요청이 2xx/3xx를 반환했을 때만 자동 설정됨.
- 관리자 페이지에 "⚠ 미검증" 뱃지로 표시되므로 숨길 수 없다.

## Claude Code 스케줄 작업 (routine)

`kids-news-daily-collect` 스케줄 작업은 매일 WebSearch → WebFetch 파이프라인으로 실제 원문을 읽고 JSON을 생성한다. 이 작업의 프롬프트를 수정할 때도 위 규칙을 유지할 것.
<!-- END:news-data-rules -->
