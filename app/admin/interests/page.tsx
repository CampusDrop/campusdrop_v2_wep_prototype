import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "관심사 연결 | Campus Drop" };
export default function AdminInterestsPage() { return <AdminScreen currentPath="/admin/interests" title="관심사 연결" description="관심사별로 연결 가능한 업체 카테고리를 관리합니다." allowedRoles={["SUPER"]} capability="관심사-카테고리 연결 관리" />; }
