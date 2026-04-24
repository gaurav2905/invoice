"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });

    setLoading(false);

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Login failed." }));
      setError(result.error || "Login failed.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="username">Admin Username</label>
        <input id="username" name="username" placeholder="admin" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Enter your password" required />
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      <button className="btn btn-primary" disabled={loading} type="submit">
        {loading ? "Checking..." : "Secure Login"}
      </button>
    </form>
  );
}
