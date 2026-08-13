# Campus Drop 웹

Campus Drop의 공개 랜딩, 제휴 안내, 기린 방탈출 게임, 제휴업체 포털 및 운영자 포털을 담은 Next.js/TypeScript 웹 프로젝트입니다.

## 빠른 실행

필요 조건은 Node.js `>=22.13.0`과 npm입니다. 잠금 파일과 일치하는 의존성을 설치한 뒤 개발 서버를 시작합니다.

```bash
npm ci
npm run dev
```

개발 서버가 출력한 주소(기본 `http://localhost:3000`)로 접속합니다. 종료는 터미널에서 `Ctrl+C`를 누릅니다.

의존성을 의도적으로 변경할 때만 `npm install`을 사용하고, 일반적인 실행·검증에는 `npm ci`를 사용합니다.

## 주요 경로

공개 화면에는 게임과 제휴 안내만 연결합니다.

- `/` — 공개 랜딩
- `/partner` — 공개 제휴 안내
- `/games/giraffe` — 기린 방탈출 게임
- `/editor` — 이전 제작 도구 경로의 안내 화면. 실제 도구는 `/admin/editor`입니다.
- `/admin/*`, `/partner/*` — 서버 인증·역할 검증이 필요한 포털 경로

현재 포털은 백엔드의 HttpOnly 세션·역할·소속 검증 API가 아직 연결되지 않았으므로, `/admin`, `/partner/dashboard` 등에서 **데이터 없는 연동 대기 화면**을 보여 줍니다. 브라우저 저장소의 역할 플래그나 데모 계정으로 포털 데이터를 노출하지 않습니다.

## 환경 변수

공개 화면과 연동 대기 포털을 실행하는 데 환경 변수는 필요하지 않습니다.

백엔드 API 요청을 연결하는 단계에서만 프로젝트 루트에 `.env.local`을 만들고 다음 값을 설정합니다.

```bash
VITE_CAMPUSDROP_API_BASE_URL=http://127.0.0.1:8080
```

값은 경로·쿼리·인증 정보가 없는 `http` 또는 `https` **origin**이어야 합니다. 예: `https://api.example.com`.
`VITE_`로 시작하는 값은 브라우저 번들에 포함되므로 비밀키·토큰·비밀번호를 넣으면 안 됩니다. 예시 값은 [.env.example](.env.example)에 있습니다.

## 프로덕션 실행

```bash
npm run build
npm run start
```

프로덕션 실행도 환경 변수 없이 시작할 수 있으며, 실제 보호 기능과 포털 데이터는 백엔드 세션 API가 연결된 뒤에만 활성화합니다.

## 검증

```bash
npm run lint
npm run test:api-client
npm run build
```

개발 서버를 켠 뒤에는 아래 경로가 각각 응답하는지 확인합니다.

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/partner
curl -I http://localhost:3000/games/giraffe
curl -I http://localhost:3000/editor
curl -I http://localhost:3000/admin
curl -I http://localhost:3000/partner/dashboard
```

`/admin`은 `/admin/dashboard`로 리디렉션될 수 있습니다. 인증 연동 전에는 포털 데이터가 아닌 연동 대기 화면이 정상 결과입니다.

## 모바일 기린 게임 확인

기린 게임은 카메라·위치·Kakao 지도·전체 화면 레이아웃을 사용합니다. 카메라와 위치 권한은 일반적으로 `localhost` 또는 HTTPS에서만 허용됩니다. 실제 모바일 기기에서는 HTTPS 프리뷰/터널 또는 배포 주소에서 권한과 게임 흐름을 별도로 확인해야 합니다.

게임의 경로·퍼즐·장면 전환·정적 자산·전역 게임 CSS는 포털 작업과 분리해 유지합니다.
