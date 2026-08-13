# 방탈출 게임 도메인 확장 명세

> 대상: 이미 플랫폼 공통 백엔드(사용자, 인증, 게임, 웹, 업로드, 에셋, 기본 API)를 구현 중인 백엔드 AI
>
> 목적: 기존 구조를 재구성하지 않고, Maker로 만드는 방탈출 게임에 필요한 데이터와 API만 추가한다.

## 0. 이 문서의 범위

### 이미 있다고 가정하는 것 — 새로 만들지 말 것

- 사용자·조직·권한·인증
- 기존 게임 또는 콘텐츠의 기본 엔터티
- 파일 업로드, 스토리지, CDN, 공통 `Asset` 엔터티
- 관리자 웹, API 인증, 공통 에러 처리
- 기본 게임 목록·상세·공개/비공개 기능
- 앱 설치·기기 정보 등 플랫폼 공통 기능

### 이번에 추가할 것

1. 기존 게임에 연결되는 방탈출 전용 **버전 콘텐츠**
2. 장면, 내용 블록, 기믹, 연출, 종료 방식, 증거물
3. 게임 시작 전 내려받을 **오프라인 실행 패키지**
4. 플레이 진행과 증거물 인벤토리 기록

기존 테이블 이름이 다르면 아래의 `existing_game_id`, `existing_asset_id`, `existing_user_id`를 실제 테이블의 FK로 바꾼다. `games`, `assets`, `users`를 중복 생성하지 않는다.

---

## 1. 도메인 연결 방식

방탈출은 기존 `Game`의 한 종류이거나, 기존 게임에 붙는 확장 콘텐츠다.

```text
Existing Game
 └─ Existing Game Version / Release
     └─ Escape Game Definition
         ├─ Escape Scene[]
         │   ├─ Presentation
         │   ├─ Block[] (content | mechanic)
         │   ├─ Ending
         │   └─ Reward[]
         └─ Download Manifest

Existing Player
 └─ Escape Play Session
     ├─ Progress/Event[]
     └─ Acquired Reward[]
```

### 필수 원칙

- `published` 상태의 방탈출 콘텐츠는 수정 금지다. 수정은 기존 플랫폼의 새 게임 버전/릴리스에 붙인다.
- 장면 번호는 저장하지 않는다. 드래그 정렬 값으로부터 계산한다.
- 실제 GPS·카메라·AR 판정은 iOS/Android 기기에서 수행한다. 서버는 규칙과 결과만 저장한다.
- 서버는 플레이어의 원본 위치 좌표·이동 경로·카메라 프레임을 저장하지 않는다.

---

## 2. 추가 테이블

아래 테이블은 권장 논리 모델이다. 기존 DB 규칙에 따라 이름·PK 타입·감사 컬럼은 맞춘다.

### 2.1 `escape_game_definitions`

기존 게임 버전 하나에 연결되는 방탈출의 전체 설정이다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID | PK |
| `existing_game_id` | FK | 기존 게임 엔터티 FK |
| `existing_game_version_id` | FK | 기존 게임 버전/릴리스 FK. 배포 콘텐츠의 기준점 |
| `theme` | enum | `mystery`, `horror`, `fantasy`, `adventure`, `romance` |
| `tone` | enum | Maker의 8개 게임 톤 |
| `case_number` | varchar | 사건번호. 표시용 식별자 |
| `summary` | text | 한 줄 소개 |
| `cover_asset_id` | FK nullable | 기존 Asset FK |
| `color_tokens` | jsonb | Identity에서 선택한 색상 토큰 |
| `font_token` | varchar nullable | 앱 공통 폰트 토큰 |
| `estimated_seconds` | integer | 전체 예상 시간 |
| `schema_version` | integer | 콘텐츠 JSON 계약 버전 |
| `created_at`, `updated_at` | timestamptz | 기존 감사 규칙 사용 |

유니크 권장: `(existing_game_version_id)`.

