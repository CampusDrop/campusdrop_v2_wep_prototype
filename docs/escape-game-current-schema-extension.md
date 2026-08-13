# CampusDrop v2 기존 스키마 기반 방탈출 확장 명세

> 기준 문서: Flyway `V1`~`V12` 현재 스키마 레퍼런스
>
> 이 문서는 기존 플랫폼을 새로 설계하는 문서가 아니다. 이미 존재하는 `themes`, `theme_versions`, `mission_nodes`, `asset_packages`, `game_sessions`, `game_events` 위에 Maker 방탈출 기능을 추가하기 위한 V13+ 확장 명세다.

## 1. 먼저 확정할 매핑

| Maker/방탈출 개념 | 기존 테이블 | 처리 방식 |
|---|---|---|
| 하나의 방탈출 게임 | `themes` | 새 게임 루트를 만들지 않고 기존 테마를 사용 |
| 배포 가능한 게임 초안/버전 | `theme_versions` | 기존 불변 배포 버전 모델을 그대로 사용 |
| Maker Identity 제목·소개 | `theme_localizations` | 기존 `title`, `summary`, `description` 사용 |
| 챕터/장면 | `mission_nodes` | 장면마다 미션 노드 하나를 사용 |
| 장면의 순서 | `mission_nodes.sequence_no` | 기존 버전 내 유니크 순서 사용 |
| 힌트 | `mission_hints` | 기존 테이블 그대로 사용 |
| 서버 전용 정답 | `mission_solutions` | 문자열 정답·카드 배열 정답 등에 재사용 |
| 다운로드 에셋 묶음 | `asset_packages` | 기존 manifest/checksum 모델 재사용 |
| AR Cloud Anchor | `cloud_anchor_bindings` | v1의 이미지 인식·보물찾기에는 사용하지 않음 |
| 그룹 게임 세션 | `game_sessions` | 새 세션 테이블을 만들지 않고 확장 |
| 이벤트 원장 | `game_events` | 새 이벤트 테이블을 만들지 않고 확장 |
| 멱등 기믹 시도 | `game_attempts` | 기존 모델을 보완해 재사용 |
| 위치 검증 분석 | `location_validation_events` | 원본 좌표 없이 결과만 기록 |
| 증거물 이미지·3D | 기존 Asset/Storage + `asset_packages` | 새 파일 저장소·업로드 API를 만들지 않음 |

## 2. 기존 테이블에 추가해야 하는 컬럼

### 2.1 `expeditions`와 `game_sessions`에 `theme_version_id` 추가

현재 `themes.published_version_id`는 시간이 지나면 바뀔 수 있다. 따라서 탐험대·게임 세션은 실제 플레이할 `theme_versions`를 반드시 고정해야 한다.

```sql
ALTER TABLE expeditions
  ADD COLUMN theme_version_id uuid NULL
  REFERENCES theme_versions(id);

ALTER TABLE game_sessions
  ADD COLUMN theme_version_id uuid NULL
  REFERENCES theme_versions(id);
```

마이그레이션 순서:

1. 기존 `expeditions.theme_id`의 `themes.published_version_id`를 읽어 `theme_version_id`를 채운다.
2. 기존 `game_sessions`도 해당 탐험대의 버전을 채운다.
3. 데이터 검증 후 두 컬럼을 `NOT NULL`로 전환한다.
4. 새 탐험대 생성 시점에 공개된 `theme_versions.id`를 고정한다.
5. 게임 세션은 탐험대가 고정한 동일 버전을 복사한다.

이 규칙이 없으면 Maker에서 수정·재배포된 뒤 진행 중인 유저가 서로 다른 장면 순서·정답·AR 규칙을 보게 된다.

### 2.2 `game_progress`는 장면 단위 진행도로 유지

현재 `game_progress(session_id, user_id, stage, score, updated_at)`는 장면 단위의 빠른 조회용으로 유지한다.

- `stage`: 현재 완료한 `mission_nodes.sequence_no` 또는 현재 노드의 순서
- `score`: 기존 게임 규칙에 따라 유지. 방탈출 자체가 점수제가 아니라면 0 또는 XP 계산 전의 내부 점수

내용 블록·기믹 블록 단위 진행은 아래의 신규 테이블에 저장한다. `game_progress`에 JSON을 덧붙여 모든 진행을 넣지 않는다.

## 3. 신규 테이블

### 3.1 `theme_version_game_profiles`

