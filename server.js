const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const fs = require('fs-extra');
const WebSocket = require('ws');
require('dotenv').config();

// Константы и конфигурация
const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/osurise';
const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? false : 'dev-secret-key');

if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.error('SESSION_SECRET не установлен в production окружении! Завершение работы.');
    process.exit(1);
}

// Подключение к MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('Успешно подключено к MongoDB!'))
    .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongoURI }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 дней
    }
}));

// Модели
const User = require('./models/user');
const FriendRequest = require('./models/friendRequest');

// Настройка шаблонизатора
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/uploads/avatars');
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        if (!req.session.user) {
            return cb(new Error('Требуется авторизация'), null);
        }
        cb(null, `${req.session.user.osuId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Разрешаем только изображения
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Разрешены только изображения'), false);
        }
        cb(null, true);
    }
});

// Создание HTTP сервера
const server = require('http').createServer(app);

// WebSocket сервер
const wss = new WebSocket.Server({ server });
const clients = new Map();
const matchmakingQueue = new Map();
let activeMatches = []; // Хранилище для активных матчей

// Вспомогательные функции WebSocket
const wsUtils = {
    // Отправляет сообщение конкретному пользователю по osuId
    sendToUser: (osuId, message) => {
        const ws = clients.get(osuId.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    },
    
    // Отправляет уведомление о количестве непрочитанных уведомлений
    updateNotificationCount: async (userId) => {
        try {
            const user = await User.findOne({ osuId: userId });
            if (user) {
                const count = await FriendRequest.countDocuments({ to: user._id, status: 'pending' });
                wsUtils.sendToUser(userId, { type: 'notificationCount', count });
            }
        } catch (error) {
            console.error('Ошибка при обновлении счетчика уведомлений:', error);
        }
    }
};

// WebSocket обработчики
wss.on('connection', (ws) => {
    console.log('Клиент подключился');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Аутентификация пользователя
            if (data.type === 'auth' && data.userId) {
                clients.set(data.userId.toString(), ws);
                ws.userId = data.userId;
                console.log(`Клиент авторизован с osuId: ${data.userId}`);
                
                // Проверка активных поисков игры
                if (matchmakingQueue.has(data.userId.toString())) {
                    const queueData = matchmakingQueue.get(data.userId.toString());
                    if (Date.now() - queueData.startTime > 120000) {
                        matchmakingQueue.delete(data.userId.toString());
                    }
                }
                
                // Обновляем счетчик уведомлений
                await wsUtils.updateNotificationCount(data.userId);
            } 
            // Поиск быстрой игры
            else if (data.type === 'fastGameSearch' && ws.userId) {
                handleMatchmaking(ws.userId, data.playerRank, data.range);
            }
            // Отмена поиска игры
            else if (data.type === 'cancelFastGameSearch' && ws.userId) {
                const userId = ws.userId.toString();
                if (matchmakingQueue.has(userId)) {
                    matchmakingQueue.delete(userId);
                    console.log(`Игрок ${userId} отменил поиск`);
                }
            }
            // Отклонение найденной игры
            else if (data.type === 'declineFastGame' && ws.userId) {
                const userId = ws.userId.toString();
                
                // Находим активный матч с этим игроком
                const match = activeMatches.find(m => 
                    m.player1Id === userId || m.player2Id === userId
                );
                
                if (match) {
                    // Определяем ID соперника
                    const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
                    
                    // Отправляем уведомление сопернику с типом 'matchCancelled' вместо 'matchDeclined'
                    wsUtils.sendToUser(opponentId, {
                        type: 'matchCancelled',
                        reason: 'declined'  // Добавляем причину отмены
                    });
                    
                    // Удаляем матч из активных
                    activeMatches = activeMatches.filter(m => 
                        !(m.player1Id === match.player1Id && m.player2Id === match.player2Id)
                    );
                    
                    console.log(`Игрок ${userId} отклонил матч с игроком ${opponentId}`);
                }
            }
            // Принятие найденной игры
            else if (data.type === 'acceptFastGame' && ws.userId) {
                const userId = ws.userId.toString();
                
                // Находим активный матч с этим игроком
                const match = activeMatches.find(m => 
                    m.player1Id === userId || m.player2Id === userId
                );
                
                if (match) {
                    // Отмечаем, что игрок принял игру
                    if (match.player1Id === userId) {
                        match.player1Accepted = true;
                    } else {
                        match.player2Accepted = true;
                    }
                    
                    // Определяем ID соперника
                    const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
                    
                    // Проверяем, приняли ли оба игрока игру
                    if (match.player1Accepted && match.player2Accepted) {
                        // Отправляем подтверждение обоим игрокам
                        wsUtils.sendToUser(match.player1Id, { type: 'matchAccepted' });
                        wsUtils.sendToUser(match.player2Id, { type: 'matchAccepted' });
                        
                        // Удаляем матч из активных после принятия
                        activeMatches = activeMatches.filter(m => 
                            !(m.player1Id === match.player1Id && m.player2Id === match.player2Id)
                        );
                        
                        console.log(`Оба игрока приняли матч: ${match.player1Id} и ${match.player2Id}`);
                    } else {
                        // Отправляем уведомление о принятии другой стороне
                        wsUtils.sendToUser(opponentId, {
                            type: 'opponentAccepted'  // Можно добавить обработку этого типа на клиенте
                        });
                        
                        console.log(`Игрок ${userId} принял матч, ожидание игрока ${opponentId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при обработке WebSocket сообщения:', error);
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            clients.delete(ws.userId.toString());
            console.log(`Клиент с osuId ${ws.userId} отключился`);
            
            // Удаляем из очереди поиска при отключении
            matchmakingQueue.delete(ws.userId.toString());
            
            // Отменяем все матчи с этим игроком
            const matchesWithPlayer = activeMatches.filter(match => 
                match.player1Id === ws.userId.toString() || match.player2Id === ws.userId.toString()
            );
            
            matchesWithPlayer.forEach(match => {
                const opponentId = match.player1Id === ws.userId.toString() ? match.player2Id : match.player1Id;
                wsUtils.sendToUser(opponentId, { type: 'matchCancelled', reason: 'disconnect' });
            });
            
            // Удаляем из активных матчей
            activeMatches = activeMatches.filter(match => 
                match.player1Id !== ws.userId.toString() && match.player2Id !== ws.userId.toString()
            );
        }
    });

    ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
    };
});

