import type { ReactNode } from "react";
import { AdminPortalShell, AdminPlaceholder, styles } from "./AdminPortal";
import type { AdminRole } from "./admin-auth-boundary";

export function AdminScreen({
  currentPath,
  title,
  description,
  allowedRoles,
  capability,
}: {
  currentPath: string;
  title: string;
  description: string;
  allowedRoles: AdminRole[];
  capability: string;
}) {
  return <AdminPortalShell currentPath={currentPath} title={title} description={description} allowedRoles={allowedRoles} renderContent={() => <AdminPlaceholder heading="서버 연동 대기" detail={`${capability}은(는) 서버가 권한과 데이터를 확인한 뒤 사용할 수 있습니다.`} />} />;
}

export function AdminDashboardScreen() {
  return <AdminPortalShell currentPath="/admin/dashboard" title="운영 대시보드" description="역할별 운영 현황을 안전하게 확인합니다." allowedRoles={["SUPER", "PARTNER_MANAGER", "USER_SERVICE_MANAGER"]} renderContent={() => <DashboardPlaceholder />} />;
}

function DashboardPlaceholder(): ReactNode {
  return <>
    <section className={styles.cardGrid} aria-label="운영 현황">
      <article className={styles.placeholderCard}><span>운영 현황</span><strong>서버 연동 대기</strong><p>현재 역할에 맞는 지표만 표시됩니다.</p></article>
      <article className={styles.placeholderCard}><span>검토 대기</span><strong>—</strong><p>권한 확인 후 집계합니다.</p></article>
      <article className={styles.placeholderCard}><span>예약 발행</span><strong>—</strong><p>KST 기준으로 표시합니다.</p></article>
    </section>
    <AdminPlaceholder heading="안전한 데이터 표시" detail="브라우저에 역할을 저장하거나 예시 운영 데이터를 먼저 실어 보내지 않습니다." />
  </>;
}
