import type { Metadata } from "next";
import Link from "next/link";
import { MetricCard, PartnerPortalShell, styles } from "../_portal/PartnerPortal";
import { noticesExample, partnerStoreExample, proposalsExample } from "../_portal/portal-data";

export const metadata: Metadata = { title: "파트너 대시보드 | Campus Drop" };

export default async function PartnerDashboardPage() {
  return (
    <PartnerPortalShell
      currentPath="/partner/dashboard"
      description={`${partnerStoreExample.name} · ${partnerStoreExample.category}의 방문자와 운영 소식을 확인합니다.`}
      title="대시보드"
    >
      <section className={styles.metricGrid} aria-label="방문자 현황">
        <MetricCard description="쿠폰 사용 완료 기준" label="오늘 방문자" value={`${partnerStoreExample.todayVisitors}명`} />
        <MetricCard description="KST 매월 1일 00:00부터" label="이번 달 방문자" value={`${partnerStoreExample.monthVisitors}명`} />
        <MetricCard description="쿠폰 사용 완료 누적" label="누적 방문자" value={`${partnerStoreExample.allTimeVisitors.toLocaleString()}명`} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>검토 대기 제안</h2>
          <Link href="/partner/proposals">모두 보기 →</Link>
        </div>
        <div className={styles.panel}>
          <div className={styles.itemMeta}><span>운영자 제안</span><span className={styles.newBadge}>{proposalsExample.length}건 대기</span></div>
          <p className={styles.itemTitle}>수락 또는 거절이 필요한 제안이 있습니다.</p>
          <p className={styles.itemText}>대기 중인 제안은 자동으로 만료되지 않습니다.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>최근 공지</h2>
          <Link href="/partner/notices">모두 보기 →</Link>
        </div>
        <div className={styles.stack}>
          {noticesExample.slice(0, 2).map((notice) => (
            <article className={styles.listItem} key={notice.id}>
              <div className={styles.itemMeta}><span>{notice.publishedAt}</span>{notice.isNew ? <span className={styles.newBadge}>NEW</span> : null}</div>
              <h3 className={styles.itemTitle}>{notice.title}</h3>
              <p className={styles.itemText}>{notice.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </PartnerPortalShell>
  );
}
