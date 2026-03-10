import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="w-full flex-1 px-3 py-6 sm:px-4 md:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  );
}
