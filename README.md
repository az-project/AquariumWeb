# AquariumWeb

Next.js + TypeScript 기반 어항 관리 웹앱입니다.

## 실행

의존성을 설치한 뒤 개발 서버를 실행합니다.

```powershell
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`으로 접속합니다. 개발용 기본 계정은 `admin` / `aquarium`입니다.

프로덕션 모드로 실행하려면 다음 명령을 사용합니다.

```powershell
npm run build
npm run start
```

## Docker

Docker로 실행할 수도 있습니다.

```powershell
docker build -t aquarium-web .
docker run --name aquarium-web -p 4174:4174 -e APP_USERNAME=admin -e APP_PASSWORD=change-me -v ${PWD}\data:/data aquarium-web
```

브라우저에서 `http://127.0.0.1:4174`로 접속합니다. 같은 서버 주소로 접속한 사용자는 로그인 후 `data/state.json`을 통해 어항 데이터를 공유합니다.

`APP_USERNAME`, `APP_PASSWORD`를 생략하면 개발용 기본 계정 `admin` / `aquarium`이 사용됩니다. 외부에 공유할 때는 반드시 비밀번호를 바꿔 실행하세요. HTTPS 프록시 뒤에 배포한다면 `SESSION_SECRET`, `COOKIE_SECURE=true`도 함께 설정하세요.

## 포함 기능

- 해수어항/담수어항 다중 관리
- 해수/담수 타입별 수질 입력 항목 분리
- 생물, 장비, 일정, 수질 기록 관리
- 수질 그래프와 모바일 반응형 대시보드
- 도감 기반 생물 선택과 합사 체크
- 어항 배경 선택 및 생물 위치 이동
- 로그인, 회원가입, 공유 저장
- Docker 배포와 파일 기반 상태 저장
