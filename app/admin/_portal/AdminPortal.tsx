import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminPortalAccess, type AdminRole } from "./admin-auth-boundary";
import styles from "./admin-portal.module.css";

type AdminNavigation = { href: string; label: string; roles: AdminRole[] };

const navigation: AdminNavigation[] = [
  { href: "/admin/dashboard", label: "대시보드", roles: ["SUPER", "PARTNER_MANAGER", "USER_SERVICE_MANAGER"] },
  { href: "/admin/accounts", label: "계정 관리", roles: ["SUPER"] },
  { href: "/admin/partners", label: "제휴업체", roles: ["SUPER", "PARTNER_MANAGER"] },
  { href: "/admin/coupon-proposals", label: "쿠폰 제안", roles: ["SUPER", "PARTNER_MANAGER"] },
  { href: "/admin/categories", label: "카테고리", roles: ["SUPER"] },
  { href: "/admin/interests", label: "관심사 연결", roles: ["SUPER"] },
  { href: "/admin/notices/partner", label: "제휴 공지", roles: ["SUPER", "PARTNER_MANAGER"] },
  { href: "/admin/notices/user", label: "사용자 공지", roles: ["SUPER", "USER_SERVICE_MANAGER"] },
  { href: "/admin/games", label: "게임·이벤트", roles: ["SUPER", "USER_SERVICE_MANAGER"] },
  { href: "/admin/editor", label: "미션 에디터", roles: ["SUPER", "USER_SERVICE_MANAGER"] },
  { href: "/admin/audit-logs", label: "감사 로그", roles: ["SUPER"] },
];

export async function AdminPortalShell({
  currentPath,
  title,
  description,
  allowedRoles,
  renderContent,
}: {
  currentPath: string;
  title: string;
  description: string;
  allowedRoles: AdminRole[];
  /** Content is built only after the server validates the current actor. */
  renderContent: () => ReactNode;
}) {
  const access = await getAdminPortalAccess();

  if (access.status !== "authorized") return <AdminUnavailable />;
  if (!allowedRoles.includes(access.role)) return <AdminForbidden />;

  return (
    <main className={styles.portal}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Campus Drop 홈">
            <span className={styles.brandMark} aria-hidden="true">C</span><span>Campus Drop</span>
          </Link>
          <span className={styles.portalLabel}>운영자 포털</span>
        </header>
        <nav className={styles.nav} aria-label="운영자 포털 메뉴">
          {navigation.filter((item) => item.roles.includes(access.role)).map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.href === currentPath ? "page" : undefined} className={item.href === currentPath ? styles.activeNavLink : styles.navLink}>{item.label}</Link>
          ))}
        </nav>
        <section className={styles.heading}>
          <p>OPERATIONS PORTAL</p><h1>{title}</h1><span>{description}</span>
        </section>
        {renderContent()}
      </div>
    </main>
  );
}

export function AdminPlaceholder({ heading, detail }: { heading: string; detail: string }) {
  return <section className={styles.section}><h2>{heading}</h2><div className={styles.emptyPanel}>{detail}</div></section>;
}

function AdminUnavailable() {
  return <main className={styles.authPage}><div className={styles.authShell}>
    <Link className={styles.backLink} href="/">← Campus Drop 홈으로 돌아가기</Link>
    <section className={styles.authCard}><p className={styles.eyebrow}>OPERATIONS PORTAL</p><h1>로그인 연동을 준비하고 있어요.</h1>
      <p>이 페이지는 서버가 HttpOnly 세션과 운영자 역할을 확인한 뒤에만 열립니다.</p>
      <p className={styles.authNote}>현재는 서버 인증 연동 전이므로 계정, 제휴업체, 쿠폰, 게임, 공지, 감사 로그 정보를 표시하지 않습니다.</p>
      <Link className={styles.backLink} href="/admin/login">로그인 화면 보기 →</Link>
    </section>
  </div></main>;
}

function AdminForbidden() {
  return <main className={styles.authPage}><div className={styles.authShell}>
    <Link className={styles.backLink} href="/">← Campus Drop 홈으로 돌아가기</Link>
    <section className={styles.authCard}><p className={styles.eyebrow}>OPERATIONS PORTAL</p><h1>접근 권한이 없습니다.</h1><p>현재 역할로는 이 운영 영역을 조회하거나 변경할 수 없습니다.</p></section>
  </div></main>;
}

export { styles };
