import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "감사 로그 | Campus Drop" };
export default function AdminAuditLogsPage() { return <AdminScreen currentPath="/admin/audit-logs" title="감사 로그" description="수정·삭제할 수 없는 3년 보관 감사 기록을 조회합니다." allowedRoles={["SUPER"]} capability="감사 로그 조회" />; }
