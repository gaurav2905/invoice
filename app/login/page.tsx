import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <section className="login-copy">
          <span className="eyebrow" style={{ color: "rgba(255,255,255,0.72)" }}>
            Smart Invoicing with Secure Control Panel
          </span>
          <h1>Modern invoicing with a protected control panel.</h1>
          <p>
            Sign in to manage companies, generate GST-compliant invoices, maintain sequential records, and export professional PDF documents.
          </p>
          <div className="notice" style={{ marginTop: 24, background: "rgba(255,255,255,0.14)", color: "white" }}>
            Access is restricted to authorized administrators only. Ensure you have valid login credentials.
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
