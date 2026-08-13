import Link from "next/link";
import { styles } from "./PartnerPortal";

export function PartnerAuthScreen({
  eyebrow,
  title,
  description,
  tokenMessage,
  fields,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tokenMessage?: string;
  fields: Array<{ label: string; type?: "password" | "tel" | "text"; placeholder: string }>;
}) {
  return (
    <main className={styles.authPage}>
      <div className={styles.authShell}>
        <Link className={styles.backLink} href="/partner">← 제휴 안내로 돌아가기</Link>
        <section className={styles.authCard}>
          <p className={styles.authEyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          {tokenMessage ? <div className={styles.tokenBox}>{tokenMessage}</div> : null}
          <form className={styles.authForm} aria-label={title}>
            {fields.map((field) => (
              <label key={field.label}>
                {field.label}
                <input disabled placeholder={field.placeholder} type={field.type ?? "text"} />
              </label>
            ))}
            <button className={styles.authDisabledButton} disabled type="button">
              서버 인증 연동 후 이용 가능
            </button>
          </form>
          <p className={styles.authHelp}>
            이 화면은 로그인·초대·재설정 흐름을 위한 UI 예시입니다. 브라우저 저장소에 역할이나 로그인 정보를 저장하지 않습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
