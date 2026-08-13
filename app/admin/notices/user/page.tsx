import type { Metadata } from "next";
import { AdminScreen } from "../../_portal/AdminScreen";
export const metadata: Metadata = { title: "사용자 공지 | Campus Drop" };
export default function AdminUserNoticesPage() { return <AdminScreen currentPath="/admin/notices/user" title="사용자 공지" description="앱 전용 공지를 임시저장, 즉시 발행, KST 예약 발행합니다." allowedRoles={["SUPER", "USER_SERVICE_MANAGER"]} capability="사용자 공지 관리" />; }
