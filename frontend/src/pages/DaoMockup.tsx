import { useState } from 'react';
import { useAccount } from 'wagmi';

export function DaoMockup() {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'proposals' | 'manifesto' | 'funding'>('proposals');

    const mockProposals = [
        {
            id: 1,
            title: "Pengembangan Narasi Kedaulatan Digital di Asia Tenggara",
            type: "Theme Proposal",
            proposer: "0x71C...4E2",
            status: "Voting",
            votes: { for: 45, against: 12 },
            prize: "500 USDC"
        },
        {
            id: 2,
            title: "Investigasi: Dampak AI Terhadap Independensi Jurnalisme",
            type: "Article Grant",
            proposer: "0x3A1...9B0",
            status: "Proposed",
            votes: { for: 8, against: 2 },
            prize: "1200 USDC"
        }
    ];

    const stats = [
        { label: "Treasury Balance", value: "25,400 USDC" },
        { label: "Active Members", value: "142 Reporters" },
        { label: "Total Distributed", value: "12,800 USDC" },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
            {/* Header / Hero Section */}
            <div className="bg-black text-white py-16 px-6 mb-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <span className="inline-block px-3 py-1 bg-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Editorial DAO Alpha</span>
                            <h1 className="text-5xl md:text-6xl font-black font-serif tracking-tighter mb-4">Editorial DAO Alpha</h1>
                            <p className="max-w-2xl text-gray-400 text-lg leading-relaxed">
                                Sistem editorial terdistribusi yang dikelola oleh komunitas jurnalis dan pembaca.
                                Kualitas diputuskan oleh kolektif, bukan otoritas tunggal.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {stats.map((s, i) => (
                                <div key={i} className="border-l border-gray-800 pl-6 pr-4">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{s.label}</p>
                                    <p className="text-2xl font-black font-serif">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6">
                {/* Navigation Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-10 overflow-x-auto">
                    {['proposals', 'manifesto', 'funding'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-black border-b-4 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'proposals' && (
                    <div className="grid gap-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black font-serif">Active Deliberations</h2>
                            <button className="bg-black text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all">Submit Proposal</button>
                        </div>
                        {mockProposals.map((p) => (
                            <div key={p.id} className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 font-black uppercase tracking-widest">{p.type}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Proposed by {p.proposer}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold font-serif mb-4 group-hover:text-blue-600 transition-colors leading-tight">{p.title}</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="flex-1 max-w-[200px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${(p.votes.for / (p.votes.for + p.votes.against)) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {p.votes.for} YES / {p.votes.against} NO
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-4 min-w-[150px]">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Potential Prize</p>
                                            <p className="text-xl font-black text-blue-600">{p.prize}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 border-2 border-green-500 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-all">Vote For</button>
                                            <button className="px-4 py-2 border-2 border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Against</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'manifesto' && (
                    <div className="max-w-3xl bg-white border border-gray-100 p-12 rounded-2xl shadow-sm">
                        <h2 className="text-4xl font-black font-serif mb-8 border-l-8 border-black pl-8">Konstitusi Editorial</h2>
                        <div className="space-y-10">
                            <section>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-4">I. Kualitas Dunia Nyata</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    Setiap tulisan harus berbasis pada fakta keras, riset mendalam, dan verifikasi multidimensi.
                                    Narasi dilarang mengandung fabrikasi atau agitasi tanpa basis data.
                                </p>
                            </section>
                            <section>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-4">II. Kolektifitas Editor</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    Peran "Editor In Chief" ditiadakan. Keputusan publikasi diambil melalui mekanisme
                                    deliberasi terbuka oleh pemegang hak suara (Editor DAO) yang kompeten di bidangnya.
                                </p>
                            </section>
                            <section>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-4">III. Transparansi Pendanaan</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    Setiap "Prize" atau "Grant" untuk tulisan dikelola secara on-chain. Pencairan dana
                                    hanya terjadi jika tulisan memenuhi standar kualitas yang disepakati kolektif.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'funding' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-12 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black font-serif mb-4">Writers Prize Pool</h2>
                                <p className="text-blue-100 mb-8 leading-relaxed italic opacity-80">
                                    Dana kolektif untuk memotivasi jurnalisme berkualitas tinggi dan investigasi yang berani.
                                </p>
                                <div className="text-5xl font-black mb-10">15,000 USDC</div>
                                <button className="w-full bg-white text-blue-800 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Donate to Pool</button>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full"></div>
                        </div>

                        <div className="bg-white border border-gray-100 p-10 rounded-3xl shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Active Bounties</h3>
                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:border-blue-200 transition-all cursor-pointer">
                                    <div>
                                        <p className="font-bold font-serif text-lg">Analisis On-Chain Penipuan Web3</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">Status: Open for applications</p>
                                    </div>
                                    <span className="text-blue-600 font-black">2.5 ETH</span>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:border-blue-200 transition-all cursor-pointer">
                                    <div>
                                        <p className="font-bold font-serif text-lg">Dokumenter: Sejarah Cypherpunk</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">Status: Reviewing (3)</p>
                                    </div>
                                    <span className="text-blue-600 font-black">1.8 ETH</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DaoMockup;
