# Campus Drop 게임 제작·배포 백엔드 명세

> 대상: 게임 제작 Maker, 관리자 백엔드, iOS(Swift)·Android(Kotlin) 게임 앱을 함께 구현하는 AI/개발자
>
> 상태: 제품 설계 기준안 v1.0

## 1. 목표와 핵심 원칙

이 서비스는 여러 장면, 내용 블록, 기믹, 증거물, 연출을 조합해 현장형 방탈출 게임을 만드는 제품이다. 제작자는 Maker에서 초안을 편집하고, 플레이어는 네이티브 앱에서 게임을 다운로드한 뒤 현장에서 플레이한다.

백엔드의 역할은 실시간 게임 화면을 렌더링하는 것이 아니다. **버전이 고정된 게임 패키지를 조립·배포하고, 플레이 진행을 안전하게 기록하는 것**이다.

반드시 지킬 원칙:

1. 배포된 게임 버전은 수정하지 않는다. 수정은 새 버전을 만들어 배포한다.
2. 게임 실행에 필요한 장면·문구·이미지·기준 이미지·3D 모델은 기기에서 다운로드해 오프라인으로 동작해야 한다.
3. GPS, 카메라, 이미지 인식, 바닥 평면 인식의 실제 판정은 기기에서 수행한다.
4. 서버에는 원본 GPS 궤적이나 카메라 프레임을 저장하지 않는다. 완료 결과와 최소한의 운영 정보만 보관한다.
5. 콘텐츠 데이터는 iOS/Android 공통 JSON 계약으로 정의하고, Swift/Kotlin 화면 구현 상세는 서버 데이터에 넣지 않는다.

```text
Maker 초안
  → 검토 가능한 게임 버전
    → 배포된 다운로드 패키지
      → 플레이 세션 및 진행 이벤트
```

## 2. 전체 엔터티 관계

```text
Game
 └─ GameVersion (immutable once published)
     ├─ GameVersionSettings
     ├─ Scene[]
     │   ├─ ScenePresentation
     │   ├─ SceneBlock[]
     │   │   ├─ ContentBlock
     │   │   └─ MechanicBlock
     │   ├─ SceneEnding
     │   └─ Reward[]
     └─ GameVersionAsset[] → Asset

Player
 └─ PlaySession
     ├─ PlayEvent[]
     ├─ SessionBlockProgress[]
     └─ PlayerInventoryItem[] → Reward
```

## 3. 권장 저장소 구성

| 저장 대상 | 권장 저장 방식 | 비고 |
|---|---|---|
| 관계형 데이터 | PostgreSQL | 게임, 버전, 장면, 블록, 세션, 권한 |
| 공간 좌표 검색 | PostgreSQL + PostGIS 선택 | 운영 지점 검색·지도 관리에만 사용 |
| 이미지·GLB·오디오 | Object storage | DB에는 URL 대신 `asset_id` 저장 |
| 파일 배포 | 서명 URL + CDN | 게임 앱은 다운로드 패키지로 캐시 |
| 오프라인 진행 | 기기 로컬 DB | 앱에서 이벤트 큐를 만든 뒤 재접속 시 동기화 |

이미지나 GLB 바이너리를 관계형 DB 컬럼에 직접 넣지 않는다. 모든 화면은 `asset_id`를 통해 파일을 참조한다.

## 4. 제작 데이터 스키마

### 4.1 `games`

게임 자체의 정체성이다. 여기에는 아직 배포되지 않은 최신 초안이 아니라, 게임의 소유권과 대표 정보만 둔다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 게임 ID |
| `owner_id` | UUID | 제작자 또는 조직 ID |
| `title` | text | 게임 제목 |
| `case_number` | text | 사건번호. 게임 안에서는 표시용이며 유니크 제약 권장 |
| `summary` | text | 한 줄 소개 |
| `theme` | enum | `mystery`, `horror`, `fantasy`, `adventure`, `romance` |
| `created_at`, `updated_at` | timestamptz | 생성·수정 시각 |
| `published_version_id` | UUID nullable | 현재 공개 버전 |
| `status` | enum | `active`, `archived` |

