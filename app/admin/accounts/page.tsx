import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "계정 관리 | Campus Drop" };
export default function AdminAccountsPage() { return <AdminScreen currentPath="/admin/accounts" title="계정 관리" description="운영자와 제휴업체 계정의 초대, 가입 승인, 비활성화를 관리합니다." allowedRoles={["SUPER"]} capability="계정 관리" />; }