`color_tokens` 예시:

```json
{
  "primary": "#79F0BD",
  "secondary": "#0D1C19",
  "special": "#F5C867",
  "text": "#F7FFF9",
  "background": "#07110F",
  "forbidden": "#FF5D6C"
}
```

색상은 장면·카드에 복사 저장하지 않는다. 앱은 이 토큰을 공통 화면, 메신저, 연출, 버튼에 적용한다.

### 2.2 `escape_scenes`

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID | PK |
| `escape_game_definition_id` | FK | 소속 방탈출 |
| `sort_key` | varchar 또는 bigint | 드래그 정렬값 |
| `title` | varchar | 필수 장면 제목 |
| `subtitle` | varchar nullable | 소제목 |
| `title_visible` | boolean | 적용 화면 제목 노출 여부 |
| `subtitle_visible` | boolean | 적용 화면 소제목 노출 여부 |
| `estimated_seconds` | integer | 장면 예상 시간 |
| `status` | enum | `active`, `hidden` |

정렬은 `1, 2, 3` 같은 챕터 번호가 아니라 간격 있는 정렬값(`1000`, `2000`) 또는 LexoRank를 사용한다. 중간에 장면을 넣거나 드래그할 때 전체 레코드를 갱신하지 않기 위해서다.

### 2.3 `escape_scene_presentations`

장면 진입 직전에만 보이고 사라지는 연출이다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `scene_id` | FK/PK | 장면당 하나 |
| `template_id` | enum | 앱이 해석하는 연출 템플릿 ID |
| `content` | text nullable | 연출 중 보여줄 문구 |
| `duration_ms` | integer | 연출 길이 |

```ts
type PresentationTemplate =
  | "none"
  | "record_transfer"
  | "emergency_signal"
  | "wave"
  | "field_open"
  | "evidence_found";
```

서버에는 템플릿 ID와 문구만 저장한다. SwiftUI/Compose 애니메이션 세부 구현값을 저장하지 않는다.

### 2.4 `escape_scene_blocks`

내용과 기믹의 실제 플레이 순서를 하나의 목록으로 관리한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID | PK |
| `scene_id` | FK | 장면 |
| `sort_key` | varchar 또는 bigint | 실제 플레이 순서 |
| `kind` | enum | `content`, `mechanic` |
| `is_required` | boolean | 다음 블록 해금에 필요한지 |
| `completion_rule` | enum | `auto`, `viewed`, `action_completed` |

플레이 규칙:

```text
정렬된 블록 중 첫 번째 미완료 필수 블록만 활성화한다.
그 이후 블록의 버튼, GPS, AR은 비활성화한다.
모든 필수 블록이 끝난 뒤에만 장면 종료 버튼이 활성화된다.
```

정보 카드는 `auto`, 메신저·NPC 대화·기믹은 보통 `action_completed`다.

### 2.5 `escape_content_blocks`

`escape_scene_blocks.kind = content`의 상세 정보다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `scene_block_id` | FK/PK | 부모 블록 |
| `content_type` | enum | `info_card`, `messenger`, `npc_dialogue` |
| `payload` | jsonb | 타입별 상세 데이터 |

`payload` 예시:

```json
// 정보 카드
{
  "label": "사건 개요",
  "title": "목격 신고 접수",
  "body": "시계탑 근처에서 기린을 보았다는 신고가 들어왔습니다.",
  "image_asset_id": "existing_asset_uuid"
}
```

```json
// 메신저 대화
{
  "sender": "DROPLINK",
  "notification": "새로운 메시지가 도착했습니다.",
  "messages": ["현장 사진을 확인해 주세요.", "노란 포스터를 카메라로 비춰 보세요."],
  "header_asset_id": "existing_asset_uuid"
}
```

```json
// NPC 대화
{
  "sender": "목격자 윤서",
  "npc_asset_id": "existing_asset_uuid",
  "presentation": "face",
  "text_speed": "normal",
  "messages": ["사진 속 기린이 움직인 것 같았어요.", "노란 빛이 시계탑 안쪽으로 이어졌습니다."]
}
```

