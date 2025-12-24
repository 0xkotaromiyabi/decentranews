"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const siwe_1 = require("siwe");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cookie_session_1.default)({
    name: 'session',
    keys: ['secret_key'], // In production use environment variable
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
// Define session interface augmentation if needed, but for now using any logic or extending Express definition
// In TS, we might need to declare module to extend Session.
// For simplicity in this file, we assume req.session exists (injected by cookie-session).
app.get('/nonce', function (req, res) {
    req.session.nonce = (0, siwe_1.generateNonce)();
    res.setHeader('Content-Type', 'text/plain');
    res.send(req.session.nonce);
});
app.post('/verify', async function (req, res) {
    try {
        if (!req.body.message) {
            res.status(422).json({ message: 'Expected prepareMessage object as body.' });
            return;
        }
        const message = new siwe_1.SiweMessage(req.body.message);
        const fields = await message.verify({ signature: req.body.signature, nonce: req.session.nonce });
        req.session.siwe = fields.data;
        req.session.nonce = null; // Consume nonce
        res.json({ ok: true, data: fields.data });
    }
    catch (e) {
        req.session.siwe = null;
        req.session.nonce = null;
        console.error(e);
        res.status(401).json({ message: e.message });
    }
});
app.get('/me', (req, res) => {
    if (!req.session?.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    res.json({ address: req.session.siwe.address });
});
app.get('/', (req, res) => {
    res.send('DecentraNews API is running');
});
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
