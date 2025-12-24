import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import ImageTool from '@editorjs/image';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import InlineCode from '@editorjs/inline-code';
// @ts-ignore
import LinkTool from '@editorjs/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../api';

export function Dashboard() {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [category, setCategory] = useState('General');
    const [type, setType] = useState('POST');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [cmsMode, setCmsMode] = useState<'POST' | 'PAGE'>('POST');
    const [activeTab, setActiveTab] = useState<'settings' | 'seo'>('settings');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ejInstance = useRef<EditorJS | null>(null);
    const queryClient = useQueryClient();
    const { address } = useAccount();

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
            return res.json();
        }
    });

    const { data: articles, isLoading: articlesLoading } = useQuery({
        queryKey: ['articles-admin'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/articles`, { credentials: 'include' });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`${API_URL}/articles/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles-admin'] })
    });

    useEffect(() => {
        if (view === 'edit' && !ejInstance.current) {
            const initEditor = () => {
                const editor = new EditorJS({
                    holder: 'editorjs',
                    onReady: () => {
                        ejInstance.current = editor;
                        const article = articles?.find((a: any) => a.id === editingId);
                        if (editingId) {
                            if (article && article.content) {
                                try {
                                    let parsed = typeof article.content === 'object' ? article.content : JSON.parse(article.content);

                                    if (parsed && parsed.blocks) {
                                        // Clean blocks to prevent "Block skipped" errors
                                        parsed.blocks = parsed.blocks.map((block: any) => {
                                            if (block.type === 'paragraph' && !block.data?.text) {
                                                return { ...block, data: { text: typeof block.data === 'string' ? block.data : '' } };
                                            }
                                            // Ensure data exists
                                            if (!block.data) block.data = {};
                                            return block;
                                        });
                                        editor.render(parsed);
                                    } else {
                                        // Fallback for non-JSON or malformed content
                                        editor.render({
                                            blocks: [{ type: 'paragraph', data: { text: String(article.content) } }]
                                        });
                                    }
                                } catch (e) {
                                    console.error("Failed to render editor content", e);
                                    // Extreme fallback
                                    editor.render({
                                        blocks: [{ type: 'paragraph', data: { text: "Error loading content. Raw content: " + String(article.content) } }]
                                    });
                                }
                            }
                        }
                    },
                    autofocus: true,
                    tools: {
                        header: Header,
                        list: List,
                        paragraph: { class: Paragraph, inlineToolbar: true },
                        image: {
                            class: ImageTool,
                            config: {
                                endpoints: { byFile: `${API_URL}/upload` },
                                field: 'image'
                            }
                        },
                        quote: Quote,
                        table: Table,
                        inlineCode: InlineCode,
                        linkTool: LinkTool,
                    }
                });
            };
            initEditor();
        }
        return () => {
            if (ejInstance.current) {
                ejInstance.current.destroy();
                ejInstance.current = null;
            }
        };
    }, [view, editingId, articles]);

    const handleEdit = (article: any) => {
        setEditingId(article.id);
        setTitle(article.title);
        setStatus(article.status || 'DRAFT');
        setCategory(article.category || 'General');
        setType(article.type || 'POST');
        setSlug(article.slug || '');
        setExcerpt(article.excerpt || '');
        setFeaturedImage(article.featuredImage || '');
        setSeoTitle(article.seoTitle || '');
        setSeoDescription(article.seoDescription || '');
        setView('edit');
    };

    const handleNew = () => {
        setEditingId(null);
        setTitle('');
        setStatus('DRAFT');
        setCategory('General');
        setType(cmsMode);
        setSlug('');
        setExcerpt('');
        setFeaturedImage('');
        setSeoTitle('');
        setSeoDescription('');
        setView('edit');
    };

    const handleSubmit = async () => {
        if (!title || !ejInstance.current) return;
        setIsSubmitting(true);
        try {
            const savedData = await ejInstance.current.save();
            const content = JSON.stringify(savedData);
            const body = { title, content, status, category, type, slug, excerpt, featuredImage, seoTitle, seoDescription };

            const url = editingId ? `${API_URL}/articles/${editingId}` : `${API_URL}/articles`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include'
            });

            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: ['articles-admin'] });
                setView('list');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-gray-500">You do not have permission to access the CMS Dashboard.</p>
                <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Back to Newsroom</Link>
            </div>
        );
    }

    if (view === 'list') {
        if (articlesLoading) return <div className="max-w-6xl mx-auto p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Content...</div>;
        const filteredArticles = articles?.filter((a: any) => a.type === cmsMode) || [];

        return (
            <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{cmsMode === 'POST' ? 'Posts' : 'Pages'}</h1>
                    <button onClick={handleNew} className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 font-medium">Add New</button>
                </div>

                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setCmsMode('POST')}
                        className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all ${cmsMode === 'POST' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setCmsMode('PAGE')}
                        className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all ${cmsMode === 'PAGE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Pages
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4 w-1/2">Title</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredArticles.map((article: any) => (
                                <tr key={article.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer text-lg mb-1" onClick={() => handleEdit(article)}>{article.title}</div>
                                        <div className="flex gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-blue-600 cursor-pointer hover:font-bold" onClick={() => handleEdit(article)}>Edit</span>
                                            <Link to={article.type === 'PAGE' ? `/page/${article.id}` : `/post/${article.id}`} target="_blank" className="text-gray-600 cursor-pointer shadow-sm hover:font-bold border px-1 rounded">View</Link>
                                            <span className="text-red-600 cursor-pointer hover:font-bold" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(article.id) }}>Trash</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1 text-[10px]">
                                            <span className={`px-2 py-0.5 rounded shadow-sm w-fit font-bold ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{article.status}</span>
                                            <span className="text-gray-400 font-bold uppercase tracking-tighter">{article.category} | {article.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 text-sm">{article.author?.address.slice(0, 8)}...</td>
                                    <td className="px-6 py-5 text-right text-gray-400 text-xs">{new Date(article.publishedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 bg-gray-50 min-h-screen font-sans">
            {/* Main Content Area */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Content' : 'Add New Content'}</h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Update & Publish'}
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-6 text-4xl font-serif font-bold border-none bg-transparent focus:ring-0 outline-none placeholder-gray-300"
                    placeholder="Enter title here"
                />

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-[700px] p-10">
                    <div id="editorjs" className="prose prose-lg max-w-none"></div>
                </div>
            </div>

            {/* Sidebar Settings Area */}
            <div className="space-y-6">
                {/* Tabs Panel */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Document
                        </button>
                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'seo' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            SEO
                        </button>
                    </div>

                    <div className="p-5 space-y-6">
                        {activeTab === 'settings' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status & Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm border border-gray-200 p-2 rounded-lg bg-white font-bold text-gray-700 outline-none">
                                            <option value="DRAFT">Draft</option>
                                            <option value="PUBLISHED">Published</option>
                                        </select>
                                        <select value={type} onChange={e => setType(e.target.value)} className="text-sm border border-gray-200 p-2 rounded-lg bg-white font-bold text-gray-700 outline-none">
                                            <option value="POST">Post</option>
                                            <option value="PAGE">Page</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 p-2 rounded-lg bg-white font-bold text-gray-700 outline-none">
                                        <option value="General">General</option>
                                        <option value="Crypto">Crypto</option>
                                        <option value="Markets">Markets</option>
                                        <option value="Policy">Policy</option>
                                        <option value="Technology">Technology</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Featured Image</label>
                                    <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center group hover:border-blue-100 transition-colors bg-gray-50/30">
                                        {featuredImage ? (
                                            <div className="relative">
                                                <img src={featuredImage} alt="Featured" className="w-full h-40 object-cover rounded-lg" />
                                                <button onClick={() => setFeaturedImage('')} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block py-8">
                                                <div className="text-blue-600 font-bold text-sm mb-1">Set Featured Image</div>
                                                <div className="text-[10px] text-gray-400">Recommended: 1200x630px</div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            const res = await fetch(`${API_URL}/upload`, {
                                                                method: 'POST',
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) setFeaturedImage(data.file.url);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Excerpt</label>
                                    <textarea
                                        value={excerpt}
                                        onChange={e => setExcerpt(e.target.value)}
                                        className="w-full text-sm border border-gray-200 p-3 rounded-lg bg-white text-gray-700 outline-none h-24 resize-none leading-relaxed"
                                        placeholder="Brief summary of the article..."
                                    />
                                    <p className="text-[10px] text-gray-400 text-right">{excerpt.length} / 160</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 cursor-help" title="Custom URL for your article">URL Slug</label>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={e => setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))}
                                        className="w-full text-sm border border-gray-200 p-2 rounded-lg bg-white font-mono text-gray-500 outline-none"
                                        placeholder="article-url-slug"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEO Title</label>
                                    <input
                                        type="text"
                                        value={seoTitle}
                                        onChange={e => setSeoTitle(e.target.value)}
                                        className="w-full text-sm border border-gray-200 p-2 rounded-lg bg-white text-gray-700 outline-none"
                                        placeholder={title.substring(0, 60)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Description</label>
                                    <textarea
                                        value={seoDescription}
                                        onChange={e => setSeoDescription(e.target.value)}
                                        className="w-full text-sm border border-gray-200 p-2 rounded-lg bg-white text-gray-700 outline-none h-24 resize-none"
                                        placeholder={excerpt || "Search engine description..."}
                                    />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Google Preview</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-blue-800 hover:underline cursor-pointer truncate">{seoTitle || title || 'Post Title'}</p>
                                        <p className="text-[10px] text-green-700 truncate">decentranews.com/{slug || 'post-url'}</p>
                                        <p className="text-[11px] text-gray-500 line-clamp-2">{seoDescription || excerpt || 'Search results snippet...'}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Created: {editingId ? new Date().toLocaleDateString() : 'New'}</span>
                        <button
                            onClick={() => { if (confirm('Move to Trash?')) { deleteMutation.mutate(editingId!); setView('list'); } }}
                            className="text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[10px] disabled:opacity-30"
                            disabled={!editingId}
                        >
                            Move to Trash
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
