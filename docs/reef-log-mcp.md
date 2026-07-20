# Reef Log MCP Server

리프로그 데이터를 MCP 클라이언트에서 조회하거나 일부 항목을 추가할 수 있는 stdio MCP 서버입니다.

## 실행

```powershell
npm run mcp:reef-log
```

## MCP 클라이언트 설정 예시

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
