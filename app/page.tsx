import Link from "next/link";

const productSteps = [
  ["01", "공통 관심사로 모여요", "같은 취미와 관심사를 바탕으로 탐험대를 꾸릴 수 있는 경험을 준비하고 있어요."],
  ["02", "캠퍼스의 이야기를 찾아요", "장소에 얽힌 기록과 단서를 따라, 익숙한 길을 새롭게 만나도록 설계하고 있어요."],
  ["03", "경험을 보상으로 이어가요", "제휴 연동이 완료되면 탐험 경험이 매장 보상으로 자연스럽게 이어질 예정이에요."],
] as const;

const principles = [
  ["함께라서 더 선명한 발견", "관심사가 겹치는 사람들과 시작해, 혼자였다면 지나쳤을 장면을 함께 마주하는 방식을 준비합니다."],
  ["캠퍼스를 목적지로 바꾸는 경험", "약속 장소와 수업 사이의 시간도 직접 걷고 발견하는 탐험의 일부가 되도록 그려 가고 있어요."],
  ["매장과 학생을 책임 있게 연결", "향후 보상 연동 시 실제 사용이 완료된 경우에만 방문으로 기록하며, 방문을 약속하지 않습니다."],
] as const;

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-grain" aria-hidden="true" />
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Campus Drop 홈">
          <span className="landing-brand-placeholder" aria-hidden="true" />
          <span className="landing-brand-name">Campus Drop</span>
        </Link>
        <nav className="landing-nav" aria-label="주요 메뉴">
          <Link href="#campus-drop">Campus Drop</Link>
          <Link href="/partner">제휴 안내</Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">CAMPUS DISCOVERY PLATFORM</p>
          <h1 id="landing-title">캠퍼스를<br /><em>함께 발견하는</em><br />새로운 방법</h1>
          <p className="landing-lede">
            Campus Drop이 준비하는 경험은 공통 관심사로 탐험대를 꾸리고,
            캠퍼스 곳곳의 이야기와 공간을 함께 발견하는 새로운 방식입니다.
          </p>
          <div className="landing-actions">
            <Link className="landing-action landing-action-primary" href="#how-it-works">
              Campus Drop 알아보기 <span aria-hidden="true">↓</span>
            </Link>
            <Link className="landing-action landing-action-secondary" href="/partner">
              매장 제휴 알아보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="landing-media-placeholder landing-hero-placeholder" role="group" aria-label="Campus Drop 대표 이미지 영역">
          <span>이미지 영역</span>
        </div>
      </section>

      <section id="campus-drop" className="landing-intro" aria-labelledby="landing-intro-title">
        <p className="landing-eyebrow">WHY CAMPUS DROP</p>
        <h2 id="landing-intro-title">지나치던 캠퍼스에<br />나만의 목적지가 생깁니다.</h2>
        <p>
          Campus Drop은 게임 하나를 넘어 사람·장소·이야기를 연결할
          캠퍼스 생활의 새로운 장면을 준비하고 있습니다.
        </p>
      </section>

      <section id="how-it-works" className="landing-steps" aria-labelledby="landing-steps-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">THE DROP FLOW</p>
          <h2 id="landing-steps-title">준비 중인 Campus Drop 경험</h2>
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
        <div className="landing-media-placeholder landing-case-placeholder" role="group" aria-label="첫 번째 플레이 소개 이미지 영역">
          <span>이미지 영역</span>
        </div>
      </section>

      <section className="landing-partner-callout" aria-labelledby="landing-partner-title">
        <div>
          <p className="landing-eyebrow">FOR CAMPUS PARTNERS</p>
          <h2 id="landing-partner-title">대학생의 다음 방문을<br />함께 준비해 주세요.</h2>
        </div>
        <div>
          <p>제휴 연동이 완료되면 Campus Drop은 탐험 경험과 매장을 자연스럽게 연결할 예정입니다.</p>
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