`case_number`는 화면용 식별자다. 데이터베이스 PK나 보안 키로 사용하지 않는다.

### 4.2 `game_versions`

게임의 실제 설계도다. `published`가 된 레코드는 내용 수정 금지다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 버전 ID |
| `game_id` | UUID | 소속 게임 |
| `version_number` | text | 예: `1.0.0` |
| `status` | enum | `draft`, `review`, `published`, `archived` |
| `schema_version` | integer | 다운로드 매니페스트 구조 버전 |
| `estimated_seconds` | integer | 전체 예상 플레이 시간. 블록 예상 시간 합 + 기본 5분 |
| `created_by` | UUID | 마지막 편집자 |
| `published_at` | timestamptz nullable | 배포 시각 |
| `content_hash` | text | 패키지 전체 콘텐츠 무결성 확인용 |

유니크 제약: `(game_id, version_number)`.

초안 편집 중 충돌을 막기 위해 `revision` 또는 `updated_at` 기반 낙관적 잠금도 둔다. 저장 API는 마지막 읽기 시점의 `revision`을 함께 받고, 불일치하면 409 Conflict를 반환한다.

### 4.3 `game_version_settings`

Maker Identity에서 결정하는 시각·기본 설정을 버전별로 고정한다.

```json
{
  "tone": "documentary",
  "colors": {
    "primary": "#79F0BD",
    "secondary": "#0D1C19",
    "special": "#F5C867",
    "text": "#F7FFF9",
    "background": "#07110F",
    "forbidden": "#FF5D6C"
  },
  "font_token": "giraffe_display_v1",
  "minimum_app_version": {
    "ios": "1.0.0",
    "android": "1.0.0"
  },
  "offline_required": true
}
```

색상은 각 장면·내용 블록에 복사 저장하지 않는다. 앱은 항상 이 토큰을 공통 UI에 적용한다.

## 5. 장면과 연출 스키마

### 5.1 `scenes`

챕터와 장면은 같은 개념이다. `chapter_number`는 저장하지 않고 정렬 결과로 계산한다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 장면 ID |
| `game_version_id` | UUID | 소속 버전 |
| `sort_key` | text 또는 bigint | 드래그 정렬 기준 |
| `title` | text | 필수 장면 제목 |
| `subtitle` | text nullable | 소제목 |
| `title_visible` | boolean | 적용 화면 제목 노출 여부 |
| `subtitle_visible` | boolean | 적용 화면 소제목 노출 여부 |
| `estimated_seconds` | integer | 장면 예상 시간 |
| `status` | enum | `active`, `hidden` |

정렬에는 연속된 정수보다 간격 있는 값(`1000`, `2000`)이나 LexoRank 같은 문자열 키를 쓴다. 중간 삽입과 드래그 이동 때 전체 장면의 번호를 다시 쓰지 않아도 된다.

### 5.2 `scene_presentations`

장면 시작 시 잠깐 표시되고 사라지는 화면 전환 연출이다. 게임의 색 테마와는 별개다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `scene_id` | UUID | 장면 ID, PK 겸 FK |
| `template_id` | enum | 전환 애니메이션 ID |
| `content` | text nullable | 연출 중 표시할 문구 |
| `duration_ms` | integer | 애니메이션 길이 |

```ts
type PresentationTemplate =
  | "none"
  | "record_transfer"
  | "emergency_signal"
  | "wave"
  | "field_open"
  | "evidence_found";
```

서버에는 `template_id`와 문구만 저장한다. SwiftUI, Compose, Lottie, CSS 같은 플랫폼별 애니메이션 구현값은 앱 코드가 담당한다.

## 6. 내용·기믹 순서 스키마

장면 내부의 실제 플레이 순서는 하나의 공통 목록으로 관리한다. 이 구조가 있어야 “메신저를 모두 읽은 뒤 GPS 기믹이 활성화”되는 규칙을 구현할 수 있다.

