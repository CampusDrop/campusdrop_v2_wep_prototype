import styles from "./game-event-authoring.module.css";

/**
 * Intentionally contains no example game, event, coupon, or editor data.
 * AdminPortalShell calls this only after a server-side authorization result.
 */
export default function GameEventAuthoring() {
  return (
    <div className={styles.authoring}>
      <section className={styles.integrationNotice} aria-labelledby="authoring-boundary-title">
        <p>SERVER CONTRACT REQUIRED</p>
        <h2 id="authoring-boundary-title">게임·이벤트 제작 연동을 준비하고 있어요.</h2>
        <span>
          현재는 서버가 게임, 이벤트, 쿠폰과 발행 권한을 확인하는 API가 준비되기 전입니다.
          생성·수정·발행은 모두 비활성 상태이며, 이 화면은 예시 운영 데이터를 표시하지 않습니다.
        </span>
      </section>

      <section className={styles.section} aria-labelledby="game-authoring-title">
        <div className={styles.sectionHeading}>
          <p>GAME AUTHORING</p>
          <h2 id="game-authoring-title">게임 제작 흐름</h2>
          <span>미션 에디터에서 설계한 초안에 참여 인원 범위를 연결합니다.</span>
        </div>
        <fieldset className={styles.form} disabled>
          <label>
            게임 제목
            <input type="text" placeholder="서버 연동 후 입력 가능" />
          </label>
          <label>
            미션 초안
            <select defaultValue="">
              <option value="" disabled>서버에서 승인된 미션 초안을 불러옵니다</option>
            </select>
          </label>
          <div className={styles.rangeFields}>
            <label>
              최소 참여 인원
              <input type="number" min="1" inputMode="numeric" placeholder="최소 인원" />
            </label>
            <label>
              최대 참여 인원
              <input type="number" min="1" inputMode="numeric" placeholder="최대 인원" />
            </label>
          </div>
          <p className={styles.hint}>최소 인원은 시작일 전날 23:59:59(KST)까지 충족하지 못하면 탐험대가 자동 취소됩니다. 최대 인원은 모집 중에도 초과할 수 없습니다.</p>
          <button type="button">게임 초안 저장 — 서버 연동 대기</button>
        </fieldset>
      </section>

      <section className={styles.section} aria-labelledby="event-authoring-title">
        <div className={styles.sectionHeading}>
          <p>EVENT AUTHORING</p>
          <h2 id="event-authoring-title">이벤트와 한정 쿠폰 연결</h2>
          <span>이벤트 기간과 보상 전환 규칙은 한국 시간(KST)으로 관리합니다.</span>
        </div>
        <fieldset className={styles.form} disabled>
          <label>
            이벤트 이름
            <input type="text" placeholder="서버 연동 후 입력 가능" />
          </label>
          <label>
            이벤트 게임
            <select defaultValue="">
              <option value="" disabled>발행 가능한 게임을 서버에서 불러옵니다</option>
            </select>
          </label>
          <div className={styles.rangeFields}>
            <label>
              시작 시각 (KST)
              <input type="datetime-local" />
            </label>
            <label>
              종료 시각 (KST)
              <input type="datetime-local" />
            </label>
          </div>
          <label>
            첫 완료 보상: 수량 제한 쿠폰
            <select defaultValue="">
              <option value="" disabled>이벤트 전용 수량 제한 쿠폰을 서버에서 불러옵니다</option>
            </select>
          </label>
          <button type="button">이벤트 저장·발행 — 서버 연동 대기</button>
        </fieldset>
      </section>

      <section className={styles.policy} aria-labelledby="reward-policy-title">
        <p>REWARD POLICY</p>
        <h2 id="reward-policy-title">완료 보상 전환 규칙</h2>
        <ol>
          <li>플레이어의 해당 이벤트 게임 첫 완료에는 연결된 수량 제한 쿠폰 1장을 발급합니다.</li>
          <li>같은 플레이어의 두 번째 완료부터는 탐험대 공통 관심사에 맞는 무제한 쿠폰을 발급합니다.</li>
          <li>수량 제한 쿠폰이 모두 발급된 뒤에는 모든 완료 보상이 무제한 쿠폰으로 전환됩니다.</li>
          <li>이벤트 종료 시 게임은 플레이 목록에서 숨겨지며 새 보상도 발급되지 않습니다.</li>
        </ol>
      </section>

      <section className={styles.emptyState} aria-label="게임 및 이벤트 목록">
        <h2>서버 승인 후 목록을 표시합니다.</h2>
        <p>인증된 운영자에게만 게임·이벤트·연결 쿠폰 정보를 반환하도록 API를 연결해야 합니다.</p>
      </section>
    </div>
  );
}
