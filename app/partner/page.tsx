import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "파트너 제휴 | Campus Drop",
  description: "Campus Drop과 함께 대학생 손님과 매장을 연결하는 제휴 프로그램을 소개합니다.",
};

const partnerBenefits = [
  ["01", "대학생과 만나는 새로운 접점", "Campus Drop을 이용하는 대학생에게 매장 쿠폰이 노출됩니다. 관심사가 맞는 탐험대의 활동 맥락에 맞춰 자연스럽게 연결됩니다."],
  ["02", "매장 단위로 분명하게 관리", "매장 하나당 제휴업체 계정 하나를 사용합니다. 다른 매장과 데이터가 섞이지 않도록 매장별로 독립 관리됩니다."],
  ["03", "방문으로 확인하는 성과", "쿠폰이 발급된 수가 아니라 매장에서 사용 완료된 수만 방문자로 집계합니다. 오늘·이번 달·누적 현황을 포털에서 확인할 수 있습니다."],
] as const;

const partnerFlow = [
  ["제휴 등록", "운영자가 발급한 일회성 링크로 매장 정보를 등록하고, 승인 후 계정을 사용합니다."],
  ["운영 제안 확인", "새 쿠폰·수량 변경·삭제는 운영자 제안으로 도착합니다. 사장님은 수락 또는 거절만 선택하면 됩니다."],
  ["방문 현황 확인", "서버 인증이 연결된 포털에서 사용 완료 기준의 방문 현황과 제휴 공지를 확인합니다."],
] as const;

export default function PartnerPage() {
  return (
    <main className="partner-page">
      <header className="partner-header">
        <Link className="partner-wordmark" href="/" aria-label="Campus Drop 홈">
          <span className="partner-wordmark-mark" aria-hidden="true">C</span>
          <span>Campus Drop</span>
        </Link>
        <Link className="partner-login-link" href="/partner/login">파트너 로그인</Link>
      </header>

      <section className="partner-hero" aria-labelledby="partner-title">
        <p className="landing-eyebrow">FOR LOCAL BUSINESS OWNERS</p>
        <h1 id="partner-title">대학생이<br /><em>매장을 발견하는</em><br />새로운 순간.</h1>
        <p>
          Campus Drop은 캠퍼스 안팎에서 활동하는 대학생과 지역 매장을 연결합니다.
          방문을 보장하지는 않지만, 학생들이 매장을 선택하고 실제로 들를 수 있는 새로운 접점을 함께 만듭니다.
        </p>
        <div className="partner-hero-actions">
          <a className="partner-contact-action" href="mailto:partner@campusdrop.kr">제휴 제안 받기 <span aria-hidden="true">↗</span></a>
          <Link className="partner-text-action" href="/partner/login">이미 제휴 중이신가요? 로그인 →</Link>
        </div>
      </section>

      <section className="partner-proof" aria-label="제휴 운영 방식">
        <p>대학생 방문은 <strong>쿠폰 사용 완료</strong>로만 확인합니다.</p>
        <span>발급 수 ≠ 방문자 수</span>
      </section>

      <section className="partner-options" aria-labelledby="partner-options-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">WHY PARTNER WITH US</p>
          <h2 id="partner-options-title">매장이 확인할 수 있는<br />제휴 경험을 만듭니다.</h2>
        </div>
        <div className="partner-option-grid">
          {partnerBenefits.map(([number, title, description]) => (
            <article key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-process" aria-labelledby="partner-process-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">HOW IT WORKS</p>
          <h2 id="partner-process-title">복잡한 운영 대신,<br />확인하고 결정하세요.</h2>
        </div>
        <ol>
          {partnerFlow.map(([title, description], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="partner-process-note">제휴 포털에는 별도 문의 채팅이 없습니다. 필요한 운영 제안과 공지는 포털에서 간단히 확인합니다.</p>
      </section>

      <section className="partner-next" aria-labelledby="partner-next-title">
        <p className="landing-eyebrow">LET&apos;S CONNECT WITH STUDENTS</p>
        <h2 id="partner-next-title">우리 매장과 대학생이<br />만나는 방법을 이야기해요.</h2>
        <div className="partner-next-actions">
          <a className="partner-contact-action" href="mailto:partner@campusdrop.kr">partner@campusdrop.kr <span aria-hidden="true">↗</span></a>
          <Link className="partner-next-login" href="/partner/login">파트너 포털 로그인</Link>
        </div>
      </section>
    </main>
  );
}