### 6.1 `scene_blocks`

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 블록 ID |
| `scene_id` | UUID | 장면 ID |
| `sort_key` | text 또는 bigint | 장면 안의 실제 플레이 순서 |
| `kind` | enum | `content`, `mechanic` |
| `is_required` | boolean | 완료해야 다음 단계가 열리는지 |
| `completion_rule` | enum | `auto`, `viewed`, `action_completed` |

`auto`는 정보 카드처럼 즉시 완료로 간주되는 블록에 쓴다. 메신저·NPC 대화·기믹은 `action_completed`를 사용한다.

앱의 잠금 규칙:

```text
정렬된 블록 중 첫 번째 미완료 블록만 활성화한다.
이후 블록의 버튼·GPS·AR은 모두 비활성화한다.
장면 종료 방식은 모든 필수 블록이 완료된 뒤에만 활성화한다.
```

### 6.2 `content_blocks`

`scene_blocks.kind = content`인 경우의 상세 데이터다.

| `content_type` | 필요한 데이터 |
|---|---|
| `info_card` | 라벨, 제목, 본문, 카드 이미지 |
| `messenger` | 발신자, 알림 문구, 메시지 배열, 상단 이미지 |
| `npc_dialogue` | NPC 이름, NPC 이미지, 대사 배열, 연출 스타일, 글자 표시 속도 |

권장 JSON 예시:

```json
{
  "content_type": "messenger",
  "sender": "DROPLINK",
  "notification": "새로운 메시지가 도착했습니다.",
  "messages": [
    "현장 사진을 확인해 주세요.",
    "노란 포스터를 카메라로 비춰 보세요."
  ],
  "header_asset_id": "asset_uuid"
}
```

메신저 대사는 배열로 저장한다. 개행 문자가 포함된 하나의 텍스트로 저장하지 않는다. 앱은 배열의 한 항목씩 타이핑 애니메이션을 적용할 수 있다.

## 7. 기믹 스키마

### 7.1 공통 구조

`scene_blocks.kind = mechanic`인 블록은 `mechanic_blocks` 상세 레코드를 갖는다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `scene_block_id` | UUID | `scene_blocks` PK/FK |
| `mechanic_type` | enum | 기믹 종류 |
| `config_version` | integer | 설정 JSON의 구조 버전 |
| `config` | jsonb | 기믹별 설정 |
| `estimated_seconds` | integer | 예상 소요 시간 |

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

`config`는 유연성을 위해 JSONB로 저장하되, 서버에서는 `mechanic_type + config_version`에 따라 JSON Schema 또는 서버 DTO 검증을 반드시 수행한다. 검증되지 않은 임의 JSON을 앱에 전달하면 안 된다.

### 7.2 공통 위치 객체

GPS를 쓰는 모든 기믹은 같은 구조를 사용한다.

```json
{
  "name": "시계탑 안내판",
  "address": "서울 광진구 능동로 120",
  "latitude": 37.550416,
  "longitude": 127.073818,
  "radius_meters": 20
}
```

저장 규칙:

- 위도·경도는 `numeric(9, 6)` 이상의 정밀도로 저장한다.
- 주소는 제작자 확인용이며, 실제 판정 기준은 좌표와 반경이다.
- 반경은 `10~500m`처럼 서버에서 유효 범위를 검증한다. 기본값은 실외 20m 권장이다.
- PostGIS를 도입하면 좌표를 `geography(Point, 4326)`로 병행 저장해 운영 지도·근처 지점 검색에 사용한다.

### 7.3 이미지 인식 기믹

```json
{
  "start_location": {
    "name": "시계탑 안내판",
    "latitude": 37.550416,
    "longitude": 127.073818,
    "radius_meters": 20
  },
  "reference_asset_id": "asset_uuid",
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
+ 카메라 권한 허용
+ AR/카메라 추적 상태 정상
+ 기준 이미지 인식 성공
= 기믹 완료
```

필수 검증:

- `reference_asset_id`는 `purpose = reference_image`인 이미지 에셋이어야 한다.
- `reference_physical_width_meters`는 0보다 커야 한다.
- 기준 이미지는 실제 현장에서 평평하게 설치되는 이미지여야 한다.
- 업로드 시 대비·특징량·해상도 검사 결과를 기록한다.

iOS ARKit은 기준 이미지의 실제 물리 크기를 활용한다. Android ARCore도 기준 이미지의 특징량과 실제 크기 정보를 활용할 수 있으므로, 이 값은 제작 단계에서 필수로 받는다.

### 7.4 AR 보물찾기 기믹

```json
{
  "start_location": {
    "name": "시계탑 앞 산책로",
    "latitude": 37.550416,
    "longitude": 127.073818,
    "radius_meters": 20
  },
  "required_surface": "floor",
  "minimum_plane_area_m2": 0.6,
  "reveal_mode": "center_raycast",
  "treasure_name": "빛나는 기린 발자국",
  "reveal_asset_id": "asset_uuid",
  "action_label": "바닥에서 보물 찾기",
  "success_message": "바닥에서 숨은 보물을 발견했습니다."
}
```

`reveal_asset_id`는 선택 값이다. 초기 버전에는 2D 마커·빛·텍스트만으로도 충분하며, GLB 3D 모델은 성능 검증 후 추가한다.

완료 조건:

```text
이전 필수 블록 완료
+ GPS 반경 내부
+ 카메라 권한 허용
+ AR 추적 상태 정상
+ 수평 바닥 평면 인식
+ 화면 중앙 레이캐스트가 바닥 평면에 적중
= 보물 표시 및 기믹 완료
```

중요: “사용자가 바닥을 바라본다”를 기기 기울기 각도만으로 판정하지 않는다. 실제 AR 프레임에서 **바닥 평면을 찾고 화면 중앙 레이캐스트가 적중하는지**로 판정한다. 단색 바닥, 어두운 조명, 과도한 흔들림에서는 실패할 수 있으므로 앱에 재시도 상태와 안내 문구가 필요하다.

### 7.5 기타 기믹 예시

```json
// GPS 현장 도착
{ "locations": [{ "location": { "...": "..." }, "reward_id": "reward_uuid" }] }

// 정답 문자열 입력
{
  "question": "기록에서 발견한 암호를 입력하세요.",
  "answer": "기린",
  "case_sensitive": false,
  "action_label": "확인"
}

// 카드 배열
{
  "instruction": "목격 시각이 이른 순서로 배열하세요.",
  "card_asset_ids": ["asset_1", "asset_2", "asset_3"],
  "correct_order": ["card_2", "card_1", "card_3"]
}
```

정답 문자열은 평문으로 앱 패키지에 넣으면 쉽게 노출된다. 일반 체험 게임이면 허용할 수 있지만, 경쟁·보상·쿠폰이 걸린 게임이라면 서버 검증용 해시 또는 별도 검증 정책을 사용한다.

## 8. 종료 방식과 증거물

### 8.1 `scene_endings`

| 필드 | 형식 | 설명 |
|---|---|---|
| `scene_id` | UUID | 장면 ID |
| `mode` | enum | `none`, `submission`, `messenger` |
| `action_label` | text | 다음 장면으로 가는 버튼 문구 |
| `config` | jsonb | 종료 방식별 상세 설정 |

```json
// 진행률 종료
{
  "mode": "submission",
  "action_label": "증거물 제출하기",
  "title": "기록을 분석하고 있습니다",
  "body": "현장 자료를 정리하고 있습니다.",
  "duration_seconds": 3
}
```

`duration_seconds`는 1~5초 범위로 서버 검증한다. 종료 버튼은 장면의 모든 필수 블록이 끝날 때까지 비활성화한다.

### 8.2 `rewards`

증거물은 기믹 보상과 장면 종료 보상을 통합해 별도 엔터티로 둔다.

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 증거물 ID |
| `scene_id` | UUID | 소속 장면 |
| `source` | enum | `mechanic`, `scene_ending` |
| `trigger_block_id` | UUID nullable | 획득을 발생시키는 블록 |
| `name`, `description` | text | 증거물 정보 |
| `asset_id` | UUID nullable | 이미지 또는 3D 에셋 |
| `asset_type` | enum | `image`, `model`, `none` |
| `quantity` | integer | 현재 제품 규칙상 항상 1 |
| `presentation` | enum | 현재는 `modal` |