메신저·NPC 대사는 한 덩어리 텍스트가 아니라 문자열 배열로 저장한다. 앱이 한 줄씩, 타이핑되는 것처럼 표시할 수 있어야 한다.

### 2.6 `escape_mechanic_blocks`

`escape_scene_blocks.kind = mechanic`의 상세 데이터다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `scene_block_id` | FK/PK | 부모 블록 |
| `mechanic_type` | enum | 아래 기믹 타입 |
| `config_version` | integer | 기믹 설정 구조 버전 |
| `config` | jsonb | 타입별 설정 |
| `estimated_seconds` | integer | 기믹 예상 시간 |

```ts
type MechanicType =
  | "none"
  | "gps_arrival"
  | "direction_tracking"
  | "image_recognition"
  | "ar_treasure_hunt"
  | "card_ordering"
  | "text_answer";
```

`config`를 JSONB로 저장하되, 백엔드는 `mechanic_type + config_version`별 DTO/JSON Schema 검증을 반드시 수행한다.

#### 공통 위치 객체

```json
{
  "name": "시계탑 안내판",
  "address": "서울 광진구 능동로 120",
  "latitude": 37.550416,
  "longitude": 127.073818,
  "radius_meters": 20
}
```

- 실제 판정 기준은 좌표·반경이다. 주소는 제작자 확인·지도 검색용이다.
- 위도·경도는 `numeric(9, 6)` 이상으로 저장한다.
- `radius_meters`는 서버에서 `10~500` 범위를 검증한다. 기본값은 실외 20m 권장이다.

#### 이미지 인식 — `image_recognition`

```json
{
  "start_location": { "name": "시계탑 안내판", "latitude": 37.550416, "longitude": 127.073818, "radius_meters": 20 },
  "reference_asset_id": "existing_asset_uuid",
  "reference_physical_width_meters": 0.42,
  "target_description": "노란 기린 포스터",
  "action_label": "이미지 인식 시작",
  "success_message": "기린의 흔적을 발견했습니다."
}
```

완료 조건:

```text
이전 필수 블록 완료
+ GPS 반경 내부
+ 카메라/AR 권한 허용
+ 기준 이미지 인식 성공
= 완료
```

필수 검증:

- 기준 이미지 에셋 필수
- 실제 가로 길이(`reference_physical_width_meters`) 필수, 0 초과
- 기준 이미지는 평평하고 고대비인 실제 설치물이어야 함
- 이미지 인식용 에셋에는 일반 카드 이미지와 구분되는 `purpose = reference_image` 메타데이터 권장

#### AR 보물찾기 — `ar_treasure_hunt`

```json
{
  "start_location": { "name": "시계탑 앞 산책로", "latitude": 37.550416, "longitude": 127.073818, "radius_meters": 20 },
  "required_surface": "floor",
  "minimum_plane_area_m2": 0.6,
  "reveal_mode": "center_raycast",
  "treasure_name": "빛나는 기린 발자국",
  "reveal_asset_id": "existing_asset_uuid",
  "action_label": "바닥에서 보물 찾기",
  "success_message": "바닥에서 숨은 보물을 발견했습니다."
}
```

완료 조건:

```text
이전 필수 블록 완료
+ GPS 반경 내부
+ 카메라/AR 권한 허용
+ 수평 바닥 평면 인식
+ 화면 중앙 레이캐스트가 바닥에 적중
= 보물 표시 및 완료
```

중요: “바닥을 바라본다”를 기기 기울기 값만으로 판정하지 않는다. 네이티브 앱이 AR 바닥 평면과 화면 중앙 레이캐스트를 모두 확인해야 한다. `reveal_asset_id`는 선택이다. 초기 버전은 이미지·빛·텍스트만으로도 가능하다.

