import type { Metadata } from "next";
import { EmptyActionNote, PartnerPortalShell, styles } from "../_portal/PartnerPortal";
import { proposalsExample } from "../_portal/portal-data";

export const metadata: Metadata = { title: "제안 확인 | Campus Drop" };

const typeLabels = {
  newCoupon: "NEW COUPON",
  quantityChange: "QUANTITY CHANGE",
  delete: "DELETE COUPON",
} as const;

export default async function PartnerProposalsPage() {
  return (
    <PartnerPortalShell
      currentPath="/partner/proposals"
      description="운영자가 보낸 쿠폰 제안은 수락 또는 거절할 수 있습니다."
      title="제안 확인"
      renderContent={() => <>
      <div className={styles.stack}>
        {proposalsExample.map((proposal) => (
          <article className={styles.listItem} key={proposal.id}>
            <p className={styles.proposalType}>{typeLabels[proposal.type]}</p>
            <div className={styles.itemMeta}><span>{proposal.title}</span><span>{proposal.createdAt}</span></div>
            <p className={styles.itemText}>{proposal.description}</p>
            <div className={styles.proposalActions}>
              <button className={styles.acceptButton} disabled type="button">수락</button>
              <button className={styles.rejectButton} disabled type="button">거절</button>
            </div>
          </article>
        ))}
      </div>
      <EmptyActionNote>수락·거절은 서버에서 업체 소속과 대기 상태를 다시 검증한 뒤 반영되어야 합니다.</EmptyActionNote>
      </>}
    />
  );
}
