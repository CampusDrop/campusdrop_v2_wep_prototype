import Image from "next/image";
import Link from "next/link";

const productSteps = [
  ["01", "공통 관심사로 모여요", "같은 취미와 관심사를 가진 사람들과 탐험대를 만들어요."],
  ["02", "캠퍼스의 이야기를 찾아요", "장소에 얽힌 기록과 단서를 따라, 익숙한 길을 새롭게 만나죠."],
  ["03", "경험을 보상으로 이어가요", "탐험을 마친 뒤에는 제휴 매장에서 쓸 수 있는 보상을 만나요."],
] as const;

const principles = [
  ["함께라서 더 선명한 발견", "관심사가 겹치는 사람들과 시작해, 혼자였다면 지나쳤을 장면을 함께 마주합니다."],
  ["캠퍼스를 목적지로 바꾸는 경험", "약속 장소와 수업 사이의 시간도, 직접 걷고 발견하는 탐험의 일부가 됩니다."],
  ["매장과 학생을 책임 있게 연결", "보상은 실제 사용이 완료된 경우에만 방문으로 기록합니다. 방문을 약속하지는 않습니다."],
] as const;

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-grain" aria-hidden="true" />
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Campus Drop 홈">
          <Image src="/campusdrop_logo.png" alt="" width={44} height={44} priority />
          <span>Campus Drop</span>
        </Link>
        <nav className="landing-nav" aria-label="주요 메뉴">
          <Link href="/games/giraffe">첫 탐험</Link>
          <Link href="/partner">제휴 안내</Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">CAMPUS DISCOVERY PLATFORM</p>
          <h1 id="landing-title">캠퍼스를<br /><em>함께 발견하는</em><br />새로운 방법</h1>
          <p className="landing-lede">
            Campus Drop은 공통 관심사로 탐험대를 만들고,
            캠퍼스 곳곳의 이야기와 공간을 직접 발견하는 플랫폼입니다.
          </p>
          <div className="landing-actions">
            <Link className="landing-action landing-action-primary" href="/games/giraffe">
              Campus Drop 시작하기 <span aria-hidden="true">↗</span>
            </Link>
            <Link className="landing-action landing-action-secondary" href="/partner">
              매장 제휴 알아보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="landing-hero-map" aria-label="관심사로 연결된 캠퍼스 탐험의 흐름">
          <div className="landing-map-orbit landing-map-orbit-one" aria-hidden="true" />
          <div className="landing-map-orbit landing-map-orbit-two" aria-hidden="true" />
          <div className="landing-map-line landing-map-line-one" aria-hidden="true" />
          <div className="landing-map-line landing-map-line-two" aria-hidden="true" />
          <div className="landing-map-pin landing-map-pin-one"><span>커피</span></div>
          <div className="landing-map-pin landing-map-pin-two"><span>사진</span></div>
          <div className="landing-map-pin landing-map-pin-three"><span>산책</span></div>
          <div className="landing-map-core">
            <span>같은 관심사</span>
            <strong>탐험대</strong>
          </div>
          <div className="landing-map-note">
            <span>DROP 01</span>
            <strong>발견은, 함께 시작돼요.</strong>
          </div>
        </div>
      </section>

      <section className="landing-intro" aria-labelledby="landing-intro-title">
        <p className="landing-eyebrow">WHY CAMPUS DROP</p>
        <h2 id="landing-intro-title">지나치던 캠퍼스에<br />나만의 목적지가 생깁니다.</h2>
        <p>
          Campus Drop은 게임 하나를 넘어, 사람·장소·이야기를 연결해
          캠퍼스 생활의 새로운 장면을 만들어 갑니다.
        </p>
      </section>

      <section className="landing-steps" aria-labelledby="landing-steps-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">THE DROP FLOW</p>
          <h2 id="landing-steps-title">발견은 이렇게 이어져요</h2>
        </div>
        <ol>
          {productSteps.map(([number, title, description]) => (
            <li key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-principles" aria-labelledby="landing-principles-title">
        <div className="landing-principles-heading">
          <p className="landing-eyebrow">MADE FOR CAMPUS LIFE</p>
          <h2 id="landing-principles-title">캠퍼스에 머무는 시간이<br />조금 더 기대되도록</h2>
        </div>
        <div className="landing-principle-list">
          {principles.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-first-case" aria-labelledby="landing-case-title">
        <div>
          <p className="landing-eyebrow">FIRST CAMPUS CASE</p>
          <h2 id="landing-case-title">첫 번째 발견,<br />시계탑 기린 목격 사건</h2>
          <p>
            Campus Drop의 첫 현장형 플레이를 만나 보세요.
            캠퍼스를 걸으며 단서를 찾고, 이야기를 완성합니다.
          </p>
          <Link className="landing-action landing-action-primary" href="/games/giraffe">
            첫 탐험 플레이하기 <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="landing-case-card" aria-hidden="true">
          <span className="landing-case-stamp">CASE 01</span>
          <span className="landing-case-mark">?</span>
          <strong>시계탑에서<br />무슨 일이 있었을까?</strong>
          <span className="landing-case-meta">LOCATION-BASED PLAY</span>
        </div>
      </section>

      <section className="landing-partner-callout" aria-labelledby="landing-partner-title">
        <div>
          <p className="landing-eyebrow">FOR CAMPUS PARTNERS</p>
          <h2 id="landing-partner-title">대학생의 다음 방문이<br />당신의 매장에서 시작될 수 있어요.</h2>
        </div>
        <div>
          <p>Campus Drop은 탐험을 마친 학생과 매장을 자연스럽게 연결합니다.</p>
          <Link className="landing-inline-link" href="/partner">제휴 안내 보기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© Campus Drop</span>
        <span>Discover campus, together.</span>
      </footer>
    </main>
  );
}
