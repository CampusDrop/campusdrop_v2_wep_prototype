# CampusDrop 웹 프로토타입 백엔드 API 연동

## 환경변수와 휴대폰 테스트

프로젝트 루트에서 `.env.example`을 참고해 개발자별 `.env.local`을 만든다. `.env.local`은 Git에서 무시되며 공유하지 않는다.

```env
VITE_CAMPUSDROP_API_BASE_URL=http://192.168.x.x:8080
```

휴대폰 테스트에서는 Mac과 휴대폰을 같은 Wi-Fi에 연결하고, Mac의 실제 내부 IP를 사용한다. 휴대폰의 `localhost`는 휴대폰 자신을 가리키므로 백엔드가 있는 Mac에 연결되지 않는다. 서버 방화벽과 백엔드 CORS 설정도 개발 웹 앱의 origin을 허용해야 한다. CORS는 백엔드 책임이며 이 웹 프로젝트에서 우회하거나 비활성화하지 않는다.

현재 LAN/Vite 조합은 백엔드의 `local` 프로필을 다음처럼 시작한다. 이 값은 API 주소가 아니라 **브라우저가 실제로 로드된 Vite origin**이다.

```bash
CORS_ALLOWED_ORIGINS=http://172.19.24.190:5173 ./gradlew :apps:api-server:bootRun
```

여러 개발 origin이 필요하면 쉼표로 명시한다.

```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://172.19.24.190:5173 ./gradlew :apps:api-server:bootRun
```

변수 없이 `local` 프로필을 실행하면 `http://localhost:5173`과 `http://127.0.0.1:5173`만 허용된다. 실행 중인 서버의 환경변수는 갱신되지 않으므로 LAN origin을 추가하거나 바꾼 뒤에는 백엔드를 다시 시작해야 한다. 스테이징·운영에서는 신뢰하는 정확한 HTTPS origin만 배포 환경변수로 허용하고, `*` 와일드카드, 사설망 패턴, 쿠키 credential 허용을 설정하지 않는다.

## API Base URL 규칙

- 클라이언트의 유일한 base URL 입력은 `VITE_CAMPUSDROP_API_BASE_URL`이다.
- 값은 `http` 또는 `https` origin만 허용한다. 사용자 정보, 경로, query, hash를 포함하지 않는다.
- 끝의 `/`는 설정 모듈이 정규화한다.
- 화면과 컴포넌트는 base URL, IP, 포트, `localhost`를 직접 쓰지 않는다. 화면은 도메인 API 모듈만 호출하고, 도메인 모듈은 공통 HTTP client만 사용한다.

```text
페이지/컴포넌트
  → 도메인 API 모듈
  → 공통 API client
  → VITE_CAMPUSDROP_API_BASE_URL
```

개발 연결 상태 페이지는 `/api-status`이며 `GET /api/v1/status`를 호출한다. 인증 없이 응답 `data.status`가 정확히 `"UP"`일 때만 “백엔드 연결됨”으로 표시한다. 그 외 응답이나 네트워크 실패는 “백엔드에 연결할 수 없음”으로 표시한다.

백엔드 확인 도구는 base URL 뒤에 다음 경로를 붙여 사용한다.

- Swagger UI: `/swagger-ui/index.html`
- OpenAPI JSON: `/v3/api-docs`

## 공통 응답과 오류

백엔드 응답은 다음 envelope을 사용한다.

```ts
{
  success: boolean;
  data: T;
  error: { code?: string; message?: string; details?: unknown } | null;
  timestamp: string;
  traceId: string;
}
```

`app/lib/api/client.ts`는 이 envelope을 검증한 뒤 `data`만 도메인 API 모듈에 전달한다. `401`, `403`, `409`, `422`, 그 밖의 HTTP 실패, envelope 실패, 잘못된 JSON envelope, 네트워크 실패, 취소 요청을 구분 가능한 `ApiClientError`로 정규화한다. 문제를 문의할 때는 민감 값 없이 `traceId`만 전달한다.

Bearer가 필요한 도메인 API는 `createApiClient({ getAccessToken })` 또는 요청의 `accessToken`을 사용한다. client가 비어 있지 않은 토큰에만 `Authorization: Bearer <accessToken>`을 붙인다. 토큰을 URL, 로그, 화면 문자열에 넣지 않는다.

## 현재 연결 가능한 주요 API와 화면 대상

정확한 필드와 enum은 [OpenAPI 계약](../../campusdrop_v2_backend/contracts/openapi/openapi.yaml)을 우선한다.

| 영역 | 주요 API | 웹 화면 연결 대상 |
| --- | --- | --- |
| 상태 | `GET /api/v1/status` | `/api-status` 개발 연결 확인 |
| 공개 테마 | `GET /api/v1/themes`, `GET /api/v1/themes/{themeId}` | 홈, 테마 목록, 테마 상세 |
| 프로필·학교 인증 | `/api/v1/me/*`, `/api/v1/verification/*` | 로그인 이후 온보딩, MY |
| 탐험대·게임 | `/api/v1/expeditions`, `/api/v1/game-sessions/*` | 탐험대, 게임 준비·진행·결과 |
| 커뮤니티·일일 유물 | `/api/v1/community/*`, `/api/v1/daily-artifacts/*` | 캠퍼스 라운지, 테마별 비밀방, 일일 유물 |
| 친구·알림·보상 | `/api/v1/friends/*`, `/api/v1/notifications/*`, `/api/v1/me/marker-rewards` | 친구, 알림, 리워드 |

게임 명령은 서버 권위형이며 `Idempotency-Key`와 `clientEventId`를 같은 값으로 사용한다. 실시간 채팅·presence·Marker 진행은 `/ws` STOMP/SockJS 계약을 별도 도메인 모듈로 추가한다. Maker API는 일반 플레이어 Bearer 토큰이 아닌 운영자 `X-Admin-Session` 전용이므로 플레이어 화면에서 사용하지 않는다.

## 환경별 교체와 비밀 관리

개발·스테이징·운영은 동일한 환경변수 이름을 사용하고, 각 배포 환경의 `VITE_CAMPUSDROP_API_BASE_URL` 값만 해당 공개 API origin으로 교체한다. 배포 값은 배포 플랫폼의 환경변수 설정에 등록하고, 변경 후 새 클라이언트 번들을 빌드한다.

`VITE_` 접두사 값은 브라우저 번들에 공개된다. 따라서 `.env.local`에는 API origin처럼 공개되어도 되는 연결 정보만 둔다. access token, 관리자 세션, 결제 비밀, 개인 정보는 `.env.local`이나 어떤 `VITE_` 변수에도 넣지 않는다.
