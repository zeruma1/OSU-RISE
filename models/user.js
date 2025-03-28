const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    osuId: { type: Number, required: true, unique: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }, 
    customAvatarUrl: { type: String, default: '' }, 
    bannerUrl: { type: String, default: '' }, 
    elo: { type: Number, default: 0 },
    avgDifficulty: { type: Number, default: 0 },
    winrate: { type: Number, default: 0 },
    ratingWins: { type: Number, default: 0 },
    fastWins: { type: Number, default: 0 },
    favMod: { type: String, default: 'None' },
    playcount: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastOnline: { type: Date, default: Date.now }
});

// Индекс для быстрой сортировки лидерборда
userSchema.index({ elo: -1 });

module.exports = mongoose.model('User', userSchema);