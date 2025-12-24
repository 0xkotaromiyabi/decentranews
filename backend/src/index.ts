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

app.get('/me', (req: any, res) => {
    if (!req.session?.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    const address = req.session.siwe.address;
    const isAdmin = ADMINS.includes(address.toLowerCase());
    res.json({ address, isAdmin });
});

app.get('/articles', async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(articles);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch articles' });
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
    console.log('--- POST /articles Request Received ---');
    console.log('Session:', req.session);

    if (!req.session?.siwe) {
        console.log('Error: No SIWE session found.');
        res.status(401).json({ message: 'Unauthorized: No session' });
        return;
    }

    const address = req.session.siwe.address;
    console.log('Authenticated Address:', address);
    console.log('Is Admin?', ADMINS.includes(address.toLowerCase()));

    if (!ADMINS.includes(address.toLowerCase())) {
        console.log('Error: Address not in ADMINS list.');
        res.status(403).json({ message: 'Forbidden: Admins only' });
        return;
    }

    const { title, content } = req.body;
    console.log('Payload:', { title, contentLength: content?.length });

    try {
        let user = await prisma.user.findUnique({ where: { address } });
        if (!user) {
            console.log('User not found, creating new user for address:', address);
            user = await prisma.user.create({ data: { address } });
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                authorId: user.id
            }
        });

        console.log('Article created successfully:', article.id);
        res.json(article);
    } catch (e) {
        console.error('Database Error:', e);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

app.get('/', (req, res) => {
    res.send('DecentraNews API is running');
});

// Keep process alive hack
setInterval(() => { }, 1000);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
