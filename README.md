# AquariumWeb

해수어항 관리 웹앱 프로토타입입니다.

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다.

로그인과 공유 저장이 필요하면 서버로 실행합니다. `index.html`을 직접 열면 로그인 서버가 없기 때문에 공유 로그인 모드가 아닙니다.

```powershell
.\start-server-4174.ps1
```

브라우저에서 `http://127.0.0.1:4174`로 접속하고 개발용 기본 계정 `admin` / `aquarium`으로 로그인합니다.

같은 Wi-Fi의 폰이나 다른 PC에서는 실행 스크립트에 표시되는 `http://192.168.x.x:4174` 형태의 주소로 접속합니다. 접속이 안 되면 Windows 방화벽에서 4174 포트를 허용해야 합니다.

계정을 바꿔 실행하려면 다음처럼 실행합니다.

```powershell
.\start-server-4174.ps1 -Username reef -Password "my-strong-password"
```

Docker로 실행할 수도 있습니다.

```powershell
docker build -t aquarium-web .
docker run --name aquarium-web -p 4174:4174 -e APP_USERNAME=admin -e APP_PASSWORD=change-me -v ${PWD}\data:/data aquarium-web
```

브라우저에서 `http://localhost:4174`로 접속합니다. 같은 서버 주소로 접속한 사람들은 로그인 후 `data/state.json`을 통해 생물, 수질, 장비, 일정 데이터를 공유합니다.

`APP_USERNAME`, `APP_PASSWORD`를 생략하면 개발용 기본 계정 `admin` / `aquarium`이 사용됩니다. 외부에 공유할 때는 반드시 비밀번호를 바꿔 실행하세요. HTTPS 프록시 뒤에 배포한다면 `COOKIE_SECURE=true`도 함께 설정할 수 있습니다.

## 포함 기능

- 실제 어항 느낌의 대시보드 UI
- 귀여운 3D 렌더 기반 어항 화면과 등록 생물 시각화
- 환수/먹이/장비 관리 일정
- 수온, 염도, 알칼리티, 질산염, 암모니아, 인산염 수질 기록
- 최근 수질 그래프
- 생물 등록, 위치 이동, 상태/메모 수정 및 삭제
- 장비 등록, 상태 수정 및 삭제
- 해수어 도감 및 간단 합사 체크
- Docker 실행 시 서버 공유 저장
- Docker/API 모드 로그인 및 로그아웃
- 정적 파일로 직접 열면 브라우저 localStorage 저장
