# 아동 뉴스 센터

AI가 매일 한국의 아동 관련 뉴스를 수집해 보여주는 풀스택 앱.

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **DB**: Prisma + SQLite(dev) / PostgreSQL — Neon(prod)
- **Auth**: Auth.js v5 (Credentials + Google optional)
- **AI**: Anthropic Claude + web_search tool
- **Scheduler**: Vercel Cron (매일 08:00 KST 자동 수집)
- **Hosting**: Vercel (무료 티어)

---

## 로컬 개발

```bash
npm install
npm run db:migrate          # dev.db 생성 + 스키마 반영
npm run db:seed             # 샘플 뉴스 6건 시드
npm run dev                 # http://localhost:3000
```

`.env`의 `ANTHROPIC_API_KEY`를 채우면 "새로고침" 버튼이 실제 Claude 호출로 작동합니다.

### 관리자 권한 부여

```bash
npm run make-admin -- your@email.com
```

### 수동 뉴스 수집

```bash
curl -X POST -H "x-cron-secret: dev-cron-secret" http://localhost:3000/api/cron/collect-news
```

---

## 프로덕션 배포 (GitHub + Neon + Vercel)

### 1) Neon Postgres 프로젝트 생성

1. https://console.neon.tech → New Project (Region: `aws-ap-northeast-1 Tokyo` 추천)
2. **Connection string (pooled)** 복사 — `postgresql://...?sslmode=require`
3. **Direct connection string** 도 별도로 복사 (migrate용)

### 2) 스키마를 PostgreSQL로 전환

`prisma/schema.prisma`의 datasource를 변경:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

로컬에서 PG 대상 마이그레이션을 새로 만들기:

```bash
rm -rf prisma/migrations           # SQLite용 마이그레이션 제거
DATABASE_URL="<Neon pooled>" DIRECT_URL="<Neon direct>" \
  npx prisma migrate dev --name init_pg
```

### 3) GitHub에 푸시

```bash
cd kids-news
git init
git add -A
git commit -m "initial: kids news center"
git branch -M main
# GitHub에서 repo 생성 후:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 4) Vercel 배포

1. https://vercel.com/new → GitHub repo 연결
2. **Root Directory**: `kids-news`
3. **Environment Variables**:

| 키 | 값 |
|---|---|
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `AUTH_SECRET` | `openssl rand -base64 32` 결과 |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com 에서 발급 |
| `CRON_SECRET` | 임의의 긴 문자열 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | (선택) Google OAuth |

4. Deploy 클릭. `postinstall`에서 `prisma generate`가 자동 실행됩니다.
5. `vercel.json`의 Cron이 매일 23:00 UTC (= 08:00 KST)에 자동 수집을 트리거합니다.

### 5) 첫 관리자 지정

배포된 사이트에서 회원가입 후, Neon SQL Editor에서:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## 주요 기능

- 📰 뉴스 목록 + 카테고리 필터 (정책/복지/교육/안전/건강)
- 🔐 회원가입·로그인 (이메일+비밀번호 / Google)
- ⭐ 북마크 · 읽음 자동 표시
- 👤 `/bookmarks` — 저장한 기사 모아보기
- 🛠 `/admin` — 뉴스 숨김/삭제, 통계
- 🤖 매일 08:00 KST 자동 수집 (Vercel Cron)
- 🔄 "새로고침" 버튼 — 수동 수집