한 획득 이벤트에는 증거물 하나만 지급한다. 앱은 증거물의 소스와 상관없이 공통 획득 모달을 표시한다.

## 9. 에셋 스키마와 다운로드 패키지

### 9.1 `assets`

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | UUID | 에셋 ID |
| `owner_id` | UUID | 업로더 |
| `kind` | enum | `image`, `model`, `audio` |
| `purpose` | enum | `cover`, `card`, `npc`, `messenger`, `reward`, `reference_image`, `ar_reveal` |
| `storage_key` | text | 스토리지 내부 경로 |
| `mime_type` | text | MIME 타입 |
| `byte_size` | bigint | 용량 |
| `sha256` | text | 무결성 검사값 |
| `width`, `height` | integer nullable | 이미지 크기 |
| `status` | enum | `uploading`, `processing`, `ready`, `failed` |
| `metadata` | jsonb | 3D/이미지 인식 전용 메타데이터 |

기준 이미지 전용 메타데이터 예시:

```json
{
  "physical_width_meters": 0.42,
  "recognition_quality_score": 82,
  "flat_surface_required": true,
  "ios_ready": true,
  "android_ready": true
}
```

이미지 업로드 처리 파이프라인:

```text
업로드 URL 발급
→ 원본 업로드
→ 바이러스/형식/용량 검사
→ 썸네일·플랫폼별 변형 생성
→ 이미지 인식 품질 검사(기준 이미지인 경우)
→ asset.status = ready
```

이미지 인식용 에셋은 일반 카드 이미지와 다르게 승인 절차를 둔다. 실제 설치 크기, 고대비 여부, 평평한 설치물 여부, 저작권·사용 권한을 확인해야 한다.

### 9.2 `game_version_assets`

배포 버전이 실제로 참조하는 모든 에셋의 스냅샷 목록이다.

| 필드 | 설명 |
|---|---|
| `game_version_id` | 패키지 버전 |
| `asset_id` | 참조 에셋 |
| `required_before_play` | 게임 시작 전 필수 다운로드 여부 |
| `download_priority` | 다운로드 순서 |
| `role` | 카드/기준 이미지/증거물 등 사용 목적 |

`published` 전환 시 백엔드는 모든 장면·블록·보상이 참조하는 에셋을 분석해 이 목록을 고정한다. 누락·처리 중·실패 상태의 에셋이 하나라도 있으면 배포를 막는다.

### 9.3 앱 다운로드 매니페스트

앱이 받는 단일 계약이다. 모바일 앱은 여러 테이블 API를 조합하지 않고 이 매니페스트를 해석한다.

```json
{
  "manifest_version": 1,
  "game_id": "game_uuid",
  "game_version_id": "version_uuid",
  "version_number": "1.0.0",
  "content_hash": "sha256:...",
  "settings": { "...": "..." },
  "scenes": [],
  "blocks": [],
  "rewards": [],
  "assets": [
    {
      "asset_id": "asset_uuid",
      "download_url": "temporary-signed-url",
      "sha256": "...",
      "byte_size": 182000,
      "required_before_play": true
    }
  ]
}
```

앱은 모든 필수 에셋의 파일 크기와 SHA-256을 확인한 뒤에만 해당 버전을 `ready_to_play`로 표시한다.

## 10. 플레이 세션과 오프라인 동기화

### 10.1 `play_sessions`

| 필드 | 설명 |
|---|---|
| `id` | 세션 ID |
| `player_id` | 플레이어 ID 또는 익명 설치 ID |
| `game_version_id` | 반드시 특정 배포 버전을 참조 |
| `state` | `active`, `completed`, `abandoned` |
| `current_scene_id` | 최근 장면 |
| `started_at`, `completed_at` | 시간 기록 |

