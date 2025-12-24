import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import { generateNonce, SiweMessage } from 'siwe';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
};

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const ADMINS = [
    '0x242dfb7849544ee242b2265ca7e585bdec60456b',
    '0xdbca8ab9eb325a8f550ffc6e45277081a6c7d681'
];

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180'
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['secret_key'],
    maxAge: 24 * 60 * 60 * 1000
}));

app.use('/uploads', express.static('uploads'));

app.get('/nonce', function (req: any, res) {
    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.send(req.session.nonce);
});

app.post('/verify', async function (req: any, res) {
    try {
        if (!req.body.message) {
            res.status(422).json({ message: 'Expected prepareMessage object as body.' });
            return;
        }
        const message = new SiweMessage(req.body.message);
        const fields = await message.verify({ signature: req.body.signature, nonce: req.session.nonce });

        req.session.siwe = fields.data;
        req.session.nonce = null;

        res.json({ ok: true, data: fields.data });
    } catch (e: any) {
        req.session.siwe = null;
        req.session.nonce = null;
        console.error(e);
        res.status(401).json({ message: e.message });
    }
});

app.get('/me', async (req: any, res) => {
    if (!req.session?.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    const address = req.session.siwe.address;

    // Get or Create user to ensure roles are synced
    let dbUser = await prisma.user.findUnique({ where: { address } });
    if (!dbUser) {
        const role = ADMINS.includes(address.toLowerCase()) ? 'ADMIN' : 'USER';
        dbUser = await prisma.user.create({ data: { address, role } });
    } else {
        // Force sync status for hardcoded admins if they exist but have wrong role
        const expectedRole = ADMINS.includes(address.toLowerCase()) ? 'ADMIN' : dbUser.role;
        if (dbUser.role !== expectedRole) {
            dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { role: expectedRole } });
        }
    }

    if (!dbUser) return res.status(500).json({ error: 'User sync failed' });

    res.json({ address, isAdmin: dbUser.role === 'ADMIN' || dbUser.role === 'EDITOR', role: dbUser.role });
});

app.get('/articles', async (req: any, res) => {
    try {
        const isAdmin = req.session?.siwe?.address && ADMINS.includes(req.session.siwe.address.toLowerCase());

        let whereClause = {};
        if (!isAdmin) {
            whereClause = {
                status: 'PUBLISHED'
            };
        }

        const articles = await prisma.article.findMany({
            where: {
                ...whereClause,
                ...(isAdmin ? {} : { type: 'POST' })
            },
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(articles);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

app.get('/nav-pages', async (req, res) => {
    try {
        const pages = await prisma.article.findMany({
            where: {
                type: 'PAGE',
                status: 'PUBLISHED'
            },
            select: {
                id: true,
                title: true
            }
        });
        res.json(pages);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch nav pages' });
    }
});

app.get('/articles/:id', async (req: any, res) => {
    const { id } = req.params;
    console.log(`--- GET /articles/${id} Request Received ---`);
    try {
        const article = await prisma.article.findUnique({
            where: { id },
            include: { author: true }
        });
        if (!article) {
            console.log(`Article with ID ${id} not found.`);
            return res.status(404).json({ error: 'Not found' });
        }
        console.log(`Article with ID ${id} found:`, article.title);
        res.json(article);
    } catch (e) {
        console.error('Error fetching article:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.post('/upload', upload.single('image'), (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, file: null });
    }
    res.json({
        success: 1,
        file: {
            url: `http://localhost:3000/uploads/${req.file.filename}`
        }
    });
});

app.post('/articles', async (req: any, res) => {
    const { title, content, status, category, type, slug, excerpt, featuredImage, seoTitle, seoDescription } = req.body;
    let address = req.session?.siwe?.address || ADMINS[0];

    try {
        let user = await prisma.user.findUnique({ where: { address } });
        if (!user) {
            user = await prisma.user.create({ data: { address } });
        }

        const baseSlug = slug || generateSlug(title);
        // Ensure slug uniqueness
        let finalSlug = baseSlug;
        let count = 0;
        while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
            count++;
            finalSlug = `${baseSlug}-${count}`;
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                status: status || 'DRAFT',
                category: category || 'General',
                type: type || 'POST',
                slug: finalSlug,
                excerpt,
                featuredImage,
                seoTitle,
                seoDescription,
                publishedAt: new Date(),
                authorId: user.id
            }
        });
        res.json(article);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

app.put('/articles/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const { title, content, status, category, type, slug, excerpt, featuredImage, seoTitle, seoDescription } = req.body;

        const data: any = {
            title,
            content,
            status,
            category,
            type,
            excerpt,
            featuredImage,
            seoTitle,
            seoDescription
        };

        if (slug) {
            data.slug = slug;
        }

        const article = await prisma.article.update({
            where: { id },
            data
        });
        res.json(article);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

app.delete('/articles/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        await prisma.article.delete({ where: { id } });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});


app.get('/', (req, res) => {
    res.send('DecentraNews API is running');
});

// Keep process alive hack (only if not in Vercel)
if (!process.env.VERCEL) {
    setInterval(() => { }, 1000);
}

const startServer = () => {
    if (process.env.VERCEL) return null;
    return app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
};

const server = startServer();

if (server) {
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
        });
    });
}

export default app;

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
