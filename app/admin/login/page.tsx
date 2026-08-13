import type { Metadata } from "next";
import Link from "next/link";
import styles from "../_portal/admin-portal.module.css";

export const metadata: Metadata = { title: "운영자 로그인 | Campus Drop" };

export default function AdminLoginPage() {
  return <main className={styles.authPage}><div className={styles.authShell}>
    <Link className={styles.backLink} href="/">← Campus Drop 홈으로 돌아가기</Link>
    <section className={styles.authCard}><p className={styles.eyebrow}>OPERATIONS PORTAL</p><h1>운영자 로그인</h1>
      <p>승인된 운영자 계정으로 로그인합니다.</p>
      <form className={styles.loginForm} aria-label="운영자 로그인">
        <label>아이디<input disabled placeholder="서버 인증 연동 후 입력 가능" type="text" /></label>
        <label>비밀번호<input disabled placeholder="서버 인증 연동 후 입력 가능" type="password" /></label>
        <button className={styles.disabledButton} disabled type="button">서버 인증 연동 후 이용 가능</button>
      </form>
      <p className={styles.authNote}>로그인 상태와 역할은 HttpOnly 보안 세션을 통해 서버에서만 확인합니다.</p>
    </section>
  </div></main>;
}
