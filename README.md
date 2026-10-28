# 작은 책상 · 웹앱 허브

정적 웹앱 허브와 Google 로그인을 사용하는 개인 일기장입니다.

- 사이트: https://ehynlee-source.github.io/little-desk/
- 일기장: https://ehynlee-source.github.io/little-desk/diary/
- 교사 도구: 안내문 서식, 업무 목록, 번호 기반 모둠 편성, 수업 타이머
- 교실 알람: 요일별 시간 설정과 소리 알림 (페이지가 열려 있어야 합니다)
- 오늘의 조각: Google 로그인, 개인별 Firestore, 검색·달력·기분 필터, 작성·수정·삭제·JSON 백업

## 실행과 배포

실행.cmd를 더블클릭하거나 Node.js 24 이상에서 아래 명령으로 실행합니다. 별도 npm 설치는 필요하지 않습니다.

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

http://localhost:3101 에서 열립니다. Firebase 로그인은 승인된 도메인에서 사용합니다.

GitHub Pages 게시 소스는 main 브랜치의 /docs입니다. 수정 후 node scripts/build.mjs를 실행하고 소스와 docs를 함께 커밋하세요. 빌드 스크립트는 명시한 정적 파일만 복사합니다.

## Firebase

- 프로젝트: little-desk-diary, Firestore ID: default
- Firestore Enterprise / Native 모드, 서울 asia-northeast3
- Firebase Authentication: Google 제공자. ehynlee-source.github.io를 승인 도메인으로 등록합니다.
- 읽기·쓰기 경로: users/{로그인 UID}/entries/{자동 생성 ID}
- 소유권 검사와 엄격한 필드·길이·타임스탬프 검사를 firestore.rules에 정의합니다.
- diary/firebase-config.js는 공개 웹 설정입니다. 관리자 서비스 계정, OAuth 비밀키, 로그인 토큰은 저장소에 넣지 마세요.

Firebase CLI로 배포하는 경우:

```powershell
npx -y firebase-tools@latest deploy --only firestore --project little-desk-diary
```

Firebase 콘솔에서 설정한 규칙과 저장소의 규칙을 함께 관리해야 합니다. 데이터베이스는 일반 기본 ID (default)와 다른 default이므로 클라이언트에서도 명시합니다.

## 개인정보

[개인정보 안내](PRIVACY.md)를 확인하세요. 기존 로컬 일기장의 SQLite 파일은 복사하거나 업로드하지 않습니다. 일기는 종단 간 암호화되지 않으며 Firebase 관리자는 접근할 수 있습니다. 허브 설정은 브라우저 localStorage, 일기는 Firebase에 저장됩니다. 외부 글꼴·Analytics·AI 분석은 사용하지 않습니다.

배포 대상에는 내부 배포 설정, 기존 Git 이력, 압축파일, 로그, 데이터베이스, 사용자 기록, 환경 변수 파일을 포함하지 않습니다. 검토 범위는 [SECURITY.md](SECURITY.md)에 기록합니다.

