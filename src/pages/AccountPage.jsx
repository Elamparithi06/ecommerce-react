import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function AccountPage() {
  const navigate = useNavigate();
  const { currentUser, signOut, addresses, removeAddress, orders, setSelectedAddressId } =
    useStore();

  if (!currentUser) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xl font-bold text-slate-900">Please sign in to view account.</p>
        <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-slate-700">
          Go to login
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black">Account</h1>
        <p className="mt-2 text-sm text-slate-600">
          {currentUser.name} ({currentUser.email})
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/orders")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View Orders ({orders.length})
          </button>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Sign Out
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Address Book</h2>
        <div className="mt-3 grid gap-3">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{address.fullName || "No name"}</p>
              <p className="text-sm text-slate-600">
                {address.address}, {address.city}, {address.state} {address.zip}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setSelectedAddressId(address.id)}
                  className="text-xs font-semibold text-slate-700"
                >
                  Use for checkout
                </button>
                {address.id !== "addr-default" ? (
                  <button
                    onClick={() => removeAddress(address.id)}
                    className="text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
