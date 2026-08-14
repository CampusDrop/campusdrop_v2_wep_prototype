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
    images: [
      {
        url: partnerMetaImage,
        width: 1200,
        height: 630,
        alt: "Campus Drop 제휴 | 대학생 방문과 매장을 연결합니다",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: partnerMetaTitle,
    description: partnerMetaDescription,
    images: [partnerMetaImage],
  },
};

const partnerBenefits = [
  {
    number: "01",
    kicker: "VISIT DATA",
    title: <>들른 손님만,<br />방문으로 봅니다.</>,
    description:
      "쿠폰을 받은 수가 아니라 매장에서 실제 사용 완료된 건만 오늘·이번 달·누적 방문으로 확인합니다.",
    panel: "visit",
  },
  {
    number: "02",
    kicker: "STORE CONTROL",
    title: <>쿠폰의 최종 결정은<br />사장님에게.</>,
    description:
      "새 쿠폰, 수량 변경, 삭제는 운영자 제안으로 도착합니다. 사장님이 수락해야만 실제 운영에 반영됩니다.",
    panel: "control",
  },
  {
    number: "03",
    kicker: "ONE STORE, ONE ACCOUNT",
    title: <>내 매장에 필요한<br />정보만 간결하게.</>,
    description:
      "매장 하나에 계정 하나를 사용합니다. 다른 매장과 정보가 섞이지 않도록 독립적으로 관리합니다.",
    panel: "account",
  },
] as const;

const partnerFlow = [
  ["제휴 등록", "운영자가 보낸 일회성 링크에서 매장 정보를 등록합니다."],
  ["승인 후 시작", "운영자 승인이 끝나면 매장 전용 계정으로 포털을 이용합니다."],
  ["현황 확인", "방문 현황, 운영 제안, 제휴 공지를 한곳에서 살펴봅니다."],
] as const;

function BenefitPanel({ type }: { type: (typeof partnerBenefits)[number]["panel"] }) {
  if (type === "visit") {
    return (
      <div className={`${styles.benefitPanel} ${styles.visitPanel}`} aria-hidden="true">
        <div className={styles.panelLabel}>방문 현황</div>
        <div className={styles.panelBars}>
          <span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className={styles.panelCaption}>사용 완료 기준</div>
      </div>
    );
  }

  if (type === "control") {
    return (
      <div className={`${styles.benefitPanel} ${styles.controlPanel}`} aria-hidden="true">
        <div className={styles.requestRow}><i /> 쿠폰 변경 제안</div>
        <div className={styles.choiceRow}><span>거절</span><strong>수락</strong></div>
        <div className={styles.panelCaption}>사장님 확인 후 반영</div>
      </div>
    );
  }

  return (
    <div className={`${styles.benefitPanel} ${styles.accountPanel}`} aria-hidden="true">
      <div className={styles.storeBadge}>내 매장</div>
      <div className={styles.accountLines}><span /><span /><span /></div>
      <div className={styles.panelCaption}>매장 전용 포털</div>
    </div>
  );
}

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
        <p className={styles.eyebrow}>CAMPUS DROP PARTNER</p>
        <h1 id="partner-title">대학생이<br /><em>다시 찾는 매장</em>이<br />될 수 있도록.</h1>
        <p className={styles.lede}>
          Campus Drop은 캠퍼스 안팎에서 활동하는 대학생과 지역 매장을 연결합니다.
          방문을 보장하지는 않지만, 학생이 매장을 발견하고 실제로 들를 수 있는 접점을 만듭니다.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.primaryAction} href="mailto:partner@campusdrop.kr">제휴 제안 받기 <span aria-hidden="true">→</span></a>
          <Link className={styles.secondaryAction} href="/partner/login">파트너 로그인</Link>
        </div>
      </section>

      <section className={styles.assurance} aria-label="Campus Drop 제휴 운영 원칙">
        <div className={styles.assuranceInner}>
          <p className={styles.eyebrow}>CLEAR BY DESIGN</p>
          <h2>방문 숫자는<br />더 투명해야 하니까.</h2>
          <p>쿠폰을 발급한 수가 아닙니다. 매장에서 실제로 사용 완료된 건만 방문 현황으로 보여드립니다.</p>
          <div className={styles.assuranceCard} aria-label="방문 현황 기준">
            <span className={styles.assuranceCardMark} aria-hidden="true">✓</span>
            <div><strong>사용 완료 기준</strong><small>발급 수 ≠ 방문자 수</small></div>
          </div>
        </div>
      </section>

      <section className={styles.benefits} aria-labelledby="partner-benefits-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>FOR YOUR STORE</p>
          <h2 id="partner-benefits-title">매장의 하루를<br />더 쉽게 확인하세요.</h2>
        </div>
        <div className={styles.benefitList}>
          {partnerBenefits.map((benefit) => (
            <article className={styles.benefit} key={benefit.number}>
              <div className={styles.benefitCopy}>
                <p className={styles.benefitNumber}>{benefit.number}</p>
                <p className={styles.benefitKicker}>{benefit.kicker}</p>
                <h3>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </div>
              <BenefitPanel type={benefit.panel} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.process} aria-labelledby="partner-process-title">
        <div className={styles.processInner}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>HOW TO START</p>
            <h2 id="partner-process-title">시작은 간단하게,<br />운영은 차분하게.</h2>
            <p>복잡한 절차보다 매장 운영에 필요한 내용만 남겼습니다.</p>
          </div>
          <ol className={styles.processList}>
            {partnerFlow.map(([title, description], index) => (
              <li key={title}>
                <span className={styles.processNumber}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
          <p className={styles.processNote}>제휴 포털에는 별도 문의 채팅이 없습니다. 필요한 운영 제안과 공지는 포털에서 간단히 확인합니다.</p>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="partner-next-title">
        <p className={styles.eyebrow}>LET&apos;S CONNECT</p>
        <h2 id="partner-next-title">대학생이 매장을<br />발견할 이유를<br />함께 만들어요.</h2>
        <p>제휴 방식이 궁금하시다면 편하게 알려 주세요. 매장 상황에 맞는 시작점을 함께 살펴보겠습니다.</p>
        <div className={styles.closingActions}>
          <a className={styles.closingPrimary} href="mailto:partner@campusdrop.kr">제휴 제안 받기 <span aria-hidden="true">→</span></a>
          <Link className={styles.closingLogin} href="/partner/login">이미 제휴 중이신가요?</Link>
        </div>
      </section>
    </main>
  );
}