// Функции для matchmaking
async function handleMatchmaking(userId, playerRank, range) {
    userId = userId.toString();
    
    // Добавляем игрока в очередь поиска
    matchmakingQueue.set(userId, {
        playerRank: playerRank || 0,
        range: range || Infinity,
        startTime: Date.now()
    });
    
    console.log(`Игрок ${userId} добавлен в очередь поиска. Ранг: ${playerRank}, Диапазон: ${range}`);
    
    // Ищем подходящего соперника
    await findOpponent(userId);
}

async function getUserRank(osuId) {
    try {
        const user = await User.findOne({ osuId });
        if (!user) return null;
        
        // Используем user.elo вместо user.stats.elo
        const higherEloCount = await User.countDocuments({ elo: { $gt: user.elo } });
        const sameEloHigherIdCount = await User.countDocuments({ 
            elo: user.elo, 
            _id: { $lt: user._id } 
        });
        
        return higherEloCount + sameEloHigherIdCount + 1;
    } catch (error) {
        console.error('Ошибка при получении ранга пользователя:', error);
        return null;
    }
}

async function findOpponent(userId) {
    if (!matchmakingQueue.has(userId)) return;
    
    const player = matchmakingQueue.get(userId);
    const playerRank = player.playerRank;
    const range = player.range;
    
    // Ищем всех игроков в очереди, кроме текущего
    for (const [opponentId, opponent] of matchmakingQueue.entries()) {
        if (opponentId === userId) continue;
        
        const opponentRank = opponent.playerRank;
        const opponentRange = opponent.range;
        const rankDifference = Math.abs(playerRank - opponentRank);
        
        // Проверяем, подходят ли игроки друг другу по рангу
        if (rankDifference <= range && rankDifference <= opponentRange) {
            console.log(`Найдена пара: ${userId} и ${opponentId}. Разница рангов: ${rankDifference}`);
            
            // Удаляем обоих игроков из очереди
            matchmakingQueue.delete(userId);
            matchmakingQueue.delete(opponentId);
            
            // Получаем данные обоих игроков
            const playerUser = await User.findOne({ osuId: parseInt(userId) });
            const opponentUser = await User.findOne({ osuId: parseInt(opponentId) });
            
            if (!playerUser || !opponentUser) {
                console.error('Не удалось найти данные игроков');
                return;
            }
            
            // Добавляем активный матч в хранилище
            activeMatches.push({
                player1Id: userId,
                player2Id: opponentId,
                startTime: Date.now(),
                player1Accepted: false,
                player2Accepted: false
            });
            
            // Отправляем уведомления игрокам
            wsUtils.sendToUser(userId, {
                type: 'matchFound',
                opponent: {
                    username: opponentUser.username,
                    rank: opponentRank,
                    avatarUrl: opponentUser.customAvatarUrl || opponentUser.avatarUrl
                }
            });
            
            wsUtils.sendToUser(opponentId, {
                type: 'matchFound',
                opponent: {
                    username: playerUser.username,
                    rank: playerRank,
                    avatarUrl: playerUser.customAvatarUrl || playerUser.avatarUrl
                }
            });
            
            return;
        }
    }
    
    // Если соперник не найден, продолжаем ждать
    console.log(`Соперник для ${userId} не найден в диапазоне ${range}`);
}

