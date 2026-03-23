import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-kite-bg">
      <Navbar />
      <main className="pt-14 min-h-[calc(100vh-56px)]">
        {children}
      </main>
    </div>
  );
}
