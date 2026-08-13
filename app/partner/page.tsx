import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "파트너 제휴 | Campus Drop",
  description: "Campus Drop과 함께 캠퍼스의 새로운 방탈출 경험을 만드세요.",
};

const partnershipTypes = [
  ["공간 파트너", "매장과 캠퍼스 공간을 게임의 특별한 장면으로 만듭니다."],
  ["콘텐츠 파트너", "학교만의 이야기와 문화를 미션으로 함께 설계합니다."],
  ["리워드 파트너", "플레이어의 여정 끝에 기억에 남을 혜택을 제안합니다."],
] as const;

export default function PartnerPage() {
  return (
    <main className="partner-page">
      <header className="partner-header">
        <Link className="landing-brand partner-brand" href="/" aria-label="Campus Drop 홈">
          <Image src="/campusdrop_logo.png" alt="" width={42} height={42} priority />
          <span>Campus Drop</span>
        </Link>
        <Link className="partner-game-link" href="/games/giraffe">방탈출 게임 보기</Link>
      </header>

      <section className="partner-hero" aria-labelledby="partner-title">
        <p className="landing-eyebrow">PARTNERSHIP WITH CAMPUS DROP</p>
        <h1 id="partner-title">캠퍼스의 일상에<br /><em>새로운 이유</em>를 더하세요.</h1>
        <p>
          Campus Drop은 학생들이 직접 걷고, 발견하고, 기억하는
          현장형 방탈출 경험을 만듭니다. 함께할 파트너를 찾고 있어요.
        </p>
        <a className="partner-contact-action" href="mailto:partner@campusdrop.kr">
          제휴 문의하기 <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="partner-image-band" aria-label="Campus Drop 현장 이미지">
        <Image src="/gfPhoto_01.png" alt="Campus Drop의 캠퍼스 현장 조사" fill sizes="100vw" />
      </section>

      <section className="partner-options" aria-labelledby="partner-options-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">WAYS TO COLLABORATE</p>
          <h2 id="partner-options-title">이렇게 함께할 수 있어요.</h2>
        </div>
        <div className="partner-option-grid">
          {partnershipTypes.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-next" aria-labelledby="partner-next-title">
        <p className="landing-eyebrow">LET&apos;S MAKE A DROP</p>
        <h2 id="partner-next-title">함께 만들 이야기를 들려주세요.</h2>
        <a className="partner-contact-action" href="mailto:partner@campusdrop.kr">partner@campusdrop.kr <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  );
}
