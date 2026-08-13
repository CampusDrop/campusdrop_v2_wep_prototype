import type { Metadata } from "next";
import { PartnerPortalShell, styles } from "../_portal/PartnerPortal";
import { noticesExample } from "../_portal/portal-data";

export const metadata: Metadata = { title: "파트너 공지 | Campus Drop" };

export default async function PartnerNoticesPage() {
  return (
    <PartnerPortalShell
      currentPath="/partner/notices"
      description="Campus Drop 운영진이 발행한 제휴업체 대상 공지입니다."
      title="공지"
      renderContent={() => <>
      <div className={styles.stack}>
        {noticesExample.map((notice) => (
          <article className={styles.listItem} key={notice.id}>
            <div className={styles.itemMeta}><span>{notice.publishedAt}</span>{notice.isNew ? <span className={styles.newBadge}>NEW</span> : null}</div>
            <h2 className={styles.itemTitle}>{notice.title}</h2>
            <p className={styles.itemText}>{notice.excerpt}</p>
          </article>
        ))}
      </div>
      </>}
    />
  );
}
