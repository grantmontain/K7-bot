// utils/groupStats.js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/groupStats.json');

function loadDB() {
    try {
        if (!fs.existsSync(DB_PATH)) return {};
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
        return {};
    }
}

function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[groupStats] save error:', err);
    }
}

function addMessage(groupId, senderId) {
    const db = loadDB();
    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours().toString();

    if (!db[groupId]) db[groupId] = {};
    if (!db[groupId][today]) {
        db[groupId][today] = {
            total: 0,
            users: {},
            hours: {}
        };
    }

    const g = db[groupId][today];

    g.total++;
    g.users[senderId] = (g.users[senderId] || 0) + 1;
    g.hours[hour] = (g.hours[hour] || 0) + 1;

    saveDB(db);
}

function getStats(groupId) {
    const db = loadDB();
    const today = new Date().toISOString().slice(0, 10);

    if (!db[groupId] || !db[groupId][today]) return null;
    return db[groupId][today];
}

function getAllTimeStats(groupId) {
    const db = loadDB();

    if (!db[groupId]) return null;

    const result = {
        total: 0,
        users: {},
        hours: {}
    };

    for (const dayData of Object.values(db[groupId])) {
        result.total += dayData.total || 0;

        for (const [user, count] of Object.entries(dayData.users || {})) {
            result.users[user] = (result.users[user] || 0) + count;
        }

        for (const [hour, count] of Object.entries(dayData.hours || {})) {
            result.hours[hour] = (result.hours[hour] || 0) + count;
        }
    }

    return result;
}

module.exports = {
    addMessage,
    getStats,
    getAllTimeStats
};
