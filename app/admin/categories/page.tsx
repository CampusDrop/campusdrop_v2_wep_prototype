import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "카테고리 관리 | Campus Drop" };
export default function AdminCategoriesPage() { return <AdminScreen currentPath="/admin/categories" title="업체 카테고리" description="매장당 하나의 카테고리를 안전하게 관리합니다." allowedRoles={["SUPER"]} capability="카테고리 관리" />; }