### 10.2 `play_events`

```json
{
  "idempotency_key": "uuid",
  "sequence": 18,
  "event_type": "mechanic_completed",
  "scene_id": "scene_uuid",
  "block_id": "block_uuid",
  "occurred_at_device": "2026-08-04T12:34:56Z",
  "payload": {
    "mechanic_type": "ar_treasure_hunt"
  }
}
```

규칙:

1. 앱은 이벤트를 로컬 큐에 먼저 저장한다.
2. 네트워크가 복구되면 `sequence` 순서대로 동기화한다.
3. 서버는 `(session_id, idempotency_key)` 유니크 제약으로 중복을 무시한다.
4. 서버는 이전 필수 블록이 완료되었는지 확인해 순서 위반 이벤트를 거부한다.
5. 증거물 지급은 이벤트 재전송에도 한 번만 이뤄져야 한다.

### 10.3 개인정보와 위치 정보

기본 방침:

- 서버는 원본 GPS 좌표, 이동 경로, 카메라 프레임을 저장하지 않는다.
- 서버 이벤트에는 `location_gate_passed: true` 같은 결과만 담는다.
- 문제 분석이 필요하면 위치가 아닌 권한 상태, GPS 정확도 구간, 실패 코드만 익명 집계한다.
- 플레이어가 삭제를 요청하면 세션·인벤토리·분석 데이터를 정책에 따라 삭제 또는 익명화한다.

GPS나 카메라 판정은 클라이언트 조작 가능성이 있다. 보상이 금전적이거나 희소하다면 별도 부정 사용 정책이 필요하다. 일반 체험 게임에서는 완벽한 위치 인증보다 개인정보 보호와 플레이 경험을 우선한다.

## 11. 권한·기기 호환성 정책

게임 버전 또는 장면에는 필요한 기기 기능을 명시한다.

```json
{
  "requirements": {
    "camera": true,
    "location": "when_in_use",
    "ar": true,
    "fallback_mode": "show_unavailable_message"
  }
}
```

권한은 앱 시작 직후가 아니라 실제 필요한 블록에 진입할 때 요청한다.

- 이미지 인식: 위치 권한 + 카메라 권한 + AR 지원 여부
- AR 보물찾기: 위치 권한 + 카메라 권한 + AR 지원 여부 + 평면 인식 가능 상태
- 일반 정보 카드: 권한 요청 없음

권한 거절 또는 AR 미지원 기기에서는 게임을 조용히 멈추지 않는다. 제작자가 선택할 수 있는 대체 정책을 둔다.

```ts
type FallbackMode =
  | "show_unavailable_message"
  | "manual_code"
  | "skip_with_confirmation";
```

## 12. 모바일 구현자가 확인할 항목

### iOS / Swift

1. Core Location의 현재 권한과 정확도 상태를 확인한다.
2. 장면 하나에 필요한 소수의 지점만 감시하거나, 앱 전면 플레이 중에는 현재 위치를 직접 비교한다.
3. 이미지 인식은 `ARReferenceImage`와 실제 물리 크기를 사용한다.
4. AR 보물찾기는 수평 평면 인식과 화면 중앙 레이캐스트를 조합한다.
5. AR 추적 품질이 낮으면 재시도 안내를 보여 준다.

### Android / Kotlin

1. 위치 권한·카메라 권한·ARCore 지원 여부를 기믹 시작 시 확인한다.
2. 앱 전면 플레이에서는 현재 위치 업데이트를 바탕으로 반경을 판정한다.
3. 이미지 인식은 ARCore Augmented Images용 기준 이미지 데이터베이스를 장면 단위로 구성한다.
4. AR 보물찾기는 수평 `Plane`과 중심 `HitResult`를 확인해 바닥 인식을 판정한다.
5. ARCore 설치·업데이트·미지원 기기 상태를 명확하게 안내한다.

### 공통 주의점

