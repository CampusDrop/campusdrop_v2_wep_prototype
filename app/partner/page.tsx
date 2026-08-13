import type { Metadata } from "next";
import Link from "next/link";
import styles from "./partner-marketing.module.css";

const partnerMetaTitle = "Campus Drop 제휴 | 대학생 방문과 매장을 연결합니다";
const partnerMetaDescription =
  "지역 매장과 대학생을 연결하는 Campus Drop 제휴 안내입니다. 방문 현황은 쿠폰 사용 완료 기준으로 확인합니다.";
const partnerMetaImage = "/og.png";

export const metadata: Metadata = {
  title: partnerMetaTitle,
  description: partnerMetaDescription,
  openGraph: {
    title: partnerMetaTitle,
    description: partnerMetaDescription,
    type: "website",
    images: [{ url: partnerMetaImage, width: 1200, height: 630, alt: "Campus Drop 제휴 | 대학생 방문과 매장을 연결합니다" }],
  },
  twitter: {
    card: "summary_large_image",
    title: partnerMetaTitle,
    description: partnerMetaDescription,
    images: [partnerMetaImage],
  },
};

const partnerBenefits = [
  ["방문 현황", "실제 사용 완료만 방문으로", "쿠폰이 발급된 수가 아니라, 매장에서 사용 완료된 건만 오늘·이번 달·누적 방문으로 확인합니다."],
  ["매장 운영", "사장님이 최종 결정", "새 쿠폰, 수량 변경, 삭제는 운영자 제안으로 도착합니다. 사장님이 수락해야만 반영됩니다."],
  ["독립 계정", "내 매장 정보만 또렷하게", "매장 하나에 계정 하나를 사용합니다. 다른 매장과 정보가 섞이지 않도록 독립적으로 관리됩니다."],
] as const;

const partnerFlow = [
  ["제휴 등록", "운영자가 보낸 일회성 링크에서 매장 정보를 등록합니다."],
  ["승인 후 시작", "운영자 승인이 끝나면 매장 전용 계정으로 포털을 이용합니다."],
  ["현황 확인", "방문 현황, 운영 제안, 제휴 공지를 한곳에서 살펴봅니다."],
] as const;

export default function PartnerPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="Campus Drop 홈">
          <span className={styles.wordmarkMark} aria-hidden="true">C</span>
          <span>Campus Drop</span>
        </Link>
        <Link className={styles.loginLink} href="/partner/login">파트너 로그인</Link>
      </header>

      <section className={styles.hero} aria-labelledby="partner-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>CAMPUS DROP PARTNER</p>
          <h1 id="partner-title">대학생의 오늘이<br /><em>우리 매장의 방문</em>으로<br />이어지도록.</h1>
          <p className={styles.lede}>
            Campus Drop은 캠퍼스 안팎에서 활동하는 대학생과 지역 매장을 연결합니다.
            방문을 보장하지는 않지만, 학생이 매장을 발견하고 실제로 들를 수 있는 새로운 접점을 만듭니다.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="mailto:partner@campusdrop.kr">제휴 제안 받기 <span aria-hidden="true">→</span></a>
            <Link className={styles.secondaryAction} href="/partner/login">파트너 로그인</Link>
          </div>
        </div>
        <div className={styles.heroPanel} aria-label="방문 현황 확인 방식">
          <div className={styles.panelTopline}>
            <span className={styles.panelIcon} aria-hidden="true">✓</span>
            <span>PARTNER DASHBOARD</span>
          </div>
          <strong>방문은<br /><b>사용 완료</b>로만<br />확인합니다.</strong>
          <p>쿠폰 발급 수가 아닌 실제 사용 완료 건을 기준으로, 매장 방문 현황을 투명하게 보여드립니다.</p>
          <span className={styles.panelRule}>발급 수 ≠ 방문자 수</span>
        </div>
      </section>

      <section className={styles.trustBar} aria-label="제휴 운영 원칙">
        <span className={styles.trustDot} aria-hidden="true" />
        <p><strong>숫자를 부풀리지 않습니다.</strong> 실제 사용 완료만 방문으로 집계합니다.</p>
      </section>

      <section className={styles.benefits} aria-labelledby="partner-options-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>WHY CAMPUS DROP</p>
          <h2 id="partner-options-title">매장에 필요한 건<br />더 분명한 방문의 흐름입니다.</h2>
          <p>결과는 투명하게 확인하고, 운영에 관한 결정은 사장님이 직접 할 수 있도록 설계했습니다.</p>
        </div>
        <div className={styles.benefitGrid}>
          {partnerBenefits.map(([label, title, description], index) => (
            <article key={title}>
              <span className={styles.benefitNumber}>0{index + 1}</span>
              <p className={styles.benefitLabel}>{label}</p>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.process} aria-labelledby="partner-process-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>HOW TO START</p>
          <h2 id="partner-process-title">복잡한 절차 대신,<br />세 단계로 시작하세요.</h2>
        </div>
        <ol className={styles.processList}>
          {partnerFlow.map(([title, description], index) => (
            <li key={title}>
              <span className={styles.processNumber}>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.processNote}>제휴 포털에는 별도 문의 채팅이 없습니다. 필요한 운영 제안과 공지는 포털에서 간단히 확인합니다.</p>
      </section>

      <section className={styles.closing} aria-labelledby="partner-next-title">
        <p className={styles.eyebrow}>LET&apos;S CONNECT</p>
        <h2 id="partner-next-title">대학생이 매장을<br />발견할 이유를 함께 만들어요.</h2>
        <p>제휴 방식이 궁금하시다면 편하게 알려 주세요. 매장 상황에 맞는 시작점을 함께 살펴보겠습니다.</p>
        <div className={styles.closingActions}>
          <a className={styles.closingPrimary} href="mailto:partner@campusdrop.kr">제휴 제안 받기 <span aria-hidden="true">→</span></a>
          <Link className={styles.closingLogin} href="/partner/login">이미 제휴 중이신가요?</Link>
        </div>
      </section>
    </main>
  );
}
