import styles from "./design-tokens-reference.module.css";

const tokens = [
  ["브랜드 기본", "#3182F6", "주요 CTA와 강조"],
  ["브랜드 강조", "#1B64D8", "CTA 호버와 강조 상태"],
  ["부드러운 표면", "#EDF5FF", "강조 배경과 상태 표면"],
  ["기본 표면", "#FFFFFF", "페이지와 카드 배경"],
  ["차분한 표면", "#F5F6F8", "구획과 보조 영역"],
  ["기본 텍스트", "#191F2B", "제목과 핵심 정보"],
  ["보조 텍스트", "#687385", "설명과 보조 정보"],
  ["기본 테두리", "#E1E6EE", "카드와 구획 경계"],
] as const;

export default function DesignTokensReference() {
  return (
    <section className={styles.reference} aria-labelledby="design-token-title">
      <div className={styles.heading}>
        <p>DESIGN SETTINGS · READ ONLY</p>
        <h2 id="design-token-title">공통 색상 기준</h2>
        <span>랜딩과 제휴 안내에 공통 적용하는 서비스 색상입니다. 이 화면에서는 값을 확인만 할 수 있습니다.</span>
      </div>
      <ul className={styles.tokenList} aria-label="공통 색상 토큰 목록">
        {tokens.map(([name, hex, usage]) => (
          <li key={name}>
            <span className={styles.swatch} style={{ backgroundColor: hex }} aria-hidden="true" />
            <div><strong>{name}</strong><code>{hex}</code></div>
            <small>{usage}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