- iOS와 Android의 이미지 인식 성능·동시 추적 수·지원 기기가 다르므로, 게임 전체의 기준 이미지를 한 번에 활성화하지 말고 장면에 필요한 것만 준비한다.
- 이미지 인식은 오프라인으로 동작할 수 있어야 한다.
- AR 평면은 시간에 따라 추정값이 바뀔 수 있으므로, 인식 직후 즉시 완료 처리하지 말고 안정적인 평면·레이캐스트 조건을 짧게 확인하는 UX를 검토한다.
- 배터리 절약을 위해 AR 세션·정밀 위치 업데이트는 기믹이 활성화된 순간에만 시작하고, 완료·이탈 시 종료한다.

## 13. 최소 API 계약

### 제작자 API

| 메서드 | 경로 | 목적 |
|---|---|---|
| `POST` | `/games` | 게임 생성 |
| `GET` | `/games/{gameId}/draft` | 최신 초안 조회 |
| `PATCH` | `/game-versions/{versionId}` | 초안 메타데이터 수정 |
| `PUT` | `/scenes/{sceneId}` | 장면 수정 |
| `PUT` | `/scenes/{sceneId}/blocks:reorder` | 드래그 순서 변경 |
| `POST` | `/assets:upload-url` | 직접 업로드용 URL 발급 |
| `POST` | `/game-versions/{versionId}:validate` | 배포 전 검증 |
| `POST` | `/game-versions/{versionId}:publish` | 새 배포 버전 생성·공개 |

### 플레이어 앱 API

| 메서드 | 경로 | 목적 |
|---|---|---|
| `GET` | `/games/{gameId}/versions/{versionId}/manifest` | 다운로드 매니페스트 조회 |
| `POST` | `/play-sessions` | 세션 시작 |
| `POST` | `/play-sessions/{sessionId}/events:sync` | 오프라인 이벤트 일괄 동기화 |
| `GET` | `/play-sessions/{sessionId}` | 진행 상태 복구 |
| `GET` | `/inventory` | 유저 증거물 조회 |

배포 API는 항상 검증을 먼저 수행한다. 아래 중 하나라도 실패하면 `publish`를 거절한다.

- 제목 누락
- 장면 순서 중복
- 내용·기믹 순서 불일치
- 이미지 인식 기믹의 기준 이미지 또는 실제 크기 누락
- GPS 기믹의 좌표·반경 누락
- 참조 에셋 처리 실패 또는 패키지 누락
- 최소 앱 버전 미설정

## 14. 공식 플랫폼 확인 자료

- Apple Core Location 권한: <https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services>
- Apple 지리 조건 모니터링: <https://developer.apple.com/documentation/CoreLocation/monitoring-the-user-s-proximity-to-geographic-regions>
- Apple ARKit 이미지 인식: <https://developer.apple.com/documentation/arkit/detecting-images-in-an-ar-experience>
- Apple ARKit 월드 트래킹·평면 인식: <https://developer.apple.com/documentation/arkit/understanding-world-tracking>
- Android Geofencing: <https://developer.android.com/develop/sensors-and-location/location/geofencing>
- Android 권한 선언: <https://developer.android.com/training/permissions/declaring>
- Google ARCore Augmented Images: <https://developers.google.com/ar/develop/augmented-images>
- Google ARCore 핵심 개념·평면 인식: <https://developers.google.com/ar/develop/fundamentals>

## 15. 백엔드 구현 우선순위

1. `games`, `game_versions`, `scenes`, `scene_blocks`, `content_blocks`, `mechanic_blocks` 구현
2. `assets` 및 직접 업로드·검증·다운로드 매니페스트 구현
3. 초안 저장, 순서 변경, 배포 전 검증, immutable publish 구현
4. `rewards`, `scene_endings`, `play_sessions`, `play_events` 구현
5. 오프라인 동기화·중복 방지·인벤토리 지급 구현
6. AR 기준 이미지 품질 검사와 플랫폼별 파생 파일 생성 도입

초기 릴리스에서는 실시간 멀티플레이, 서버 기반 위치 추적, 복잡한 부정 사용 탐지, 공유 AR 앵커는 범위에서 제외한다.
