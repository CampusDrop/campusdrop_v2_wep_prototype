import styles from "./design-tokens-reference.module.css";

const tokens = [
  ["brandPrimary", "브랜드 기본", "주요 CTA와 강조"],
  ["brandStrong", "브랜드 강조", "CTA 호버와 강조 상태"],
  ["brandSoft", "부드러운 표면", "강조 배경과 상태 표면"],
  ["page", "기본 표면", "페이지와 카드 배경"],
  ["surfaceSubtle", "차분한 표면", "구획과 보조 영역"],
  ["textPrimary", "기본 텍스트", "제목과 핵심 정보"],
  ["textSecondary", "보조 텍스트", "설명과 보조 정보"],
  ["borderDefault", "기본 테두리", "카드와 구획 경계"],
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
        {tokens.map(([token, name, usage]) => (
          <li className={styles[token]} key={token}>
            <span className={styles.swatch} aria-hidden="true" />
            <div><strong>{name}</strong><code aria-label={`${name} HEX 코드`} /></div>
            <small>{usage}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
