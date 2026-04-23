# Google Sheets Integration Guide

## How to Set Up Your Game Data in Google Sheets

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Vault-Vigor Game Data"

### Step 2: Set Up the Sheets

Create **5 separate sheet tabs** with the following structures:

#### Sheet 1: "Classes"
| className | name    | icon | baseRange | vitality | flavor |
|-----------|---------|------|-----------|----------|--------|
| WARRIOR   | Warrior | 🛡️  | 1         | 3        | A frontline juggernaut... |
| ARCHER    | Archer  | 🏹  | 3         | 2        | Quick but brittle... |
| MAGE      | Mage    | ✨  | 4         | 1        | Total Glass Cannon... |

**Key Notes:**
- One row per class (not per card)
- Contains only class metadata and stats
- `className`: Used as the internal class ID (UPPERCASE)
- `name`: Display name for the class
- `icon`: Emoji or symbol
- `baseRange`: Default attack range
- `vitality`: Base HP/wound resistance

#### Sheet 2: "Cards"
| className | cardName | cardCount | cardType | cardDamage | cardFatigue | cardAP | cardDrawCount | cardDesc |
|-----------|----------|-----------|----------|-----------|-------------|--------|-----------|----------|
| WARRIOR   | Move | 1 | move | 0 | 0 | 0 | 0 | Shift 1 zone |
| WARRIOR   | Slash | 3 | attack | 2 | 0 | 0 | 0 | Quick swing |
| WARRIOR   | Heavy Strike | 2 | attack | 4 | 1 | 0 | 0 | +1 Fatigue |
| ARCHER    | Move | 1 | move | 0 | 0 | 0 | 0 | Shift 1 zone |
| ARCHER    | Quick Shot | 2 | attack | 1 | 0 | 0 | 0 | Fast arrow |

**Key Notes:**
- One row per unique card (not duplicated)
- `className`: Must match exactly with a class defined in the Classes sheet
- `cardName`: Name of the card
- `cardCount`: How many times this card appears in the class deck
- `cardType`: `move`, `attack`, `draw`, `heal`, `fatigue`, `wound`
- Leave blank or 0 for unused properties

#### Sheet 3: "Loot"
| name | icon | equipLabel | equipDesc | useLabel | useDesc | bonusDamage | bonusRange | burstDamage | burstRange | isHeal | desc |
|------|------|-----------|-----------|----------|---------|------------|-----------|------------|-----------|--------|------|
| Dagger | 🗡️ | Sharpen | +1 Damage permanent | Throw | 4 Damage (Range 1) | 1 | 0 | 4 | 1 | false | Quick blade |
| Firebomb | 💣 | Fusing | +1 Range permanent | Throw | 6 Damage (Range 4) | 0 | 1 | 6 | 4 | false | Explosive |
| Health Potion | 🧪 | Sip | Discard 1 Wound | Chug | Clear all Wounds from hand | 0 | 0 | 0 | 0 | true | Curative red |

#### Sheet 4: "Minions"
| name | hp | atk | icon |
|------|----|----|------|
| Goblin | 8 | 3 | 👺 |
| Skeleton | 14 | 4 | 💀 |
| Ogre | 35 | 6 | 🧌 |

#### Sheet 5: "Config"
| key | value |
|-----|-------|
| HAND_LIMIT | 7 |

### Step 3: Make It Public
1. Click **Share** button (top right)
2. Change to **"Anyone with the link"** or **"Public on the web"**
3. Get your **Sheet ID** from the URL: `https://docs.google.com/spreadsheets/d/**YOUR_SHEET_ID**/edit`

### Step 4: Enable Google Sheets in Your App
1. Open `src/scripts/googleSheetsLoader.js`
2. Replace `'YOUR_SHEET_ID_HERE'` with your actual Sheet ID
3. Change `USE_GOOGLE_SHEETS = false` to `USE_GOOGLE_SHEETS = true`

```javascript
const GOOGLE_SHEET_ID = 'your-sheet-id-here'; // Replace this
const USE_GOOGLE_SHEETS = true; // Enable it
```

### Step 5: Test
- Reload your app in the browser
- Check the browser console (F12) for messages
- You should see: `✓ Loaded game data from Google Sheets`

## How It Works

- **Local data (default)**: Uses hardcoded values in `gameData.js`
- **Google Sheets mode**: Fetches live data from your published sheet when enabled
- **Fallback**: If Google Sheets fails to load, it automatically uses local data

## Updating Your Game

Once linked:
1. Edit your Google Sheet values
2. Reload the app in browser
3. New data loads automatically!

No code changes needed. Perfect for balancing on the fly! 🎮

## Format Tips

- **Empty cells**: Leave blank for 0 or false values
- **Text fields**: Cards, descriptions can be any text
- **Numbers**: Damage, HP, count must be numeric
- **Booleans**: Use `true` or `false` for isHeal, etc.
- **Icons**: Copy/paste emoji directly into Google Sheets

## Troubleshooting

- **CORS Error**: Make sure sheet is publicly shared
- **No data loading**: Check console (F12) for error messages
- **Partial data**: Check sheet names match exactly (case-sensitive)
- **Old data showing**: Hard refresh browser (Ctrl+Shift+R)

## Going Further

Once this is working, you could:
- Add a simple dashboard to modify values directly
- Create admin login to edit sheets
- Add versioning/changelog tracking
- Export different "balance patches" as separate sheets
