import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';

const ADMINS = [
  '0x242dfb7849544ee242b2265ca7e585bdec60456b',
  '0xdbca8ab9eb325a8f550ffc6e45277081a6c7d681'
];

function App() {
  const { address, isConnected } = useAccount();
  const isAdmin = isConnected && address && ADMINS.includes(address.toLowerCase());

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold font-serif tracking-tighter">DecentraNews</Link>
              <nav className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wide text-gray-600">
                <Link to="/" className="hover:text-black transition-colors">News</Link>
                {isAdmin && (
                  <Link to="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
                )}
                <span className="hover:text-black transition-colors cursor-pointer">Markets</span>
                <span className="hover:text-black transition-colors cursor-pointer">Learn</span>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>
        </header>

        <main className="flex-grow bg-gray-50">
          <div className="py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-black text-white py-12">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-serif text-xl font-bold mb-4">DecentraNews</h3>
              <p className="text-gray-400 text-sm">The leader in news and information on cryptocurrency, digital assets and the future of money.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-gray-500">Company</h4>
              <div className="flex flex-col gap-2 text-sm text-gray-300">
                <span>About</span>
                <span>Careers</span>
                <span>Press Center</span>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-xs text-gray-500 text-center">
            © 2025 DecentraNews. All rights reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
