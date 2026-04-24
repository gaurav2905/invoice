import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <section className="login-copy">
          <span className="eyebrow" style={{ color: "rgba(255,255,255,0.72)" }}>
            Secure Admin Access
          </span>
          <h1>Modern invoicing with a protected control panel.</h1>
          <p>
            Sign in as an authenticated admin to manage companies, generate sequential invoices, apply HST/GST rules, and
            export polished PDF-ready bills.
          </p>
          <div className="notice" style={{ marginTop: 24, background: "rgba(255,255,255,0.14)", color: "white" }}>
            Default local credentials come from your environment variables. Update `.env` before production use.
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Welcome Back</span>
            <h2 style={{ marginBottom: 8 }}>Admin Login</h2>
            <p className="muted">Protected routes stay locked until you sign in.</p>
          </div>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}
