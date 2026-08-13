import type { Metadata } from "next";
import { AdminDashboardScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "운영 대시보드 | Campus Drop" };
export default function AdminDashboardPage() { return <AdminDashboardScreen />; }
