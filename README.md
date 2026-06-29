# AquariumWeb

해수어항 관리 웹앱 프로토타입입니다.

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다.

공유 저장이 필요하면 Docker로 실행합니다.

```powershell
docker build -t aquarium-web .
docker run --name aquarium-web -p 4174:4174 -v ${PWD}\data:/data aquarium-web
```

브라우저에서 `http://localhost:4174`로 접속합니다. 같은 서버 주소로 접속한 사람들은 `data/state.json`을 통해 생물, 수질, 장비, 일정 데이터를 공유합니다.

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
- 정적 파일로 직접 열면 브라우저 localStorage 저장
