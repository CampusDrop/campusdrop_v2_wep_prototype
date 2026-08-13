import Link from "next/link";
import type { ReactNode } from "react";
import { getPartnerPortalAccess } from "./portal-auth-boundary";
import styles from "./portal.module.css";

const navigation = [
  ["/partner/dashboard", "대시보드"],
  ["/partner/coupons", "쿠폰 현황"],
  ["/partner/proposals", "제안 확인"],
  ["/partner/notices", "공지"],
] as const;

export async function PartnerPortalShell({
  currentPath,
  title,
  description,
  renderContent,
}: {
  currentPath: string;
  title: string;
  description: string;
  /**
   * Content is a lazy callback so no tenant data is even built for an
   * unauthenticated/integration-required request.
   */
  renderContent: () => ReactNode;
}) {
  const access = await getPartnerPortalAccess();

  if (access.status !== "authorized") {
    return <PartnerPortalUnavailable />;
  }

  return (
    <main className={styles.portal}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Campus Drop 홈">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>Campus Drop</span>
          </Link>
          <span className={styles.portalLabel}>파트너 포털</span>
        </header>

        <nav className={styles.nav} aria-label="파트너 포털 메뉴">
          {navigation.map(([href, label]) => (
            <Link
              aria-current={href === currentPath ? "page" : undefined}
              className={href === currentPath ? styles.activeNavLink : styles.navLink}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        <section className={styles.pageHeading}>
          <p>PARTNER PORTAL</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </section>

        {renderContent()}
      </div>
    </main>
  );
}

function PartnerPortalUnavailable() {
  return (
    <main className={styles.authPage}>
      <div className={styles.authShell}>
        <Link className={styles.backLink} href="/partner">← 제휴 안내로 돌아가기</Link>
        <section className={styles.authCard}>
          <p className={styles.authEyebrow}>PARTNER PORTAL</p>
          <h1>로그인 연동을 준비하고 있어요.</h1>
          <p>
            이 페이지는 서버가 HttpOnly 세션, 파트너 역할, 매장 소속을 확인한 뒤에만 열립니다.
          </p>
          <div className={styles.tokenBox}>
            현재는 서버 인증 연결 전이므로 매장·쿠폰·방문자·제안·공지 정보를 표시하지 않습니다.
          </div>
          <Link className={styles.boundaryLoginLink} href="/partner/login">로그인 화면 보기</Link>
        </section>
      </div>
    </main>
  );
}

export function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

export function EmptyActionNote({ children }: { children: ReactNode }) {
  return <p className={styles.actionNote}>{children}</p>;
}

export { styles };
