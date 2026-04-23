// Google Sheets Data Loader
// This file fetches game data from a published Google Sheet and converts it to the game format

// IMPORTANT: Set your Google Sheet ID and Sheet names here
const GOOGLE_SHEET_ID = '1lXQaaeSVjT9Ex4QQjNosnMnkfAMWqMy2aRy4l3aVs6Q'; // Replace with your Google Sheet ID
const USE_GOOGLE_SHEETS = true; // Set to true to use Google Sheets instead of local data

// Extract data from Google Sheet using JSON API (more reliable than CSV)
async function loadFromGoogleSheets() {
    if (!USE_GOOGLE_SHEETS || !GOOGLE_SHEET_ID) {
        console.log('Using local game data');
        return false;
    }

    try {
        // Use JSON export which handles commas and special characters better
        const classesUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Classes`;
        const lootUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Loot`;
        const minionsUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Minions`;

        console.log('Fetching game data from Google Sheets...');

        // Fetch all sheets
        const [classesData, lootData, minionsData] = await Promise.all([
            fetch(classesUrl).then(r => r.text()),
            fetch(lootUrl).then(r => r.text()),
            fetch(minionsUrl).then(r => r.text())
        ]);

        // Parse and convert to game format
        parseClassesFromJSON(classesData);
        parseLootFromJSON(lootData);
        parseMinionsFromJSON(minionsData);

        console.log('✓ Successfully loaded game data from Google Sheets');
        return true;
    } catch (error) {
        console.error('❌ Failed to load from Google Sheets:', error);
        console.log('Falling back to local game data');
        return false;
    }
}

// Helper function to parse Google Sheets JSON response
function parseJSON(jsonString) {
    try {
        // Remove the protective prefix/suffix that Google Sheets adds
        const jsonData = jsonString.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        const data = JSON.parse(jsonData);
        
        if (!data.table || !data.table.rows) {
            return [];
        }

        const cols = data.table.cols;
        const rows = data.table.rows;

        // Convert to objects
        return rows.map(row => {
            const obj = {};
            cols.forEach((col, i) => {
                const value = row.c[i]?.v || '';
                obj[col.label] = value;
            });
            return obj;
        });
    } catch (e) {
        console.error('Error parsing JSON response:', e);
        return [];
    }
}

// Parse Classes sheet
function parseClassesFromJSON(jsonString) {
    const rows = parseJSON(jsonString);
    const newClasses = {};

    rows.forEach(row => {
        if (!row.className) return;

        const className = String(row.className).toUpperCase().trim();
        if (!newClasses[className]) {
            newClasses[className] = {
                name: String(row.name || className),
                icon: String(row.icon || '⚔️'),
                baseRange: parseInt(row.baseRange) || 1,
                vitality: parseInt(row.vitality) || 2,
                flavor: String(row.flavor || ''),
                deck: []
            };
        }

        // Add cards to deck if cardName is present
        if (row.cardName) {
            const cardCount = parseInt(row.cardCount) || 1;
            for (let i = 0; i < cardCount; i++) {
                const card = {
                    name: String(row.cardName),
                    type: String(row.cardType || 'attack'),
                    desc: String(row.cardDesc || ''),
                    damage: parseInt(row.cardDamage) || 0,
                    fatigue: parseInt(row.cardFatigue) || 0,
                    ap: parseInt(row.cardAP) || 0,
                    count: parseInt(row.cardDrawCount) || 0
                };
                newClasses[className].deck.push(card);
            }
        }
    });

    // Update global CLASSES
    Object.assign(CLASSES, newClasses);
    console.log('  ✓ Classes loaded:', Object.keys(newClasses).length, 'classes');
}

// Parse Loot sheet
function parseLootFromJSON(jsonString) {
    const rows = parseJSON(jsonString);
    const newLoot = [];

    rows.forEach(row => {
        if (!row.name) return;

        const loot = {
            name: String(row.name),
            type: 'loot',
            icon: String(row.icon || '📦'),
            equipLabel: String(row.equipLabel || 'Equip'),
            equipDesc: String(row.equipDesc || ''),
            useLabel: String(row.useLabel || 'Use'),
            useDesc: String(row.useDesc || ''),
            bonusDamage: parseInt(row.bonusDamage) || 0,
            bonusRange: parseInt(row.bonusRange) || 0,
            burstDamage: parseInt(row.burstDamage) || 0,
            burstRange: parseInt(row.burstRange) || 0,
            isHeal: String(row.isHeal).toLowerCase() === 'true',
            desc: String(row.desc || '')
        };
        newLoot.push(loot);
    });

    // Update global LOOT_POOL
    LOOT_POOL.length = 0;
    LOOT_POOL.push(...newLoot);
    console.log('  ✓ Loot items loaded:', newLoot.length, 'items');
}

// Parse Minions sheet
function parseMinionsFromJSON(jsonString) {
    const rows = parseJSON(jsonString);
    const newMinions = [];

    rows.forEach(row => {
        if (!row.name) return;

        const minion = {
            name: String(row.name),
            hp: parseInt(row.hp) || 5,
            atk: parseInt(row.atk) || 1,
            icon: String(row.icon || '👹')
        };
        newMinions.push(minion);
    });

    // Update global MINION_TYPES
    MINION_TYPES.length = 0;
    MINION_TYPES.push(...newMinions);
    console.log('  ✓ Minion types loaded:', newMinions.length, 'minions');
}

// Initialize: Try loading from Google Sheets first, fall back to local data
async function initializeGameData() {
    console.log('Initializing game data...');
    const loaded = await loadFromGoogleSheets();
    if (!loaded && !USE_GOOGLE_SHEETS) {
        console.log('Using hardcoded local game data');
    }
    // Dispatch event when data is ready
    window.dispatchEvent(new Event('gameDataReady'));
    console.log('Game data ready!');
}

// Call this immediately (don't wait for DOM ready)
initializeGameData();