기존 `theme_versions`에 방탈출 Maker의 Identity 설정을 붙인다. 게임 루트나 게임 버전을 중복 생성하지 않는다.

```sql
CREATE TABLE theme_version_game_profiles (
  theme_version_id uuid PRIMARY KEY REFERENCES theme_versions(id) ON DELETE CASCADE,
  case_number text NOT NULL,
  tone text NOT NULL,
  color_tokens jsonb NOT NULL,
  font_token text NULL,
  estimated_seconds integer NOT NULL CHECK (estimated_seconds >= 0),
  manifest_schema_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(color_tokens) = 'object')
);
```

`theme_localizations`가 이미 제목·요약·설명을 관리하므로, 이 테이블에 같은 텍스트를 중복 저장하지 않는다.

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

모든 앱 화면·메신저·연출·버튼은 이 토큰을 참조한다. 장면이나 카드마다 색상을 복사 저장하지 않는다.

`tone` 허용값:

```text
documentary | tense | dreamy | playful | noir | eerie | warm | epic
```

### 3.2 `theme_version_escape_asset_packages`

기존 `mission_nodes.asset_package_id`는 장면별 자산을 가리키는 데 사용할 수 있다. 그러나 게임 시작 전에 전체 방탈출을 내려받으려면, 버전 전체 패키지를 기존 `asset_packages`에 연결하는 FK가 필요하다.

