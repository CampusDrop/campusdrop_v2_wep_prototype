import Image from "next/image";
import Link from "next/link";

const games = [
  {
    slug: "giraffe-investigation",
    title: "시계탑 기린 목격 사건",
    caseNumber: "CD-SJ-01",
    description: "시계탑 주변에 남은 세 건의 기록을 추적해, 사라지는 기린의 정체를 밝혀내세요.",
    details: ["위치 조사", "카메라 스캔", "기록 퍼즐"],
    href: "/games/giraffe",
    image: "/gfPhoto_03.png",
    status: "플레이 가능",
  },
] as const;

export default function GameHub() {
  return (
    <main className="game-hub">
      <div className="game-hub-noise" aria-hidden="true" />
      <header className="game-hub-header">
        <Link className="game-hub-brand" href="/" aria-label="Campus Drop 게임 선택">
          <Image src="/campusdrop_logo.png" alt="" width={46} height={46} priority unoptimized />
          <span>Campus Drop</span>
        </Link>
        <Link className="game-hub-editor-link" href="/maker">게임 만들기</Link>
      </header>

      <section className="game-hub-hero" aria-labelledby="game-hub-title">
        <p>Campus Drop Archive</p>
        <h1 id="game-hub-title">캠퍼스에 숨은<br />이야기를 시작하세요.</h1>
        <span>위치, 이미지, 기록으로 완성되는 캠퍼스 인터랙티브 게임</span>
      </section>

      <section className="game-library" aria-labelledby="game-library-title">
        <div className="game-library-heading">
          <div>
            <p>Playable case files</p>
            <h2 id="game-library-title">게임 선택</h2>
          </div>
          <span>{games.length}개의 게임</span>
        </div>

        <div className="game-card-grid">
          {games.map((game) => (
            <article className="game-card" key={game.slug}>
              <Image className="game-card-image" src={game.image} alt="시계탑 기린 목격 기록" fill sizes="(max-width: 720px) 100vw, 460px" priority unoptimized />
              <div className="game-card-shade" aria-hidden="true" />
              <div className="game-card-content">
                <div className="game-card-topline">
                  <span>{game.caseNumber}</span>
                  <b>{game.status}</b>
                </div>
                <div>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <ul aria-label="게임 방식">
                    {game.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                  <Link className="game-card-action" href={game.href}>사건 조사 시작 <i aria-hidden="true">→</i></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="game-hub-footer">새 게임은 Maker에서 설계한 뒤 이곳에 추가됩니다.</footer>
    </main>
  );
}