// Функция очистки "зависших" поисков
function cleanupMatchmakingQueue() {
    const currentTime = Date.now();
    for (const [userId, player] of matchmakingQueue.entries()) {
        // Если игрок в очереди более 5 минут, удаляем его
        if (currentTime - player.startTime > 300000) {
            console.log(`Удаление игрока ${userId} из очереди из-за истечения времени ожидания`);
            matchmakingQueue.delete(userId);
            
            // Уведомляем игрока, если он все еще подключен
            wsUtils.sendToUser(userId, {
                type: 'matchmakingTimeout',
                message: 'Поиск игры отменен из-за длительного ожидания'
            });
        }
    }
}

// Функция очистки устаревших матчей
function cleanupActiveMatches() {
    const currentTime = Date.now();
    // Найти матчи, которые ожидают принятия дольше 25 секунд
    const oldMatches = activeMatches.filter(match => 
        currentTime - match.startTime > 25000 && // 25 секунд (время чуть больше, чем таймер принятия)
        (!match.player1Accepted || !match.player2Accepted) // И не все игроки приняли игру
    );
    
    if (oldMatches.length > 0) {
        // Отправляем уведомления о таймауте игрокам
        oldMatches.forEach(match => {
            wsUtils.sendToUser(match.player1Id, {
                type: 'matchCancelled', 
                reason: 'timeout'
            });
            wsUtils.sendToUser(match.player2Id, {
                type: 'matchCancelled',
                reason: 'timeout'
            });
            
            console.log(`Матч между ${match.player1Id} и ${match.player2Id} отменен из-за таймаута`);
        });
        
        // Удаляем эти матчи из активных
        activeMatches = activeMatches.filter(match => 
            currentTime - match.startTime <= 25000 || // Либо матч новый
            (match.player1Accepted && match.player2Accepted) // Либо оба игрока приняли его
        );
    }
}

// Роуты авторизации
app.get('/auth/osu', (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/osu/callback`;
    const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${process.env.OSU_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20public`;
    res.redirect(authUrl);
});

