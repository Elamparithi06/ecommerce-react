import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, currentUser } = useStore();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");

  function onSubmit(event) {
    event.preventDefault();
    signIn({ name, email });
    navigate("/account");
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-black">Sign In</h1>
      <p className="mt-1 text-sm text-slate-600">Use mock account sign-in for full shopping features.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          Continue
        </button>
      </form>
    </section>
  );
}
