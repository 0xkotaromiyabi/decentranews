import { useState, useEffect, useRef } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function Dashboard() {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ejInstance = useRef<EditorJS | null>(null);
    const queryClient = useQueryClient();

    const { data: articles, isLoading: articlesLoading } = useQuery({
        queryKey: ['articles-admin'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3000/articles', { credentials: 'include' });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`http://localhost:3000/articles/${id}`, {
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
                        if (editingId) {
                            const article = articles?.find((a: any) => a.id === editingId);
                            if (article && article.content) {
                                try {
                                    const parsed = JSON.parse(article.content);
                                    if (parsed && parsed.blocks) {
                                        editor.render(parsed);
                                    } else {
                                        // Fallback for string content
                                        editor.render({
                                            blocks: [{ type: 'paragraph', data: { text: article.content } }]
                                        });
                                    }
                                } catch (e) {
                                    console.error("Failed to render editor content", e);
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
                                endpoints: { byFile: 'http://localhost:3000/upload' },
                                field: 'image'
                            }
                        }
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
        setView('edit');
    };

    const handleNew = () => {
        setEditingId(null);
        setTitle('');
        setStatus('DRAFT');
        setView('edit');
    };

    const handleSubmit = async () => {
        if (!title || !ejInstance.current) return;
        setIsSubmitting(true);
        try {
            const savedData = await ejInstance.current.save();
            const content = JSON.stringify(savedData);
            const body = { title, content, status };

            const url = editingId ? `http://localhost:3000/articles/${editingId}` : 'http://localhost:3000/articles';
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

    if (view === 'list') {
        return (
            <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Posts</h1>
                    <button onClick={handleNew} className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 font-medium">Add New</button>
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
                            {articles?.map((article: any) => (
                                <tr key={article.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer text-lg mb-1" onClick={() => handleEdit(article)}>{article.title}</div>
                                        <div className="flex gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-blue-600 cursor-pointer hover:font-bold" onClick={() => handleEdit(article)}>Edit</span>
                                            <span className="text-red-600 cursor-pointer hover:font-bold" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(article.id) }}>Trash</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5"><span className={`px-2 py-1 rounded-md text-[10px] font-bold ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{article.status}</span></td>
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
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 bg-gray-50 min-h-screen">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Edit Post' : 'Add New Post'}</h2>
                </div>

                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-4 text-3xl font-serif border border-gray-300 rounded focus:border-blue-500 outline-none shadow-sm"
                    placeholder="Enter title here"
                />

                <div className="bg-white border border-gray-300 rounded shadow-sm min-h-[600px] p-8">
                    <div id="editorjs"></div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white border border-gray-300 rounded shadow-sm">
                    <div className="p-4 border-b border-gray-200 font-bold text-gray-700 bg-gray-50 rounded-t">Publish</div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Status:</span>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="border-none bg-transparent font-bold text-blue-600 cursor-pointer outline-none">
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b flex justify-between items-center">
                        <button onClick={() => { if (confirm('Delete?')) { deleteMutation.mutate(editingId!); setView('list'); } }} className="text-red-600 text-xs hover:underline disabled:opacity-0" disabled={!editingId}>Move to Trash</button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Publish')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
