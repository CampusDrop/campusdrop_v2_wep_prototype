import type { Metadata } from "next";
import { PartnerPortalShell, styles } from "../_portal/PartnerPortal";
import { couponsExample, getCouponStateLabel, getRemainingQuantity } from "../_portal/portal-data";

export const metadata: Metadata = { title: "쿠폰 현황 | Campus Drop" };

function displayQuantity(quantity: number | "unlimited") {
  return quantity === "unlimited" ? "무제한" : `${quantity}장`;
}

export default async function PartnerCouponsPage() {
  return (
    <PartnerPortalShell
      currentPath="/partner/coupons"
      description="쿠폰별 발급 가능 수량과 실제 사용 완료 수를 확인합니다."
      title="쿠폰 현황"
    >
      <div className={styles.couponList}>
        {couponsExample.map((coupon) => {
          const stateClass = coupon.state === "soldOut"
            ? `${styles.statusBadge} ${styles.statusSoldOut}`
            : coupon.state === "deletePending"
              ? `${styles.statusBadge} ${styles.statusDeletePending}`
              : styles.statusBadge;
          return (
            <article className={styles.couponCard} key={coupon.id}>
              <div className={styles.couponTop}>
                <h2 className={styles.couponName}>{coupon.name}</h2>
                <span className={stateClass}>{getCouponStateLabel(coupon.state)}</span>
              </div>
              <p className={styles.couponBenefit}>{coupon.benefit}</p>
              <div className={styles.couponMetrics}>
                <div><span>총 수량</span><strong>{displayQuantity(coupon.quantity)}</strong></div>
                <div><span>사용 완료</span><strong>{coupon.usedCount}건</strong></div>
                <div><span>발급 가능</span><strong>{displayQuantity(getRemainingQuantity(coupon))}</strong></div>
              </div>
            </article>
          );
        })}
      </div>
    </PartnerPortalShell>
  );
}
