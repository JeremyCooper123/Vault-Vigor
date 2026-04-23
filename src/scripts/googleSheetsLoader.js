// Google Sheets Data Loader
// This file fetches game data from a published Google Sheet and converts it to the game format

// IMPORTANT: Set your Google Sheet ID and Sheet names here
const GOOGLE_SHEET_ID = '1lXQaaeSVjT9Ex4QQjNosnMnkfAMWqMy2aRy4l3aVs6Q' ; // Replace with your Google Sheet ID
const USE_GOOGLE_SHEETS = true; // Set to true to use Google Sheets instead of local data

// Extract data from Google Sheet CSV export URL
async function loadFromGoogleSheets() {
    if (!USE_GOOGLE_SHEETS || !GOOGLE_SHEET_ID) {
        console.log('Using local game data');
        return false;
    }

    try {
        // Construct the CSV export URL for each sheet
        const classesUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Classes`;
        const lootUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Loot`;
        const minionsUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Minions`;

        // Fetch all sheets
        const [classesData, lootData, minionsData] = await Promise.all([
            fetch(classesUrl).then(r => r.text()),
            fetch(lootUrl).then(r => r.text()),
            fetch(minionsUrl).then(r => r.text())
        ]);

        // Parse and convert to game format
        parseClassesFromCSV(classesData);
        parseLootFromCSV(lootData);
        parseMinionsFromCSV(minionsData);

        console.log('✓ Loaded game data from Google Sheets');
        return true;
    } catch (error) {
        console.error('Failed to load from Google Sheets:', error);
        console.log('Falling back to local data');
        return false;
    }
}

// Helper function to parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i];
        });
        return obj;
    });
    return rows;
}

// Parse Classes sheet
function parseClassesFromCSV(csv) {
    const rows = parseCSV(csv);
    const newClasses = {};

    rows.forEach(row => {
        if (!row.className) return;

        const className = row.className.toUpperCase();
        if (!newClasses[className]) {
            newClasses[className] = {
                name: row.name || className,
                icon: row.icon || '⚔️',
                baseRange: parseInt(row.baseRange) || 1,
                vitality: parseInt(row.vitality) || 2,
                flavor: row.flavor || '',
                deck: []
            };
        }

        // Add cards to deck if cardName is present
        if (row.cardName) {
            const cardCount = parseInt(row.cardCount) || 1;
            for (let i = 0; i < cardCount; i++) {
                const card = {
                    name: row.cardName,
                    type: row.cardType || 'attack',
                    desc: row.cardDesc || '',
                    damage: row.cardDamage ? parseInt(row.cardDamage) : 0,
                    fatigue: row.cardFatigue ? parseInt(row.cardFatigue) : 0,
                    ap: row.cardAP ? parseInt(row.cardAP) : 0,
                    count: row.cardDrawCount ? parseInt(row.cardDrawCount) : 0
                };
                newClasses[className].deck.push(card);
            }
        }
    });

    // Update global CLASSES
    Object.assign(CLASSES, newClasses);
}

// Parse Loot sheet
function parseLootFromCSV(csv) {
    const rows = parseCSV(csv);
    const newLoot = [];

    rows.forEach(row => {
        if (!row.name) return;

        const loot = {
            name: row.name,
            type: 'loot',
            icon: row.icon || '📦',
            equipLabel: row.equipLabel || 'Equip',
            equipDesc: row.equipDesc || '',
            useLabel: row.useLabel || 'Use',
            useDesc: row.useDesc || '',
            bonusDamage: row.bonusDamage ? parseInt(row.bonusDamage) : 0,
            bonusRange: row.bonusRange ? parseInt(row.bonusRange) : 0,
            burstDamage: row.burstDamage ? parseInt(row.burstDamage) : 0,
            burstRange: row.burstRange ? parseInt(row.burstRange) : 0,
            isHeal: row.isHeal === 'true' || row.isHeal === 'TRUE',
            desc: row.desc || ''
        };
        newLoot.push(loot);
    });

    // Update global LOOT_POOL
    LOOT_POOL.length = 0;
    LOOT_POOL.push(...newLoot);
}

// Parse Minions sheet
function parseMinionsFromCSV(csv) {
    const rows = parseCSV(csv);
    const newMinions = [];

    rows.forEach(row => {
        if (!row.name) return;

        const minion = {
            name: row.name,
            hp: parseInt(row.hp) || 5,
            atk: parseInt(row.atk) || 1,
            icon: row.icon || '👹'
        };
        newMinions.push(minion);
    });

    // Update global MINION_TYPES
    MINION_TYPES.length = 0;
    MINION_TYPES.push(...newMinions);
}

// Initialize: Try loading from Google Sheets first, fall back to local data
async function initializeGameData() {
    const loaded = await loadFromGoogleSheets();
    if (!loaded && !USE_GOOGLE_SHEETS) {
        console.log('Using hardcoded local game data');
    }
    // Dispatch event when data is ready
    window.dispatchEvent(new Event('gameDataReady'));
}

// Call this when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGameData);
} else {
    initializeGameData();
}
