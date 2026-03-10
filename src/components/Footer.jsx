export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="flex w-full flex-col gap-2 px-3 py-8 text-sm text-slate-600 sm:px-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} NovaCart. All rights reserved.</p>
        <p>Built with React + Tailwind CSS.</p>
      </div>
    </footer>
  );
}
