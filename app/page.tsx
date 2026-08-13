import Image from "next/image";
import Link from "next/link";

const gameSteps = [
  ["01", "단서를 발견해요", "캠퍼스의 장소와 기록 속에서 사건의 시작점을 찾습니다."],
  ["02", "현장을 조사해요", "위치 확인과 카메라 스캔으로 다음 단서를 열어 보세요."],
  ["03", "이야기를 완성해요", "퍼즐을 풀고, 캠퍼스에 남은 이야기를 당신의 기록으로 남깁니다."],
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
          <Link href="/games/giraffe">방탈출 게임</Link>
          <Link href="/partner">파트너 제휴</Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">CAMPUS ESCAPE EXPERIENCE</p>
          <h1 id="landing-title">캠퍼스의 평범한 하루에,<br /><em>미스터리</em>를 떨어뜨리다.</h1>
          <p className="landing-lede">
            Campus Drop은 익숙한 학교 공간을 단서와 이야기로 바꾸는
            오프라인 방탈출 경험입니다.
          </p>
          <div className="landing-actions">
            <Link className="landing-action landing-action-primary" href="/games/giraffe">
              사건 조사 시작하기 <span aria-hidden="true">↗</span>
            </Link>
            <Link className="landing-action landing-action-secondary" href="/partner">
              캠퍼스 파트너 되기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="landing-hero-visual" aria-label="시계탑 기린 목격 사건의 현장 기록">
          <Image src="/gfPhoto_03.png" alt="캠퍼스 시계탑 앞에 나타난 기린" fill priority sizes="(max-width: 800px) 100vw, 50vw" />
          <div className="landing-visual-shade" aria-hidden="true" />
          <p className="landing-case-tag">CASE FILE · CD-SJ-01</p>
          <div className="landing-visual-caption">
            <span>NOW PLAYING</span>
            <strong>시계탑 기린 목격 사건</strong>
          </div>
        </div>
      </section>

      <section className="landing-intro" aria-labelledby="landing-intro-title">
        <p className="landing-eyebrow">THE CAMPUS BECOMES THE GAME</p>
        <h2 id="landing-intro-title">지나치던 길이, 오늘의 탈출 경로가 됩니다.</h2>
        <p>
          지도 위의 지점, 현장에 숨은 표식, 누군가 남긴 기록을 따라가며
          캠퍼스만의 이야기를 직접 풀어 보세요.
        </p>
      </section>

      <section className="landing-steps" aria-labelledby="landing-steps-title">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">HOW TO PLAY</p>
          <h2 id="landing-steps-title">발견에서 탈출까지</h2>
        </div>
        <ol>
          {gameSteps.map(([number, title, description]) => (
            <li key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-partner-callout" aria-labelledby="landing-partner-title">
        <div>
          <p className="landing-eyebrow">FOR CAMPUS PARTNERS</p>
          <h2 id="landing-partner-title">당신의 공간도<br />이야기의 일부가 될 수 있어요.</h2>
        </div>
        <div>
          <p>매장, 기관, 동아리와 함께 캠퍼스의 새로운 경험을 설계합니다.</p>
          <Link className="landing-inline-link" href="/partner">제휴 안내 보기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© Campus Drop</span>
        <span>Play outside the ordinary.</span>
      </footer>
    </main>
  );
}
