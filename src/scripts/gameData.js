// Game Data Configuration
// This file contains all card stats, loot items, and minion data
// Update this file to balance and modify game mechanics without touching CSS or HTML

const HAND_LIMIT = 7;

const CLASSES = {
    WARRIOR: { 
        name: 'Warrior', icon: '🛡️', baseRange: 1, vitality: 3, 
        flavor: 'A frontline juggernaut. Even the strongest armor chips under weight.',
        deck: [
            { name: 'Move', type: 'move', desc: 'Shift 1 zone' },
            { name: 'Slash', damage: 2, desc: 'Quick swing' },
            { name: 'Slash', damage: 2, desc: 'Quick swing' },
            { name: 'Slash', damage: 2, desc: 'Quick swing' },
            { name: 'Heavy Strike', damage: 4, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Heavy Strike', damage: 4, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Brace', type: 'draw', count: 2, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Rage', type: 'draw', count: 3, ap: 1, fatigue: 2, desc: '+1 Action Point | +2 Fatigue' },
            { name: 'Cleave', damage: 3, desc: 'Wide swing' },
        ]
    },
    ARCHER: { 
        name: 'Archer', icon: '🏹', baseRange: 3, vitality: 2, 
        flavor: 'Quick but brittle. Stay far away or die quickly.',
        deck: [
            { name: 'Move', type: 'move', desc: 'Shift 1 zone' },
            { name: 'Quick Shot', damage: 1, desc: 'Fast arrow' },
            { name: 'Quick Shot', damage: 1, desc: 'Fast arrow' },
            { name: 'Longshot', damage: 2, desc: 'Aimed shot' },
            { name: 'Longshot', damage: 2, desc: 'Aimed shot' },
            { name: 'Power Draw', damage: 4, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Scout', type: 'draw', count: 2, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Eagle Eye', type: 'draw', count: 1, ap: 1, desc: '+1 Action Point' },
            { name: 'Rain of Arrows', damage: 6, fatigue: 2, desc: '+2 Fatigue' },
        ]
    },
    MAGE: { 
        name: 'Mage', icon: '✨', baseRange: 4, vitality: 1, 
        flavor: 'Total Glass Cannon. One hit is almost always a wound.',
        deck: [
            { name: 'Move', type: 'move', desc: 'Shift 1 zone' },
            { name: 'Arcane Dart', damage: 1, type: 'magic', desc: 'Magic bolt' },
            { name: 'Arcane Dart', damage: 1, type: 'magic', desc: 'Magic bolt' },
            { name: 'Fireball', damage: 3, type: 'magic', fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Fireball', damage: 3, type: 'magic', fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Meditate', type: 'draw', count: 2, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Lightning', damage: 5, type: 'magic', fatigue: 2, desc: '+2 Fatigue' },
            { name: 'Blizzard', damage: 4, type: 'magic', fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Meteor', damage: 10, type: 'magic', fatigue: 3, desc: '+3 Fatigue' },
        ]
    },
    PALADIN: { 
        name: 'Paladin', icon: '☀️', baseRange: 1, vitality: 3, 
        flavor: 'Holy defense. Faith is your only shield now.',
        deck: [
            { name: 'Move', type: 'move', desc: 'Shift 1 zone' },
            { name: 'Holy Strike', damage: 2, desc: 'Faithful hit' },
            { name: 'Holy Strike', damage: 2, desc: 'Faithful hit' },
            { name: 'Sacred Blow', damage: 4, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Sacred Blow', damage: 4, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Shield Bash', damage: 1, desc: 'Stun' },
            { name: 'Blessing', type: 'draw', count: 2, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Pray', type: 'draw', count: 2, fatigue: 1, desc: '+1 Fatigue' },
            { name: 'Resurrection', type: 'heal', val: 4, fatigue: 2, desc: '+2 Fatigue' },
        ]
    }
};

const LOOT_POOL = [
    { name: 'Dagger', type: 'loot', icon: '🗡️', equipLabel: 'Sharpen', equipDesc: '+1 Damage permanent', useLabel: 'Throw', useDesc: '4 Damage (Range 1)', bonusDamage: 1, bonusRange: 0, burstDamage: 4, burstRange: 1, desc: 'Quick blade' },
    { name: 'Firebomb', type: 'loot', icon: '💣', equipLabel: 'Fusing', equipDesc: '+1 Range permanent', useLabel: 'Throw', useDesc: '6 Damage (Range 4)', bonusDamage: 0, bonusRange: 1, burstDamage: 6, burstRange: 4, desc: 'Explosive' },
    { name: 'Health Potion', type: 'loot', icon: '🧪', equipLabel: 'Sip', equipDesc: 'Discard 1 Wound', useLabel: 'Chug', useDesc: 'Clear all Wounds from hand', bonusDamage: 0, bonusRange: 0, isHeal: true, desc: 'Curative red' }
];

const MINION_TYPES = [
    { name: 'Goblin', hp: 8, atk: 3, icon: '👺' },
    { name: 'Skeleton', hp: 14, atk: 4, icon: '💀' },
    { name: 'Ogre', hp: 35, atk: 6, icon: '🧌' }
];
