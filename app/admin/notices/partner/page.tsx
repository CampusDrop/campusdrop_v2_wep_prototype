import type { Metadata } from "next";
import { AdminScreen } from "../../_portal/AdminScreen";
export const metadata: Metadata = { title: "제휴 공지 | Campus Drop" };
export default function AdminPartnerNoticesPage() { return <AdminScreen currentPath="/admin/notices/partner" title="제휴업체 공지" description="임시저장, 즉시 발행, KST 예약 발행을 관리합니다." allowedRoles={["SUPER", "PARTNER_MANAGER"]} capability="제휴업체 공지 관리" />; }
