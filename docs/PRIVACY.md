# 개인정보 및 저장 방식

- 허브의 즐겨찾기, 추가 링크, 교사용 초안, 업무, 알람 설정은 현재 브라우저의 localStorage에 저장합니다. 공용 PC에서는 사용 후 브라우저 데이터를 지워 주세요.
- 일기장은 Google 로그인 후 Firebase Authentication과 Cloud Firestore를 사용합니다. Google 계정 인증 정보는 Firebase Authentication에서 처리하며 일기 문서에는 이메일, 이름, 프로필 사진을 복사해 저장하지 않습니다.
- 일기는 `users/{로그인 UID}/entries/{문서 ID}`에 저장되며 해당 사용자만 읽고 쓰도록 보안 규칙을 적용합니다. 서비스 운영자는 관리자 권한으로 데이터에 접근할 수 있습니다. 종단 간 암호화 서비스는 아닙니다.
- 일기 본문은 localStorage에 저장하지 않습니다. 로그인 상태는 탭 세션 동안 유지되며 Firestore에는 영구 디스크 캐시를 사용하지 않습니다. 로그아웃하면 화면과 작성 중 내용을 지웁니다.
- 기존 PC의 SQLite 일기 파일은 자동으로 전송하지 않습니다. 기록 백업은 사용자가 직접 내려받는 JSON 파일이며 민감한 내용이 포함될 수 있습니다.
- 일기 삭제는 선택한 본문을 Firestore에서 제거합니다. Google 계정 자체나 다른 서비스 데이터에는 영향을 주지 않습니다.
- Google Fonts, Analytics, 광고 SDK, AI 내용 분석은 사용하지 않습니다. 일기장 실행 시 Firebase SDK를 Google CDN에서 불러옵니다. 사이트 접속 및 Firebase 사용 과정에서 GitHub와 Google은 각자의 정책에 따라 IP 등 접속 정보를 처리할 수 있습니다.
- 공개 GitHub 저장소와 GitHub Pages에는 프로그램과 공개 Firebase 웹 설정만 포함합니다. 비밀키, 로그인 토큰, 일기·학생·교사 데이터는 포함하지 않습니다.