app.get('/auth/osu/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Код авторизации не предоставлен');
    
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/osu/callback`;
    
    try {
        // Получаем токен доступа
        const tokenResponse = await axios.post('https://osu.ppy.sh/oauth/token', {
            client_id: process.env.OSU_CLIENT_ID,
            client_secret: process.env.OSU_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        });
        
        const accessToken = tokenResponse.data.access_token;
        
        // Получаем данные пользователя
        const userResponse = await axios.get('https://osu.ppy.sh/api/v2/me', { 
            headers: { Authorization: `Bearer ${accessToken}` } 
        });
        
        const userData = userResponse.data;
        
        // Сохраняем аватар
        const avatarFileName = await saveUserAvatar(userData.id, userData.avatar_url);
        
        // Сохраняем баннер, если он есть
        let bannerFileName = '';
        if (userData.cover_url) {
            bannerFileName = await saveUserBanner(userData.id, userData.cover_url);
        }
        
        // Получаем статистику пользователя
        const userStats = await getUserStats(userData.id, accessToken);
        
        // Обновляем или создаем пользователя в БД
        const user = await updateOrCreateUser(userData, avatarFileName, bannerFileName, userStats);
        
        // Сохраняем данные пользователя в сессии
            req.session.user = {
            osuId: user.osuId,
            username: user.username,
            avatarUrl: user.avatarUrl,
            customAvatarUrl: user.customAvatarUrl,
            bannerUrl: user.bannerUrl,
            elo: user.elo,
            avgDifficulty: user.avgDifficulty,
            winrate: user.winrate,
            ratingWins: user.ratingWins,
            fastWins: user.fastWins,
            favMod: user.favMod,
            playcount: user.playcount,
            bio: user.bio,
            friends: user.friends
        };
        
        res.send(`<script>window.opener.postMessage('auth_success', '*'); window.close();</script>`);
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).send('Ошибка авторизации');
    }
});

// Вспомогательные функции для авторизации
async function saveUserAvatar(userId, avatarUrl) {
    try {
        const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');
        const avatarFileName = `${userId}-${Date.now()}.png`;
        const avatarPath = path.join(__dirname, 'public', 'uploads', 'osuAvatars', avatarFileName);
        
        await fs.ensureDir(path.dirname(avatarPath));
        await fs.outputFile(avatarPath, avatarBuffer);
        
        return avatarFileName;
    } catch (error) {
        console.error('Ошибка при сохранении аватара:', error);
        return '';
    }
}

async function saveUserBanner(userId, bannerUrl) {
    try {
        const bannerResponse = await axios.get(bannerUrl, { responseType: 'arraybuffer' });
        const bannerBuffer = Buffer.from(bannerResponse.data, 'binary');
        const bannerFileName = `${userId}-banner-${Date.now()}.png`;
        const bannerPath = path.join(__dirname, 'public', 'uploads', 'osuBanners', bannerFileName);
        
        await fs.ensureDir(path.dirname(bannerPath));
        await fs.outputFile(bannerPath, bannerBuffer);
        
        return bannerFileName;
    } catch (error) {
        console.error('Ошибка при сохранении баннера:', error);
        return '';
    }
}

async function getUserStats(userId, accessToken) {
    try {
        // Получаем топовые скоры для вычисления средней сложности и любимого мода
        const topScoresResponse = await axios.get(`https://osu.ppy.sh/api/v2/users/${userId}/scores/best`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: 100 }
        });
        
        const topScores = topScoresResponse.data;
        let totalDifficulty = 0;
        const modCounts = { DT: 0, NM: 0, HD: 0, HR: 0 };
        
        topScores.forEach(score => {
            const mods = score.mods;
            const modsString = mods.length > 0 ? mods.join('') : 'NM';
            
            if (modsString.includes('DT')) modCounts['DT']++;
            else if (modsString.includes('HD')) modCounts['HD']++;
            else if (modsString.includes('HR')) modCounts['HR']++;
            else modCounts['NM']++;
            
            totalDifficulty += score.beatmap.difficulty_rating;
        });
        
        const avgDifficulty = topScores.length > 0 ? parseFloat((totalDifficulty / topScores.length).toFixed(2)) : 0;
        
        let favMod = 'NM';
        let maxCount = 0;
        for (const [mod, count] of Object.entries(modCounts)) {
            if (count > maxCount) {
                maxCount = count;
                favMod = mod;
            }
        }
        
        return { avgDifficulty, favMod };
    } catch (error) {
        console.error('Ошибка при получении статистики пользователя:', error);
        return { avgDifficulty: 0, favMod: 'NM' };
    }
}

async function updateOrCreateUser(userData, avatarFileName, bannerFileName, userStats) {
    // Проверяем, существует ли пользователь в базе данных
    let user = await User.findOne({ osuId: userData.id });
    
    if (!user) {
        // Создаем нового пользователя
        user = new User({
            osuId: userData.id,
            username: userData.username,
            avatarUrl: `/uploads/osuAvatars/${avatarFileName}`,
            customAvatarUrl: '',
            bannerUrl: bannerFileName ? `/uploads/osuBanners/${bannerFileName}` : '',
            elo: 0,
            avgDifficulty: userStats.avgDifficulty,
            winrate: 0,
            ratingWins: 0,
            fastWins: 0,
            favMod: userStats.favMod,
            playcount: 0,
            bio: '',
            friends: []
        });
        
        await user.save();
    } else {
        // Обновляем существующего пользователя
        
        // Удаляем старый аватар, если он есть и не кастомный
        if (user.avatarUrl && !user.customAvatarUrl) {
            const oldAvatarPath = path.join(__dirname, 'public', user.avatarUrl);
            if (await fs.pathExists(oldAvatarPath)) await fs.remove(oldAvatarPath);
        }
        
        // Удаляем старый баннер, если он есть
        if (user.bannerUrl) {
            const oldBannerPath = path.join(__dirname, 'public', user.bannerUrl);
            if (await fs.pathExists(oldBannerPath)) await fs.remove(oldBannerPath);
        }
        
        user.username = userData.username;
        user.avatarUrl = `/uploads/osuAvatars/${avatarFileName}`;
        user.bannerUrl = bannerFileName ? `/uploads/osuBanners/${bannerFileName}` : '';
        user.avgDifficulty = userStats.avgDifficulty;
        user.favMod = userStats.favMod;
        user.lastOnline = Date.now();
        
        await user.save();
    }
    
    return user;
}

