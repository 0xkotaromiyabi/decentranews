import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { API_URL } from '../api';

const BlockRenderer = ({ blocks }: { blocks: any[] }) => {
    return (
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed space-y-6">
            {blocks.map((block, i) => {
                if (block.type === 'paragraph') {
                    return <p key={i} className="text-xl" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data?.text || "") }} />;
                }
                if (block.type === 'header') {
                    const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                    return <Tag key={i} className="font-bold font-serif text-3xl my-8">{block.data.text}</Tag>;
                }
                if (block.type === 'list') {
                    const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                    return (
                        <ListTag key={i} className="list-disc list-inside space-y-2 ml-4">
                            {block.data.items.map((item: string, j: number) => (
                                <li key={j} className="text-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}></li>
                            ))}
                        </ListTag>
                    );
                }
                if (block.type === 'image') {
                    return (
                        <figure key={i} className="my-10">
                            <img src={block.data.file.url} alt={block.data.caption} className="rounded-xl w-full shadow-lg" />
                            {block.data.caption && <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.data.caption}</figcaption>}
                        </figure>
                    );
                }
                return null;
            })}
        </div>
    );
};

export function PostDetail() {
    const { id } = useParams();

    const { data: article, isLoading, error } = useQuery({
        queryKey: ['article', id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/articles/${id}`);
            if (!res.ok) throw new Error('Not found');
            return res.json();
        }
    });

    if (isLoading) return <div className="max-w-4xl mx-auto p-12 text-center text-gray-400">Loading story...</div>;
    if (error || !article) return <div className="max-w-4xl mx-auto p-12 text-center text-red-500">Story not found.</div>;

    let contentBlocks = [];
    try {
        const parsed = JSON.parse(article.content);
        contentBlocks = (parsed.blocks || []).map((block: any) => {
            if (block.type === 'paragraph' && !block.data?.text) {
                return { ...block, data: { text: typeof block.data === 'string' ? block.data : '' } };
            }
            if (!block.data) block.data = {};
            return block;
        });
    } catch (e) {
        contentBlocks = [{ type: 'paragraph', data: { text: String(article.content) } }];
    }

    return (
        <article className="max-w-4xl mx-auto px-6 py-12 bg-white rounded-2xl shadow-sm border border-gray-100 my-10 font-sans">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-8 uppercase tracking-[0.2em] text-[10px] font-black text-blue-600">
                    <span>{article.category}</span>
                    <span className="text-gray-200">•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-black font-serif tracking-tight leading-[1.1] mb-10 text-gray-900 border-l-8 border-black pl-8">
                    {article.title}
                </h1>

                {article.featuredImage && (
                    <div className="mb-12 -mx-6 md:-mx-12">
                        <img src={article.featuredImage} alt={article.title} className="w-full h-[500px] object-cover md:rounded-xl shadow-xl" />
                    </div>
                )}

                <div className="flex items-center gap-4 py-8 border-y border-gray-50 bg-gray-50/50 px-6 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {article.author?.address.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-black text-gray-900 text-lg leading-none mb-1">By {article.author?.address.slice(0, 6)}...{article.author?.address.slice(-4)}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Verified Contributor
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto">
                <BlockRenderer blocks={contentBlocks} />
            </div>

            <footer className="max-w-3xl mx-auto mt-20 pt-10 border-t border-gray-100 flex flex-col gap-6 items-center">
                <Link to="/" className="text-black font-black uppercase text-sm border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all">
                    ← Back to Newsroom
                </Link>
                <div className="flex gap-4">
                    <span className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">𝕏</span>
                    <span className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">f</span>
                    <span className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer">in</span>
                </div>
            </footer>
        </article>
    );
}
