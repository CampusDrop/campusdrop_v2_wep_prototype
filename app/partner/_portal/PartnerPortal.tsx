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
  children,
}: {
  currentPath: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const access = await getPartnerPortalAccess();

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

        <div className={styles.integrationNotice} role="status">
          <strong>서버 인증 연동 전 예시 화면입니다.</strong>
          <span>
            실제 이용은 HttpOnly 세션과 서버의 업체 소속 검증이 연결된 뒤에만 가능합니다.
          </span>
        </div>

        {access.status === "integration-required" ? null : null}

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
          <p>PARTNER PORTAL · SAMPLE</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </section>

        {children}
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