### 2.7 `escape_scene_endings`

| 필드 | 타입 | 설명 |
|---|---|---|
| `scene_id` | FK/PK | 장면당 하나 |
| `mode` | enum | `none`, `submission`, `messenger` |
| `action_label` | varchar | 다음 장면 버튼 문구 |
| `config` | jsonb | 종료 방식 상세 |

```json
// 진행률
{
  "title": "기록을 분석하고 있습니다",
  "body": "현장 자료를 정리하고 있습니다.",
  "duration_seconds": 3
}
```

`duration_seconds`는 1~5초 범위로 검증한다. 종료 버튼은 모든 필수 블록을 끝내기 전에는 비활성 상태다.

### 2.8 `escape_rewards`

기믹 보상과 장면 종료 보상을 하나의 구조로 관리한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID | PK |
| `scene_id` | FK | 소속 장면 |
| `source` | enum | `mechanic`, `scene_ending` |
| `trigger_block_id` | FK nullable | 지급을 발생시키는 블록 |
| `name`, `description` | text | 증거물 정보 |
| `asset_id` | FK nullable | 기존 Asset FK |
| `asset_type` | enum | `image`, `model`, `none` |
| `presentation` | enum | 현재는 `modal` |
| `quantity` | smallint | 현재 제품 규칙상 1 고정 |

한 획득 이벤트에는 증거물 하나만 지급한다. 기믹 보상과 하단의 추가 증거물 획득은 `source`만 다르다.

---

## 3. 오프라인 패키지 확장

기존 다운로드/배포 시스템이 있다면, 방탈출은 새 파일 시스템이 아니라 기존 게임 버전에 붙는 `escape_manifest.json`을 생성한다.

```json
{
  "manifest_version": 1,
  "existing_game_version_id": "existing_version_uuid",
  "escape_definition_id": "escape_uuid",
  "content_hash": "sha256:...",
  "identity": { "...": "..." },
  "scenes": [],
  "blocks": [],
  "rewards": [],
  "required_assets": [
    {
      "asset_id": "existing_asset_uuid",
      "download_url": "existing-signed-url",
      "sha256": "...",
      "byte_size": 182000
    }
  ]
}
```

기존 에셋 API를 이용한다. 방탈출 확장은 에셋 테이블·업로드 API·CDN을 다시 만들지 않는다.

배포 전 검증:

1. 제목과 장면 정렬값이 유효한가
2. 모든 내용·기믹 블록이 부모 장면을 가지는가
3. 이미지 인식의 기준 이미지·실제 가로 길이가 있는가
4. GPS/AR 기믹의 좌표·반경이 있는가
5. 참조한 기존 에셋이 모두 `ready` 상태인가
6. 모든 필수 에셋이 매니페스트에 포함됐는가

---

## 4. 플레이 기록 확장

기존 플레이 세션/진행 기록이 있으면 이를 확장한다. 없다면 아래 두 테이블만 추가한다.

### `escape_play_sessions`

| 필드 | 설명 |
|---|---|
| `id` | 세션 ID |
| `existing_user_id` | 기존 사용자 FK 또는 익명 설치 ID |
| `existing_game_version_id` | 플레이한 정확한 기존 게임 버전 |
| `escape_definition_id` | 방탈출 정의 |
| `current_scene_id` | 최근 장면 |
| `state` | `active`, `completed`, `abandoned` |
| `started_at`, `completed_at` | 플레이 시간 |

### `escape_play_events`

```json
{
  "session_id": "session_uuid",
  "idempotency_key": "uuid",
  "sequence": 18,
  "event_type": "mechanic_completed",
  "scene_id": "scene_uuid",
  "block_id": "block_uuid",
  "occurred_at_device": "2026-08-04T12:34:56Z",
  "payload": { "mechanic_type": "ar_treasure_hunt" }
}
```

유니크 제약: `(session_id, idempotency_key)`.

