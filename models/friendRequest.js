const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Добавляем составной индекс для ускорения поиска запросов между пользователями
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
// Индекс для поиска всех запросов к конкретному пользователю
friendRequestSchema.index({ to: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);