import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "쿠폰 제안 | Campus Drop" };
export default function AdminCouponProposalsPage() { return <AdminScreen currentPath="/admin/coupon-proposals" title="쿠폰 제안" description="제휴업체의 수락 또는 거절 전까지 한 쿠폰당 하나의 제안만 유지합니다." allowedRoles={["SUPER", "PARTNER_MANAGER"]} capability="쿠폰 제안 관리" />; }
