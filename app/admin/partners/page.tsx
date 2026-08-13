import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "제휴업체 관리 | Campus Drop" };
export default function AdminPartnersPage() { return <AdminScreen currentPath="/admin/partners" title="제휴업체 관리" description="매장 단위의 제휴업체 정보와 가입 승인을 관리합니다." allowedRoles={["SUPER", "PARTNER_MANAGER"]} capability="제휴업체 관리" />; }
