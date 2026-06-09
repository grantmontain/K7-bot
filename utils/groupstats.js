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
        console.error('[groupStats] erro ao salvar:', err);
    }
}

// Adicionar mensagem (atualiza tanto stats diárias quanto totais)
function addMessage(groupId, senderId) {
    const db = loadDB();
    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours().toString();

    // Inicializar grupo se não existir
    if (!db[groupId]) {
        db[groupId] = {
            daily: {},      // Stats por dia
            allTime: {      // Stats de todo o tempo
                total: 0,
                users: {},
                hours: {}
            }
        };
    }

    // Inicializar allTime se não existir
    if (!db[groupId].allTime) {
        db[groupId].allTime = {
            total: 0,
            users: {},
            hours: {}
        };
    }

    // Inicializar daily se não existir
    if (!db[groupId].daily) {
        db[groupId].daily = {};
    }

    // ========== ATUALIZAR STATS DO DIA (HOJE) ==========
    if (!db[groupId].daily[today]) {
        db[groupId].daily[today] = {
            total: 0,
            users: {},
            hours: {}
        };
    }

    const daily = db[groupId].daily[today];
    daily.total++;
    daily.users[senderId] = (daily.users[senderId] || 0) + 1;
    daily.hours[hour] = (daily.hours[hour] || 0) + 1;

    // ========== ATUALIZAR STATS DE TODO O TEMPO ==========
    const allTime = db[groupId].allTime;
    allTime.total++;
    allTime.users[senderId] = (allTime.users[senderId] || 0) + 1;
    allTime.hours[hour] = (allTime.hours[hour] || 0) + 1;

    saveDB(db);
}

// Obter stats APENAS do dia atual (hoje)
function getStats(groupId) {
    const db = loadDB();
    const today = new Date().toISOString().slice(0, 10);

    if (!db[groupId] || !db[groupId].daily || !db[groupId].daily[today]) return null;
    return db[groupId].daily[today];
}

// Obter stats de TODO O TEMPO
function getAllTimeStats(groupId) {
    const db = loadDB();
    
    if (!db[groupId] || !db[groupId].allTime) return null;
    return db[groupId].allTime;
}

// Obter stats de um dia específico (opcional, útil para estatísticas históricas)
function getStatsByDate(groupId, date) {
    const db = loadDB();
    
    if (!db[groupId] || !db[groupId].daily || !db[groupId].daily[date]) return null;
    return db[groupId].daily[date];
}

// Limpar dados antigos (opcional - remove stats com mais de X dias)
function cleanOldStats(daysToKeep = 30) {
    const db = loadDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    
    let cleaned = false;
    
    for (const groupId in db) {
        if (db[groupId].daily) {
            for (const date in db[groupId].daily) {
                if (date < cutoffStr) {
                    delete db[groupId].daily[date];
                    cleaned = true;
                }
            }
        }
    }
    
    if (cleaned) {
        saveDB(db);
        console.log(`[groupStats] Dados anteriores a ${cutoffStr} foram removidos`);
    }
}

module.exports = { 
    addMessage, 
    getStats, 
    getAllTimeStats,
    getStatsByDate,
    cleanOldStats
};
