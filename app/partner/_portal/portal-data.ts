/**
 * Visual-only sample data for the partner portal.
 *
 * This file must be replaced with server-authorized data from the partner API.
 * It deliberately contains no identity, session, or role information.
 */
export type CouponQuantity = number | "unlimited";

export type PartnerCoupon = {
  id: string;
  name: string;
  benefit: string;
  quantity: CouponQuantity;
  issuedCount: number;
  usedCount: number;
  state: "active" | "soldOut" | "deletePending";
};

export type PartnerProposal = {
  id: string;
  title: string;
  type: "newCoupon" | "quantityChange" | "delete";
  description: string;
  createdAt: string;
};

export type PartnerNotice = {
  id: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  isNew?: boolean;
};

export const partnerStoreExample = {
  name: "예시 카페",
  category: "카페",
  todayVisitors: 7,
  monthVisitors: 84,
  allTimeVisitors: 1264,
};

export const couponsExample: PartnerCoupon[] = [
  {
    id: "sample-coupon-1",
    name: "아메리카노 1,000원 할인",
    benefit: "아메리카노 주문 시 1,000원 할인",
    quantity: "unlimited",
    issuedCount: 422,
    usedCount: 315,
    state: "active",
  },
  {
    id: "sample-coupon-2",
    name: "시그니처 라테 무료 업그레이드",
    benefit: "사이즈 업 또는 샷 추가 중 1개 무료",
    quantity: 100,
    issuedCount: 100,
    usedCount: 77,
    state: "soldOut",
  },
  {
    id: "sample-coupon-3",
    name: "디저트 10% 할인",
    benefit: "베이커리 및 디저트 메뉴 10% 할인",
    quantity: "unlimited",
    issuedCount: 88,
    usedCount: 62,
    state: "deletePending",
  },
];

export const proposalsExample: PartnerProposal[] = [
  {
    id: "sample-proposal-1",
    title: "신규 쿠폰 제안",
    type: "newCoupon",
    description: "쿠폰명: 오후 3시 이후 디저트 10% 할인 · 혜택 내용: 디저트 단품 10% 할인 · 총 수량: 무제한",
    createdAt: "2026. 8. 13.",
  },
  {
    id: "sample-proposal-2",
    title: "쿠폰 수량 변경 제안",
    type: "quantityChange",
    description: "대상: 시그니처 라테 무료 업그레이드 · 총 수량: 100장 → 200장",
    createdAt: "2026. 8. 12.",
  },
];

export const noticesExample: PartnerNotice[] = [
  {
    id: "sample-notice-1",
    title: "8월 Campus Drop 운영 일정 안내",
    publishedAt: "2026. 8. 12.",
    excerpt: "8월 캠퍼스 탐험 운영 일정과 쿠폰 사용 확인 방법을 안내드립니다.",
    isNew: true,
  },
  {
    id: "sample-notice-2",
    title: "쿠폰 제안 확인 방법이 바뀝니다",
    publishedAt: "2026. 8. 4.",
    excerpt: "새 쿠폰·수량 변경·삭제 제안은 포털의 제안 메뉴에서 수락 또는 거절할 수 있습니다.",
  },
  {
    id: "sample-notice-3",
    title: "방문자 수 집계 기준 안내",
    publishedAt: "2026. 7. 28.",
    excerpt: "방문자 수는 매장에서 쿠폰 사용이 완료된 건을 기준으로 집계됩니다.",
  },
];

export function getRemainingQuantity(coupon: PartnerCoupon): number | "unlimited" {
  return coupon.quantity === "unlimited"
    ? "unlimited"
    : Math.max(coupon.quantity - coupon.issuedCount, 0);
}

export function getCouponStateLabel(state: PartnerCoupon["state"]) {
  const labels = {
    active: "활성",
    soldOut: "발급 소진",
    deletePending: "삭제 검토 중",
  } as const;
  return labels[state];
}
