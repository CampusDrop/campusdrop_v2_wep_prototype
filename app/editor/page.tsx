import type { Metadata } from "next";
import Link from "next/link";
import styles from "../admin/_portal/admin-portal.module.css";

export const metadata: Metadata = { title: "제작 도구 | Campus Drop" };

/** Public legacy route: sensitive editor code is intentionally not imported here. */
export default function LegacyEditorPage() {
  return <main className={styles.authPage}><div className={styles.authShell}>
    <Link className={styles.backLink} href="/">← Campus Drop 홈으로 돌아가기</Link>
    <section className={styles.authCard}><p className={styles.eyebrow}>INTERNAL TOOL</p><h1>제작 도구는 보호된 운영자 포털로 이동했습니다.</h1><p>이 도구는 서버가 인증과 역할을 확인한 운영자만 사용할 수 있습니다.</p><p className={styles.authNote}>인증 연동이 완료되면 권한 있는 운영자는 <strong>/admin/editor</strong>에서 접근합니다.</p></section>
  </div></main>;
}
