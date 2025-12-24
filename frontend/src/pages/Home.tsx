import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { API_URL } from '../api';

const BlockRenderer = ({ blocks }: { blocks: any[] }) => {
    return (
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-3">
            {blocks.map((block, i) => {
                if (block.type === 'paragraph') {
                    return <p key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data?.text || "") }} />;
                }
                if (block.type === 'header') {
                    const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                    return <Tag key={i} className="font-bold my-4">{block.data.text}</Tag>;
                }
                if (block.type === 'list') {
                    const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                    return (
                        <ListTag key={i} className="list-inside my-4">
                            {block.data.items.map((item: string, j: number) => (
                                <li key={j} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}></li>
                            ))}
                        </ListTag>
                    );
                }
                if (block.type === 'image') {
                    return (
                        <figure key={i} className="my-6">
                            <img src={block.data.file.url} alt={block.data.caption} className="rounded-lg w-full object-cover max-h-96" />
                            {block.data.caption && <figcaption className="text-center text-xs text-gray-500 mt-2">{block.data.caption}</figcaption>}
                        </figure>
                    );
                }
                return null;
            })}
        </div>
    );
};

export function Home() {
    const { data: articles, isLoading } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/articles`);
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        }
    });

    if (isLoading) return <div className="p-8 text-center font-sans text-gray-500">Loading stories...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 font-sans">
            <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                <h2 className="text-4xl font-bold font-serif">Latest News</h2>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
            </div>

            <div className="grid gap-10">
                {articles?.length === 0 && (
                    <p className="text-gray-500">No articles yet. Be the first to write one!</p>
                )}
                {articles?.map((article: any) => {
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
                        <article key={article.id} className="group grid md:grid-cols-[1fr_300px] gap-8 items-start border-b border-gray-100 pb-10 last:border-0">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                                    <span>{article.category || 'General'}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <Link to={`/post/${article.id}`} className="block group-hover:text-blue-700 transition-colors">
                                    <h3 className="text-3xl font-bold font-serif leading-tight mb-4 group-hover:underline decoration-blue-600/30 underline-offset-4">{article.title}</h3>
                                </Link>

                                <div className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {article.excerpt || (contentBlocks.find(b => b.type === 'paragraph')?.data?.text?.replace(/<[^>]*>/g, '').substring(0, 200) + '...')}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px]">
                                        {article.author?.address?.slice(2, 4).toUpperCase()}
                                    </div>
                                    <span>By {article.author?.address?.slice(0, 6)}...{article.author?.address?.slice(-4)}</span>
                                </div>
                            </div>

                            {article.featuredImage && (
                                <Link to={`/post/${article.id}`} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <img
                                        src={article.featuredImage}
                                        alt={article.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </Link>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