// API роуты для игроков
app.get('/api/osu/player-rank', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        // Получаем access token для osu! API
        const tokenResponse = await axios.post('https://osu.ppy.sh/oauth/token', {
            client_id: process.env.OSU_CLIENT_ID,
            client_secret: process.env.OSU_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'public'
        });
        
        const accessToken = tokenResponse.data.access_token;
        
        // Запрашиваем данные пользователя
        const userResponse = await axios.get(`https://osu.ppy.sh/api/v2/users/${req.session.user.osuId}/osu`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const userData = userResponse.data;
        const rank = userData.statistics.global_rank || 0;
        
        res.json({ rank });
    } catch (error) {
        console.error('Ошибка при получении ранга игрока из osu! API:', error);
        
        // Возвращаем ранк из нашей базы данных, если не удалось получить из osu! API
        try {
            const rank = await getUserRank(req.session.user.osuId);
            res.json({ rank: rank || 0 });
        } catch (dbError) {
            console.error('Ошибка при получении ранга из БД:', dbError);
            res.status(500).json({ error: 'Не удалось получить ранг игрока' });
        }
    }
});

// API роут для загрузки аватара
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const user = await User.findOne({ osuId: req.session.user.osuId });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        
        // Удаляем старый кастомный аватар, если он есть
        if (user.customAvatarUrl) {
            const oldCustomAvatarPath = path.join(__dirname, 'public', user.customAvatarUrl);
            if (await fs.pathExists(oldCustomAvatarPath)) await fs.remove(oldCustomAvatarPath);
        }
        
        user.customAvatarUrl = `/uploads/avatars/${req.file.filename}`;
        await user.save();
        
        // Обновляем данные в сессии
        req.session.user.customAvatarUrl = user.customAvatarUrl;
        
        res.json(user);
    } catch (error) {
        console.error('Ошибка при загрузке аватарки:', error);
        res.status(500).json({ error: 'Ошибка сервера при загрузке аватарки' });
    }
});

// API роут для получения лидерборда
app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .select('osuId username avatarUrl customAvatarUrl elo ratingWins fastWins playcount')
            .sort({ elo: -1, _id: 1 })
            .exec();
        
        res.json(users);
    } catch (error) {
        console.error('Ошибка при получении лидерборда:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении лидерборда' });
    }
});

// API роут для получения данных пользователя
app.get('/api/user/:osuId', async (req, res) => {
    try {
        const user = await User.findOne({ osuId: req.params.osuId })
            .populate('friends', 'osuId username avatarUrl customAvatarUrl');
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const rank = await getUserRank(req.params.osuId);
        const userData = user.toObject();
        userData.rank = rank;
        
        res.json(userData);
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных пользователя' });
    }
});

// API роут для получения списка пользователей
app.get('/api/users', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Нет подключения к базе данных');
        }
        
        const users = await User.find({}, 'osuId username avatarUrl customAvatarUrl lastOnline');
        res.json(users);
    } catch (error) {
        console.error('Ошибка при получении списка пользователей:', error.message);
        res.status(500).json({ error: 'Ошибка сервера при получении списка пользователей' });
    }
});