앱은 오프라인에서 이벤트를 로컬 큐에 저장하고, 복구 시 `sequence` 순으로 기존 동기화 API에 전송한다. 서버는 이전 필수 블록이 완료됐는지를 확인하고, 중복 이벤트·중복 보상 지급을 막는다.

서버에 저장하지 않는 것:

- 실제 위도·경도·이동 경로
- 카메라 영상·이미지 프레임
- AR 평면·기기 자세 데이터

서버 이벤트에는 `location_gate_passed`, `image_recognized`, `floor_plane_found`처럼 결과만 저장한다.

---

## 5. 기존 API에 추가할 최소 엔드포인트

기존 API 규칙·네이밍·권한 체계를 따른다. 아래는 논리적 기능만 정의한다.

| 기능 | 요청 내용 |
|---|---|
| 방탈출 초안 조회 | 기존 게임 버전에 연결된 `EscapeGameDefinition` 및 하위 데이터 반환 |
| 방탈출 초안 저장 | Identity, 장면, 블록, 기믹, 종료 방식, 증거물 수정 |
| 장면/블록 재정렬 | `sort_key`만 갱신 |
| 배포 전 검증 | 에셋·기믹·순서·필수 필드 검사 |
| 배포 패키지 조회 | 기존 게임 버전의 `escape_manifest.json` 반환 |
| 세션 시작 | 기존 유저와 기존 게임 버전을 연결한 방탈출 세션 생성 |
| 진행 동기화 | 오프라인 이벤트 묶음 수신, 순서·중복 검증 후 결과 반환 |
| 인벤토리 조회 | 획득한 `escape_rewards` 반환 |

별도의 사용자·로그인·파일 업로드·게임 목록 API는 만들지 않는다.

---

## 6. Swift/Kotlin 담당자에게 전달할 계약

앱이 읽을 공통 계약:

- `escape_manifest.json`의 `schema_version`
- Identity 색 토큰
- 장면 정렬 순서와 제목 노출 설정
- 블록 정렬 순서·잠금 규칙
- 이미지 인식의 GPS 범위·기준 이미지·실제 가로 길이
- AR 보물찾기의 GPS 범위·`required_surface = floor`·중앙 레이캐스트 조건
- 종료 방식과 증거물 모달 정보

네이티브 앱의 책임:

| 기능 | 앱이 실제로 수행할 일 |
|---|---|
| GPS | 현재 위치와 `start_location` 반경 비교 |
| 이미지 인식 | 기준 이미지 인식 성공 여부 판정 |
| AR 보물찾기 | 바닥 평면 인식 + 화면 중앙 레이캐스트 판정 |
| 권한 | 필요한 블록 진입 시 위치·카메라 권한 요청 |
| 오프라인 | 패키지·에셋 캐시, 이벤트 큐 저장·재전송 |
| 완료 | 결과 이벤트만 백엔드에 동기화 |

참고 구현 자료:

- iOS 이미지 인식: <https://developer.apple.com/documentation/arkit/detecting-images-in-an-ar-experience>
- iOS 평면 인식: <https://developer.apple.com/documentation/arkit/understanding-world-tracking>
- Android ARCore 이미지 인식: <https://developers.google.com/ar/develop/augmented-images>
- Android ARCore 평면 인식: <https://developers.google.com/ar/develop/fundamentals>

---

## 7. 구현 순서

1. 기존 게임 버전에 `escape_game_definitions`를 연결
2. 장면·블록·기믹·연출·종료·증거물 테이블과 초안 API 추가
3. 기존 Asset을 참조하는 매니페스트 생성 및 배포 전 검증 추가
4. 플레이 세션·이벤트·증거물 지급을 기존 진행 시스템에 연결
5. iOS/Android에서 매니페스트 해석과 오프라인 이벤트 동기화 구현

이 확장은 기존 플랫폼을 대체하지 않는다. 기존 게임/버전/에셋/사용자/업로드 인프라 위에 방탈출 도메인만 얹는다.
