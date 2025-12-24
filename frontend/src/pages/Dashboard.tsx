import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const ADMINS = [
    '0x242dfb7849544ee242b2265ca7e585bdec60456b',
    '0xdbca8ab9eb325a8f550ffc6e45277081a6c7d681'
];

export function Dashboard() {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const editorRef = useRef<EditorJS | null>(null);
    const ejInstance = useRef<EditorJS | null>(null);
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();

    // BYPASS FRONTEND CHECK
    // const isAdmin = isConnected && address && ADMINS.includes(address.toLowerCase());
    const isAdmin = true;

    useEffect(() => {
        // if (!isAdmin) return;
        if (ejInstance.current) return;

        const initEditor = () => {
            const editor = new EditorJS({
                holder: 'editorjs',
                onReady: () => {
                    ejInstance.current = editor;
                },
                autofocus: true,
                data: {
                    time: Date.now(),
                    blocks: [
                        { type: 'paragraph', data: { text: 'Start writing your story...' } }
                    ]
                },
                tools: {
                    header: Header,
                    list: List,
                    paragraph: {
                        class: Paragraph,
                        inlineToolbar: true,
                    },
                    image: {
                        class: ImageTool,
                        config: {
                            endpoints: {
                                byFile: 'http://localhost:3000/upload',
                            },
                            field: 'image'
                        }
                    }
                }
            });
        };

        initEditor();

        return () => {
            if (ejInstance.current) {
                ejInstance.current.destroy();
                ejInstance.current = null;
            }
        };
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !ejInstance.current) return;
        setIsSubmitting(true);

        try {
            const savedData = await ejInstance.current.save();
            // Store stringified JSON
            const content = JSON.stringify(savedData);

            const res = await fetch('http://localhost:3000/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
                credentials: 'include'
            });

            if (res.ok) {
                navigate('/');
            } else {
                alert('Failed to publish. Are you an admin?');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating article');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected) {
        // return <div className="p-8 text-center text-gray-500">Connect wallet to verify access.</div>;
    }

    if (!isAdmin) {
        // return <div className="p-8 text-center text-red-500">Access Denied: You are not an admin.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 font-sans">
            <h2 className="text-3xl font-bold font-serif mb-8 border-b pb-4">Create New Story</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Headline</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-lg font-serif"
                        placeholder="Article Headline"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                    <div className="min-h-[400px] border border-gray-300 rounded-lg p-4 bg-white" id="editorjs"></div>
                </div>
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800"
                    >
                        {isSubmitting ? 'Publishing...' : 'Publish Story'}
                    </button>
                </div>
            </form>
        </div>
    );
}