// API роуты для управления запросами в друзья
app.post('/api/friend-request', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const { toOsuId } = req.body;
    
    try {
        const fromUser = await User.findOne({ osuId: req.session.user.osuId });
        const toUser = await User.findOne({ osuId: toOsuId });
        
        if (!fromUser || !toUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        if (fromUser.friends.includes(toUser._id)) {
            return res.status(400).json({ error: 'Вы уже друзья' });
        }
        
        const existingRequest = await FriendRequest.findOne({ 
            from: fromUser._id, 
            to: toUser._id, 
            status: 'pending' 
        });
        
        if (existingRequest) {
            return res.status(400).json({ error: 'Запрос уже отправлен' });
        }
        
        const friendRequest = new FriendRequest({ from: fromUser._id, to: toUser._id });
        await friendRequest.save();
        
        // Отправляем уведомление получателю через WebSocket
        if (wsUtils.sendToUser(toOsuId.toString(), {
            type: 'friendRequest',
            from: { 
                osuId: fromUser.osuId, 
                username: fromUser.username, 
                avatarUrl: fromUser.customAvatarUrl || fromUser.avatarUrl 
            },
            requestId: friendRequest._id
        })) {
            // Обновляем счетчик уведомлений
            await wsUtils.updateNotificationCount(toOsuId);
        }
        
        res.json({ message: 'Запрос отправлен', requestId: friendRequest._id });
    } catch (error) {
        console.error('Ошибка при отправке запроса в друзья:', error);
        res.status(500).json({ error: 'Ошибка сервера при отправке запроса в друзья' });
    }
});

app.post('/api/friend-request/accept', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const { requestId } = req.body;
    
    try {
        const currentUser = await User.findOne({ osuId: req.session.user.osuId });
        if (!currentUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest || friendRequest.to.toString() !== currentUser._id.toString()) {
            return res.status(404).json({ error: 'Запрос не найден' });
        }
        
        friendRequest.status = 'accepted';
        await friendRequest.save();
        
        const fromUser = await User.findById(friendRequest.from);
        const toUser = await User.findById(friendRequest.to);
        
        // Добавляем пользователей в списки друзей друг друга
        if (!fromUser.friends.includes(toUser._id)) {
            fromUser.friends.push(toUser._id);
            await fromUser.save();
        }
        
        if (!toUser.friends.includes(fromUser._id)) {
            toUser.friends.push(fromUser._id);
            await toUser.save();
        }
        
        // Отправляем уведомление отправителю запроса с именем принимающего
        wsUtils.sendToUser(fromUser.osuId.toString(), { 
            type: 'friendRequestAccepted', 
            fromOsuId: toUser.osuId,
            fromUsername: toUser.username, 
            status: 'friends' 
        });
        
        // Обновляем счетчик уведомлений
        await wsUtils.updateNotificationCount(toUser.osuId);
        
        res.json({ message: 'Запрос принят' });
    } catch (error) {
        console.error('Ошибка при принятии запроса в друзья:', error);
        res.status(500).json({ error: 'Ошибка сервера при принятии запроса в друзья' });
    }
});

app.post('/api/friend-request/decline', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const { requestId } = req.body;
    
    try {
        const currentUser = await User.findOne({ osuId: req.session.user.osuId });
        if (!currentUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest || friendRequest.to.toString() !== currentUser._id.toString()) {
            return res.status(404).json({ error: 'Запрос не найден' });
        }
        
        friendRequest.status = 'declined';
        await friendRequest.save();
        
        const fromUser = await User.findById(friendRequest.from);
        
        // Отправляем уведомление отправителю запроса с именем отклонившего
        wsUtils.sendToUser(fromUser.osuId.toString(), { 
            type: 'friendRequestDeclined', 
            fromOsuId: req.session.user.osuId,
            fromUsername: currentUser.username,
            status: 'not_friends' 
        });
        
        // Обновляем счетчик уведомлений
        await wsUtils.updateNotificationCount(currentUser.osuId);
        
        res.json({ message: 'Запрос отклонен' });
    } catch (error) {
        console.error('Ошибка при отклонении запроса в друзья:', error);
        res.status(500).json({ error: 'Ошибка сервера при отклонении запроса в друзья' });
    }
});

app.get('/api/notifications', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const user = await User.findOne({ osuId: req.session.user.osuId });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendRequests = await FriendRequest.find({ to: user._id, status: 'pending' })
            .populate('from', 'username avatarUrl customAvatarUrl');
        
        res.json(friendRequests);
    } catch (error) {
        console.error('Ошибка при получении уведомлений:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении уведомлений' });
    }
});

