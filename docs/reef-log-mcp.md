# Reef Log MCP Server

리프로그 데이터를 MCP 클라이언트에서 조회하거나 일부 항목을 추가할 수 있는 MCP 서버입니다.

## 운영 HTTP Stream 연결

Vercel 운영 도메인에서는 다음 엔드포인트를 사용합니다.

```text
https://aqua.avokado.co.kr/api/mcp
```

MCP 클라이언트 설정 예시:

```json
{
  "mcpServers": {
    "reef-log": {
      "url": "https://aqua.avokado.co.kr/api/mcp"
    }
  }
}
```

인증은 OAuth 방식입니다.

1. MCP 클라이언트가 `https://aqua.avokado.co.kr/api/mcp`에 연결합니다.
2. 서버가 OAuth discovery 정보를 제공합니다.
3. 클라이언트가 리프로그 로그인 페이지로 이동합니다.
4. 사용자가 로그인합니다.
5. 권한 승인 페이지에서 MCP 연결을 승인합니다.
6. 클라이언트가 authorization code를 access token으로 교환합니다.
7. 이후 MCP 요청은 OAuth Bearer access token으로 인증됩니다.

OAuth endpoint:

- `https://aqua.avokado.co.kr/.well-known/oauth-protected-resource`
- `https://aqua.avokado.co.kr/.well-known/oauth-authorization-server`
- `https://aqua.avokado.co.kr/oauth/authorize`
- `https://aqua.avokado.co.kr/oauth/token`
- `https://aqua.avokado.co.kr/oauth/register`

운영 환경에서는 아래 값을 명시하는 것을 권장합니다.

```powershell
REEFLOG_OAUTH_ISSUER=https://aqua.avokado.co.kr
SESSION_SECRET=replace-with-at-least-32-characters
COOKIE_SECURE=true
```

## 로컬 stdio 연결

로컬에서 stdio MCP 서버로도 실행할 수 있습니다.

```powershell
npm run mcp:reef-log
```

MCP 클라이언트 설정 예시:

```json
{
  "mcpServers": {
    "reef-log": {
      "command": "npm",
      "args": ["run", "mcp:reef-log"],
      "cwd": "C:\\Users\\PC-2\\source\\repos\\AquariumWeb"
    }
  }
}
```

## 지원 도구

- `reeflog_get_state`: 전체 저장 상태 조회
- `reeflog_list_tanks`: 어항 목록 조회
- `reeflog_get_tank`: 특정 어항 상세 조회
- `reeflog_list_water_logs`: 수질 로그 조회
- `reeflog_add_water_log`: 수질 로그 추가 또는 같은 날짜 갱신
- `reeflog_list_livestock`: 생물 목록 조회
- `reeflog_list_tasks`: 관리 일정 조회
- `reeflog_add_task`: 관리 일정 추가

## 저장소 선택

앱과 같은 저장소 설정을 사용합니다.

- `STORAGE_DRIVER=supabase` 또는 Supabase 환경변수가 있으면 Supabase `app_state`를 사용합니다.
- Supabase 환경변수가 없으면 `data/state.json`을 사용합니다.

Supabase 사용 시 필요한 환경변수:

```powershell
STORAGE_DRIVER=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STATE_KEY=default
```