```sql
CREATE TABLE theme_version_escape_asset_packages (
  theme_version_id uuid PRIMARY KEY REFERENCES theme_versions(id) ON DELETE CASCADE,
  asset_package_id uuid NOT NULL REFERENCES asset_packages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- 새 스토리지나 새 파일 메타데이터 테이블을 만들지 않는다.
- `asset_package_id`의 기존 `manifest_url`, `checksum_sha256`를 그대로 사용한다.
- 매니페스트에는 모든 장면의 카드 이미지, 기준 이미지, 보상 이미지/모델, NPC 이미지가 포함된다.
- 용량이 커지는 경우에도 테이블 구조는 바꾸지 않고, 기존 manifest 안에서 `required_before_play`과 지연 다운로드 그룹을 나눈다.

### 3.3 `mission_scene_settings`

`mission_nodes`를 방탈출의 장면으로 사용할 때 필요한 화면·연출 설정이다.

```sql
CREATE TABLE mission_scene_settings (
  mission_node_id uuid PRIMARY KEY REFERENCES mission_nodes(id) ON DELETE CASCADE,
  subtitle text NULL,
  title_visible boolean NOT NULL DEFAULT true,
  subtitle_visible boolean NOT NULL DEFAULT true,
  presentation_template text NOT NULL DEFAULT 'none',
  presentation_content text NULL,
  presentation_duration_ms integer NOT NULL DEFAULT 1500
    CHECK (presentation_duration_ms BETWEEN 0 AND 10000),
  estimated_seconds integer NOT NULL DEFAULT 0 CHECK (estimated_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- 장면 제목은 기존 `mission_nodes.public_title`을 사용한다.
- 장면 설명은 기존 `mission_nodes.public_description`을 사용한다.
- 장면 번호는 기존 `mission_nodes.sequence_no`로 계산한다.
- `presentation_template`은 앱이 해석할 안정적인 ID다. SwiftUI/Compose 애니메이션 속성은 저장하지 않는다.

허용 템플릿:

```text
none | record_transfer | emergency_signal | wave | field_open | evidence_found
```

### 3.4 `mission_flow_blocks`

현재 `mission_nodes`는 장면/미션 단위다. 한 장면 안의 정보 카드, 메신저, NPC 대화, 기믹의 순서를 저장하려면 블록 테이블이 필요하다.

```sql
CREATE TABLE mission_flow_blocks (
  id uuid PRIMARY KEY,
  mission_node_id uuid NOT NULL REFERENCES mission_nodes(id) ON DELETE CASCADE,
  sort_key bigint NOT NULL,
  block_kind text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  completion_rule text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_node_id, sort_key),
  CHECK (block_kind IN ('CONTENT', 'MECHANIC')),
  CHECK (completion_rule IN ('AUTO', 'VIEWED', 'ACTION_COMPLETED'))
);

CREATE UNIQUE INDEX mission_flow_blocks_one_mechanic_per_scene
  ON mission_flow_blocks (mission_node_id)
  WHERE block_kind = 'MECHANIC';
```

현재 제품 규칙상 장면당 기믹은 최대 하나다. 위 partial unique index가 그 규칙을 DB에서 보장한다.

`sort_key`는 `1000`, `2000`, `3000`처럼 간격을 두고 생성한다. Maker 드래그 정렬 때 중간 키를 만들 수 있고, 장면 번호를 사용자가 직접 정하지 않아도 된다.

플레이 해금 규칙:

```text
정렬된 블록 중 첫 번째 미완료 필수 블록만 활성화한다.
뒤 블록의 버튼, GPS, AR은 비활성화한다.
정보 카드는 AUTO, 메신저/NPC/기믹은 ACTION_COMPLETED를 사용한다.
```

### 3.5 `mission_content_blocks`

```sql
CREATE TABLE mission_content_blocks (
  mission_flow_block_id uuid PRIMARY KEY
    REFERENCES mission_flow_blocks(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (content_type IN ('INFO_CARD', 'MESSENGER', 'NPC_DIALOGUE')),
  CHECK (jsonb_typeof(payload) = 'object')
);
```

`payload` 계약:

```json
// INFO_CARD
{
  "label": "사건 개요",
  "title": "목격 신고 접수",
  "body": "시계탑 근처에서 기린을 보았다는 신고가 들어왔습니다."
}
```

```json
// MESSENGER
{
  "sender": "DROPLINK",
  "notification": "새로운 메시지가 도착했습니다.",
  "messages": ["현장 사진을 확인해 주세요.", "노란 포스터를 카메라로 비춰 보세요."]
}
```

```json
// NPC_DIALOGUE
{
  "sender": "목격자 윤서",
  "presentation": "face",
  "text_speed": "normal",
  "messages": ["사진 속 기린이 움직인 것 같았어요.", "노란 빛이 시계탑 안쪽으로 이어졌습니다."]
}
```

메신저와 NPC의 대사는 반드시 문자열 배열로 저장한다. 앱은 배열 한 항목씩 타이핑 효과를 적용한다.

### 3.6 `mission_mechanic_blocks`

```sql
CREATE TABLE mission_mechanic_blocks (
  mission_flow_block_id uuid PRIMARY KEY
    REFERENCES mission_flow_blocks(id) ON DELETE CASCADE,
  mechanic_type text NOT NULL,
  config_version integer NOT NULL DEFAULT 1,
  config jsonb NOT NULL,
  estimated_seconds integer NOT NULL CHECK (estimated_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mechanic_type IN (
    'NONE',
    'GPS_ARRIVAL',
    'DIRECTION_TRACKING',
    'IMAGE_RECOGNITION',
    'AR_TREASURE_HUNT',
    'CARD_ORDERING',
    'TEXT_ANSWER'
  )),
  CHECK (jsonb_typeof(config) = 'object')
);
```

`config`는 JSONB지만, API 계층은 `mechanic_type + config_version` 별 DTO 또는 JSON Schema 검증을 반드시 수행한다. 임의 JSON을 그대로 앱으로 전달하지 않는다.

### 3.7 `mission_location_targets`

기존 `mission_location_rules`는 버킷 기반 위치 검증 규칙이다. Maker에서 정하는 실제 현장 이름·위도·경도·반경과 GPS 최대 3개 지점을 지원하려면 별도 타깃 테이블을 추가한다.

```sql
CREATE TABLE mission_location_targets (
  id uuid PRIMARY KEY,
  mission_node_id uuid NOT NULL REFERENCES mission_nodes(id) ON DELETE CASCADE,
  target_key text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 1 CHECK (sort_order BETWEEN 1 AND 3),
  name text NOT NULL,
  address text NULL,
  latitude numeric(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_meters integer NOT NULL CHECK (radius_meters BETWEEN 10 AND 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_node_id, target_key),
  UNIQUE (mission_node_id, sort_order)
);
```

- GPS 현장 도착 기믹: 1~3개의 target을 사용한다.
- 이미지 인식/AR 보물찾기: 1개의 target만 사용한다.
- 실제 판정 기준은 위도·경도·반경이다. 주소는 Maker 지도 검색과 사람용 안내를 위한 값이다.
- 기존 `mission_location_rules`는 `allowed_bucket`, `minimum_accuracy_bucket`처럼 개인정보 보존형 검증·분석 규칙으로 유지한다.
- `location_validation_events`에는 target ID, accuracy bucket, 성공/실패만 기록하고 플레이어 원본 좌표는 저장하지 않는다.

### 3.8 `mission_block_assets`

기존 Asset/Storage를 재사용하되, JSON 안의 asset ID만으로 관계를 끊지 않도록 연결 테이블을 둔다.

```sql
CREATE TABLE mission_block_assets (
  mission_flow_block_id uuid NOT NULL
    REFERENCES mission_flow_blocks(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  asset_role text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 1,
  PRIMARY KEY (mission_flow_block_id, asset_id, asset_role),
  UNIQUE (mission_flow_block_id, asset_role, sort_order)
);
```

`asset_id` FK는 실제 기존 에셋 테이블 이름에 연결한다.

권장 `asset_role`:

```text
CONTENT_IMAGE | MESSENGER_HEADER | NPC_PORTRAIT | REFERENCE_IMAGE |
AR_REVEAL | REWARD_IMAGE | REWARD_MODEL
```

API는 기믹/내용 JSON에 들어간 asset ID가 반드시 이 테이블에도 연결되어 있는지 검증한다. 배포 패키지를 만들 때도 이 테이블을 기준으로 필요한 에셋을 수집한다.

### 3.9 `mission_scene_endings`

```sql
CREATE TABLE mission_scene_endings (
  mission_node_id uuid PRIMARY KEY REFERENCES mission_nodes(id) ON DELETE CASCADE,
  ending_mode text NOT NULL,
  action_label text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ending_mode IN ('NONE', 'SUBMISSION', 'MESSENGER')),
  CHECK (jsonb_typeof(config) = 'object')
);
```

`SUBMISSION` 설정 예시:

```json
{
  "title": "기록을 분석하고 있습니다",
  "body": "현장 자료를 정리하고 있습니다.",
  "duration_seconds": 3
}
```

`duration_seconds`는 1~5초로 검증한다. 종료 버튼은 모든 필수 `mission_flow_blocks`가 완료된 뒤에만 활성화한다.

### 3.10 `mission_rewards`

기믹으로 얻는 증거물과 장면 종료 후 추가로 얻는 증거물을 통합한다.

```sql
CREATE TABLE mission_rewards (
  id uuid PRIMARY KEY,
  mission_node_id uuid NOT NULL REFERENCES mission_nodes(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  trigger_flow_block_id uuid NULL REFERENCES mission_flow_blocks(id) ON DELETE SET NULL,
  location_target_id uuid NULL REFERENCES mission_location_targets(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NULL,
  presentation text NOT NULL DEFAULT 'MODAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_type IN ('MECHANIC', 'SCENE_ENDING')),
  CHECK (presentation = 'MODAL')
);
```

증거물 파일은 `mission_block_assets` 또는 별도의 `mission_reward_assets(reward_id, asset_id, asset_role)`로 기존 Asset과 연결한다. 현재 제품 규칙상 증거물 하나당 이미지 또는 3D 모델 하나만 연결하도록 서버 검증한다.

## 4. 두 AR 기믹의 확정 설정 계약

AR 기믹은 아래 두 종류만 제공한다. 기존 “AR 흔적 발견”, “AR 증거물 복원”, “AR 태그 확인” 같은 종류는 추가하지 않는다.

### 4.1 `IMAGE_RECOGNITION`

`mission_mechanic_blocks.config` 예시:

```json
{
  "location_target_id": "mission_location_target_uuid",
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
+ location_target 반경 내부
+ 카메라/AR 권한 허용
+ 기준 이미지 인식 성공
= 완료
```

서버 검증:

- `location_target_id`는 같은 `mission_node_id`의 target이어야 한다.
- `reference_asset_id`는 같은 블록의 `mission_block_assets`에 `REFERENCE_IMAGE`로 연결되어야 한다.
- `reference_physical_width_meters`는 0보다 커야 한다.
- 기준 이미지가 없는 경우 배포를 막는다.

### 4.2 `AR_TREASURE_HUNT`

```json
{
  "location_target_id": "mission_location_target_uuid",
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
+ location_target 반경 내부
+ 카메라/AR 권한 허용
+ 수평 바닥 평면 인식
+ 화면 중앙 레이캐스트가 바닥에 적중
= 보물 표시 및 완료
```

“바닥을 바라본다”를 기기 기울기만으로 판정하지 않는다. iOS/Android 앱이 AR 바닥 평면과 화면 중앙 레이캐스트를 함께 확인해야 한다.

`reveal_asset_id`는 선택값이다. 초기 버전은 마커·빛·텍스트만으로도 보물을 표시할 수 있다.

## 5. 기존 게임 세션에 블록 진행을 추가

기존 `game_sessions`, `game_progress`, `game_events`, `game_attempts`를 재사용한다. 별도 `escape_play_sessions`나 `escape_play_events`는 만들지 않는다.

### 5.1 `game_mission_block_progress`

장면 안의 세부 블록 완료 상태를 저장한다.

```sql
CREATE TABLE game_mission_block_progress (
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_flow_block_id uuid NOT NULL REFERENCES mission_flow_blocks(id) ON DELETE CASCADE,
  status text NOT NULL,
  completed_at timestamptz NULL,
  PRIMARY KEY (session_id, user_id, mission_flow_block_id),
  CHECK (status IN ('LOCKED', 'ACTIVE', 'COMPLETED', 'SKIPPED'))
);
```

개인 진행 게임이므로 기본 키는 `session_id + user_id + block_id`다. 나중에 탐험대 공동 기믹이 필요해지면, 별도 `scope = INDIVIDUAL/GROUP` 규칙을 추가하고 그룹 진행도는 `user_id` 없는 테이블로 분리한다.

### 5.2 `game_mission_block_attempts`

기존 `game_attempts`가 다른 미션 유형에서 이미 쓰이고 있으므로, 방탈출 블록에 필요한 결과 코드를 안전하게 담으려면 상세 테이블을 추가한다.

```sql
CREATE TABLE game_mission_block_attempts (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_flow_block_id uuid NOT NULL REFERENCES mission_flow_blocks(id) ON DELETE CASCADE,
  attempt_key text NOT NULL,
  accepted boolean NOT NULL,
  result_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id, attempt_key)
);
```

`result_code` 예시:

```text
LOCATION_GATE_PASSED | LOCATION_GATE_FAILED | IMAGE_RECOGNIZED |
FLOOR_PLANE_FOUND | TEXT_ANSWER_CORRECT | TEXT_ANSWER_INCORRECT |
CARD_ORDER_CORRECT | BLOCK_LOCKED | PERMISSION_DENIED
```

`game_events`에는 재접속·리플레이를 위한 이벤트를 계속 기록한다.

```json
{
  "event_type": "MISSION_BLOCK_COMPLETED",
  "payload": {
    "mission_node_id": "...",
    "mission_flow_block_id": "...",
    "mechanic_type": "AR_TREASURE_HUNT"
  }
}
```

기존 `game_events(session_id, sequence_no)` 제약을 그대로 사용한다. 오프라인 앱은 이벤트를 기기 로컬 큐에 저장했다가 네트워크 복구 시 순서대로 전송한다.

### 5.3 증거물 인벤토리

증거물은 기존 XP·쿠폰과 다른 게임 콘텐츠다. 아래 테이블을 추가한다.

```sql
CREATE TABLE game_reward_acquisitions (
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_reward_id uuid NOT NULL REFERENCES mission_rewards(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id, mission_reward_id)
);
```

이 PK가 오프라인 이벤트 재전송 시 중복 증거물 지급을 막는다. XP가 필요한 증거물이라면 기존 `xp_ledger`에 `reference_type = MISSION_REWARD`, `reference_id = mission_reward_id`로 별도 원장을 남긴다.

## 6. 기존 `asset_packages`를 이용한 다운로드 패키지

새 다운로드 테이블을 만들지 않는다. 이미 있는 `asset_packages(package_key, manifest_url, checksum_sha256)`를 사용한다.

배포할 `theme_version`마다 하나의 방탈출 매니페스트를 생성하고, `theme_version_escape_asset_packages.asset_package_id`로 참조한다.

매니페스트에는 아래를 포함한다.

```json
{
  "schema_version": 1,
  "theme_version_id": "...",
  "profile": { "...": "..." },
  "scenes": [],
  "flow_blocks": [],
  "mechanics": [],
  "rewards": [],
  "assets": [
    { "asset_id": "...", "checksum_sha256": "...", "required_before_play": true }
  ]
}
```

배포 전 백엔드는 `mission_block_assets`와 보상 에셋 연결을 수집해 매니페스트를 생성하고 체크섬을 `asset_packages.checksum_sha256`에 저장한다.

앱은 다운로드 후 체크섬을 확인하고, 필수 이미지·기준 이미지·증거물 파일이 모두 준비됐을 때만 게임 시작을 허용한다.

## 7. 기존 API에 추가할 작업

기존 인증·파일 업로드·테마 생성·버전 배포 API를 그대로 사용한다. 새로 필요한 것은 아래 방탈출 하위 리소스뿐이다.

| 기능 | 대상 데이터 |
|---|---|
| Maker Identity 저장 | `theme_version_game_profiles`, `theme_localizations` |
| 장면 생성/수정/삭제/정렬 | `mission_nodes`, `mission_scene_settings` |
| 내용/기믹 블록 CRUD/정렬 | `mission_flow_blocks`, 상세 블록 테이블 |
| GPS 지점 CRUD | `mission_location_targets` |
| 연출/종료 방식 설정 | `mission_scene_presentations`, `mission_scene_endings` |
| 증거물 설정 | `mission_rewards`, 에셋 연결 |
| 배포 전 검증 | 위 모든 데이터 + 기존 Asset 상태 |
| 게임 패키지 조회 | 기존 `asset_packages.manifest_url` |
| 플레이 동기화 | `game_events`, block progress, attempts, reward acquisitions |

배포 전 반드시 검증할 것:

1. 각 장면의 `sequence_no`가 유효한가
2. 각 장면의 블록 `sort_key`가 중복되지 않는가
3. 장면당 `MECHANIC` 블록이 0 또는 1개인가
4. 이미지 인식에 GPS target, 기준 이미지, 실제 이미지 폭이 있는가
5. AR 보물찾기에 GPS target과 바닥 조건이 있는가
6. 모든 참조 에셋이 기존 스토리지에서 준비 상태인가
7. 모든 필수 에셋이 `asset_packages` 매니페스트에 포함됐는가
8. `theme_version`이 published일 때 게임 콘텐츠 변경 API가 차단되는가

## 8. Swift/Kotlin에 전달할 공통 계약

앱은 매니페스트를 내려받아 다음 순서로 실행한다.

```text
장면 연출 재생
→ 정렬된 블록 중 첫 활성 블록 표시
→ 내용/기믹 완료 이벤트 로컬 저장
→ 다음 블록 해금
→ 모든 필수 블록 완료 후 종료 방식 실행
→ 증거물 획득 모달 표시
→ 다음 mission_node로 이동
```

네이티브 앱이 하는 판정과 서버가 받는 값:

| 기능 | 앱의 판정 | 서버에 저장할 것 |
|---|---|---|
| GPS | 현재 위치가 target 반경 이내인지 | 성공/실패, accuracy bucket |
| 이미지 인식 | 기준 이미지가 인식됐는지 | `IMAGE_RECOGNIZED` 결과 |
| AR 보물찾기 | 바닥 평면 + 중심 레이캐스트 성공 | `FLOOR_PLANE_FOUND` 결과 |
| 권한 | 위치/카메라/AR 가능 여부 | 오류·권한 결과 코드 |
| 증거물 | 획득 트리거 충족 | reward acquisition 이벤트 |

원본 위치 좌표, 카메라 프레임, AR 자세 데이터는 서버에 보내지 않는다.

공식 구현 참고:

- iOS 이미지 인식: <https://developer.apple.com/documentation/arkit/detecting-images-in-an-ar-experience>
- iOS 평면 인식: <https://developer.apple.com/documentation/arkit/understanding-world-tracking>
- Android ARCore 이미지 인식: <https://developers.google.com/ar/develop/augmented-images>
- Android ARCore 평면 인식: <https://developers.google.com/ar/develop/fundamentals>

## 9. Flyway 작업 순서

1. 현재 V11의 `game_presence` 중복 생성 문제를 먼저 수정한다. 빈 DB에서 migration이 성공해야 V13 이후 확장이 안전하다.
2. V13: `theme_version_id` backfill 및 FK/NOT NULL 전환
3. V14: `theme_version_game_profiles`, `theme_version_escape_asset_packages`, `mission_scene_settings`, `mission_flow_blocks`, `mission_content_blocks`, `mission_mechanic_blocks`
4. V15: `mission_location_targets`, `mission_block_assets`, `mission_scene_endings`, `mission_rewards`
5. V16: `game_mission_block_progress`, `game_mission_block_attempts`, `game_reward_acquisitions`
6. V17: 기존 `asset_packages`를 생성하는 방탈출 manifest compiler 및 배포 검증 로직

이 확장은 기존 사용자·인증·테마·미션·에셋·게임 세션·분석·outbox·XP 원장을 재사용한다. 새 플랫폼을 만드는 것이 아니라, 현재 CampusDrop v2에 Maker 방탈출 콘텐츠 모델을 추가하는 작업이다.