app.get('/api/friend-status/:osuId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const currentUser = await User.findOne({ osuId: req.session.user.osuId });
        const targetUser = await User.findOne({ osuId: req.params.osuId });
        
        if (!currentUser || !targetUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const isFriend = currentUser.friends.some(friendId => friendId.equals(targetUser._id));
        
        // Проверяем наличие исходящего запроса
        const pendingRequest = await FriendRequest.findOne({ 
            from: currentUser._id, 
            to: targetUser._id, 
            status: 'pending' 
        });
        
        // Проверяем наличие входящего запроса
        const incomingRequest = await FriendRequest.findOne({
            from: targetUser._id,
            to: currentUser._id,
            status: 'pending'
        });
        
        let status = 'not_friends';
        if (isFriend) status = 'friends';
        else if (pendingRequest) status = 'pending';
        
        // Возвращаем также информацию о входящей заявке и её ID
        res.json({ 
            status, 
            hasIncomingRequest: !!incomingRequest,
            requestId: incomingRequest ? incomingRequest._id : null
        });
    } catch (error) {
        console.error('Ошибка при получении статуса дружбы:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении статуса дружбы' });
    }
});

app.delete('/api/friend-request/:requestId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const { requestId } = req.params;
    
    try {
        const currentUser = await User.findOne({ osuId: req.session.user.osuId });
        if (!currentUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest || friendRequest.from.toString() !== currentUser._id.toString()) {
            return res.status(404).json({ error: 'Запрос не найден или вы не являетесь отправителем' });
        }
        
        if (friendRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Нельзя отменить принятый или отклоненный запрос' });
        }
        
        const toUser = await User.findById(friendRequest.to);
        await FriendRequest.deleteOne({ _id: requestId });
        
        // Отправляем уведомление получателю запроса
        wsUtils.sendToUser(toUser.osuId.toString(), { 
            type: 'friendRequestCancelled', 
            requestId 
        });
        
        // Обновляем счетчик уведомлений
        await wsUtils.updateNotificationCount(toUser.osuId);
        
        res.json({ message: 'Запрос отменен' });
    } catch (error) {
        console.error('Ошибка при отмене запроса в друзья:', error);
        res.status(500).json({ error: 'Ошибка сервера при отмене запроса в друзья' });
    }
});

app.get('/api/friend-request/:toOsuId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const fromUser = await User.findOne({ osuId: req.session.user.osuId });
        const toUser = await User.findOne({ osuId: req.params.toOsuId });
        
        if (!fromUser || !toUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendRequest = await FriendRequest.findOne({ 
            from: fromUser._id, 
            to: toUser._id, 
            status: 'pending' 
        });
        
        if (friendRequest) {
            res.json({ requestId: friendRequest._id });
        } else {
            res.status(404).json({ error: 'Запрос не найден' });
        }
    } catch (error) {
        console.error('Ошибка при получении запроса в друзья:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении запроса в друзья' });
    }
});

// Главная страница
app.get('/', async (req, res) => {
    try {
        let isAuthenticated = !!req.session.user;
        let user = null;
        
        if (isAuthenticated) {
            user = await User.findOne({ osuId: req.session.user.osuId });
            
            if (user) {
                user = user.toObject();
                
                // Обновляем время последнего онлайна
                await User.updateOne({ osuId: req.session.user.osuId }, { lastOnline: Date.now() });
            } else {
                isAuthenticated = false;
                req.session.destroy();
            }
        }
        
        res.render('main', { isAuthenticated, user });
    } catch (error) {
        console.error('Ошибка при загрузке главной страницы:', error);
        res.status(500).send('Ошибка при загрузке главной страницы');
    }
});

// Запускаем очистку очереди каждые 60 секунд
setInterval(cleanupMatchmakingQueue, 60000);

// Запускаем очистку активных матчей каждые 5 секунд
setInterval(cleanupActiveMatches, 5000);

// Запуск сервера
server.listen(port, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту: ${port}`);
    
    // Создаем необходимые директории, если их нет
    fs.ensureDirSync(path.join(__dirname, 'public', 'uploads', 'avatars'));
    fs.ensureDirSync(path.join(__dirname, 'public', 'uploads', 'osuAvatars'));
    fs.ensureDirSync(path.join(__dirname, 'public', 'uploads', 'osuBanners'));
});