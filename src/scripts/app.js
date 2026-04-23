const { useState, useEffect } = React;

function App() {
    const [gameState, setGameState] = useState('LOBBY');
    const [choosingPlayer, setChoosingPlayer] = useState(1);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [viewingClass, setViewingClass] = useState('WARRIOR');
    const [players, setPlayers] = useState([]);
    const [activePlayerIdx, setActivePlayerIdx] = useState(0);
    const [vanguard, setVanguard] = useState([[], [], [], []]);
    const [round, setRound] = useState(1);
    const [phase, setPhase] = useState('ACTION');
    const [activeLootChoice, setActiveLootChoice] = useState(null);
    const [activeMoveChoice, setActiveMoveChoice] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [showLootBook, setShowLootBook] = useState(false);

    const selectClass = (cls) => {
        if (selectedClasses.includes(cls)) return;
        const newList = [...selectedClasses, cls];
        if (choosingPlayer === 1) { setSelectedClasses(newList); setChoosingPlayer(2); const n = Object.keys(CLASSES).find(k => k !== cls); setViewingClass(n); }
        else initGame(newList);
    };

    const initGame = (clss) => {
        const ps = clss.map((k, i) => {
            const deckTemplate = CLASSES[k].deck.map(c => ({ ...c, id: Math.random() }));
            const deck = [...deckTemplate].sort(() => Math.random() - 0.5);
            return { id: i, className: k, classData: CLASSES[k], ap: 3, hand: deck.splice(0, 5), deck, discard: [], weaponBonus: 0, rangeBonus: 0, zone: 3 }; 
        });
        setPlayers(ps); setVanguard([[{ ...MINION_TYPES[0], id: Math.random() }], [], [], []]); setGameState('PLAYING');
    };

    const flashError = (msg) => { 
        setErrorMsg(msg); 
        setTimeout(() => setErrorMsg(''), 1500); 
    };

    const drawX = (p, count) => {
        const newP = { ...p, hand: [...p.hand], deck: [...p.deck], discard: [...p.discard] };
        for (let i = 0; i < count; i++) {
            if (newP.deck.length === 0) { if (newP.discard.length === 0) break; newP.deck = [...newP.discard].sort(() => Math.random() - 0.5); newP.discard = []; }
            if (newP.deck.length > 0) newP.hand.push(newP.deck.pop());
        }
        return newP;
    };

    const playCard = (idx) => {
        const p = players[activePlayerIdx]; const card = p.hand[idx];
        if (phase === 'DISCARD') {
            if (card.type === 'fatigue' || card.type === 'wound') { flashError("Cannot discard required cards!"); return; }
            setPlayers(prev => { const up = [...prev]; const pl = { ...up[activePlayerIdx], hand: [...up[activePlayerIdx].hand], discard: [...up[activePlayerIdx].discard] }; pl.discard.push(pl.hand.splice(idx, 1)[0]); up[activePlayerIdx] = pl; return up; });
            return;
        }
        if (card.type === 'wound') { flashError("Wounds cannot be played!"); return; }
        if (p.ap <= 0) { flashError("No Action Points!"); return; }
        if (card.type === 'loot') { setActiveLootChoice({ card, cardIdx: idx }); return; }
        if (card.type === 'move') { setActiveMoveChoice({ card, cardIdx: idx }); return; }
        processCardEffect(card, idx);
    };

    const processCardEffect = (c, idx) => {
        setPlayers(prev => {
            const up = [...prev]; let pl = { ...up[activePlayerIdx], hand: [...up[activePlayerIdx].hand], discard: [...up[activePlayerIdx].discard], deck: [...up[activePlayerIdx].deck] };
            pl.hand.splice(idx, 1); pl.ap -= 1;
            
            if (c.type === 'fatigue') { up[activePlayerIdx] = pl; return up; }
            
            const dmg = (c.damage || 0) > 0 ? (c.damage + pl.weaponBonus) : 0;
            if (dmg > 0) { 
                const s = resolveAttack(dmg, c.type === 'magic', pl.zone, (pl.classData.baseRange + pl.rangeBonus), activePlayerIdx); 
                if (!s) return prev; 
            }
            
            pl.discard.push(c);
            if (c.type === 'heal') {
                if(pl.hand.some(x => x.type === 'wound')) {
                   const firstWoundIdx = pl.hand.findIndex(x => x.type === 'wound');
                   pl.hand.splice(firstWoundIdx, 1);
                } else {
                    flashError("No wounds to heal!");
                }
            }
            if (c.type === 'draw') pl = drawX(pl, c.count);
            if (c.ap) pl.ap += c.ap;
            if (c.fatigue > 0) for(let f=0; f<c.fatigue; f++) pl.discard.push({ id: Math.random(), name: 'Fatigue', type: 'fatigue', desc: 'Costs 1 AP to clear' });
            
            up[activePlayerIdx] = pl; 
            return up;
        });
    };

    const resolveAttack = (dmg, isM, pZ, pR, pIdx) => {
        const range = isM ? 4 : pR; let tZ = -1;
        for (let i = 0; i < 4; i++) if (vanguard[i].length > 0 && Math.abs(pZ - i) <= range) { tZ = i; break; }
        if (tZ === -1) { flashError("Target out of Range!"); return false; }
        setVanguard(prev => {
            const next = [...prev.map(z => [...z])]; const e = { ...next[tZ][0] }; e.hp -= dmg;
            if (e.hp <= 0) { 
                next[tZ].shift(); 
                setTimeout(() => { 
                    setPlayers(curr => { 
                        const up = [...curr]; 
                        const t = LOOT_POOL[Math.floor(Math.random() * LOOT_POOL.length)]; 
                        up[pIdx].hand.push({ ...t, id: Math.random() }); 
                        return up; 
                    }); 
                }, 10); 
            } else next[tZ][0] = e;
            return next;
        });
        return true;
    };

    const handleMoveChoice = (dir) => {
        const { card, cardIdx } = activeMoveChoice; const p = players[activePlayerIdx]; const tZ = p.zone + dir;
        if (tZ < 0 || tZ > 3) { flashError("Cannot leave the battlefield!"); return; }
        setPlayers(prev => { const up = [...prev]; let pl = { ...up[activePlayerIdx], hand: [...up[activePlayerIdx].hand], discard: [...up[activePlayerIdx].discard] }; pl.zone = tZ; pl.hand.splice(cardIdx, 1); pl.ap -= 1; pl.discard.push(card); up[activePlayerIdx] = pl; return up; });
        setActiveMoveChoice(null);
    };

    const handleLootChoice = (v) => {
        const { card, cardIdx } = activeLootChoice;
        setPlayers(prev => {
            const up = [...prev]; let pl = { ...up[activePlayerIdx], hand: [...up[activePlayerIdx].hand], discard: [...up[activePlayerIdx].discard] };
            if (v === 'burst') { 
                if (card.isHeal) {
                    pl.hand = pl.hand.filter(c => c.type !== 'wound'); 
                } else { 
                    const s = resolveAttack(card.burstDamage, false, pl.zone, card.burstRange, activePlayerIdx); 
                    if (!s) return prev; 
                } 
            }
            else { 
                if (card.isHeal) { 
                    const fi = pl.hand.findIndex(c => c.type === 'wound'); 
                    if (fi !== -1) pl.hand.splice(fi, 1); 
                } else { 
                    pl.weaponBonus += card.bonusDamage; pl.rangeBonus += card.bonusRange; 
                } 
            }
            pl.hand.splice(cardIdx, 1); pl.ap -= 1; pl.discard.push(card); up[activePlayerIdx] = pl; return up;
        });
        setActiveLootChoice(null);
    };

    const handleNext = () => { 
        if (phase === 'ACTION') setPhase('DISCARD'); 
        else { 
            if (players[activePlayerIdx].hand.length > HAND_LIMIT) { flashError("Hand limit exceeded!"); return; } 
            if (activePlayerIdx < players.length - 1) { setActivePlayerIdx(activePlayerIdx + 1); setPhase('ACTION'); } 
            else runEnemyTurn(); 
        } 
    };

    const runEnemyTurn = () => {
        setPlayers(prev => {
            return prev.map(p => {
                const zoneEnemies = vanguard[p.zone]; let newWounds = 0;
                zoneEnemies.forEach(e => { if (e.atk >= p.classData.vitality) newWounds++; });
                let hand = [...p.hand]; for(let i=0; i<newWounds; i++) hand.push({ id: Math.random(), name: 'Wound', type: 'wound', desc: 'Permanent penalty' });
                const totalW = hand.filter(c => c.type === 'wound').length;
                if (totalW >= p.classData.vitality) setGameState('GAMEOVER');
                return drawX({ ...p, hand, ap: 3 }, Math.max(0, 5 - hand.length));
            });
        });
        setVanguard(prev => [[{ ...MINION_TYPES[Math.floor(Math.random() * 3)], id: Math.random() }], ...prev.slice(0, 3)]);
        setRound(round + 1); setActivePlayerIdx(0); setPhase('ACTION');
    };

    const RulesModal = () => (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h2 className="font-black text-2xl uppercase tracking-tighter text-blue-500 italic">Field Guide</h2>
                    <button onClick={() => setShowRules(false)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold hover:bg-slate-700">X</button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-slate-300">
                    <div>
                        <h3 className="font-black text-white uppercase tracking-widest text-xs mb-2">1. The Flow of Battle</h3>
                        <p className="mb-2">Rounds consist of Action and Cleanup phases. AP (Action Points) fuel your cards.</p>
                    </div>
                    <div>
                        <h3 className="font-black text-white uppercase tracking-widest text-xs mb-2">2. Combat & Range</h3>
                        <p className="mb-2">Monsters spawn in Zone 1. You defend Zone 4. Check your <strong className="text-blue-400">Range</strong> before attacking.</p>
                    </div>
                    <div>
                        <h3 className="font-black text-white uppercase tracking-widest text-xs mb-2">3. Wounds & Vitality</h3>
                        <p className="mb-2">Monsters attack at start of round. If <strong className="text-red-500">Atk ≥ Vitality</strong>, you gain a Wound.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const LootBookModal = () => (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-amber-900/20">
                    <h2 className="font-black text-2xl uppercase tracking-tighter text-amber-500 italic">Loot Compendium</h2>
                    <button onClick={() => setShowLootBook(false)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold hover:bg-slate-700">X</button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {LOOT_POOL.map(item => (
                        <div key={item.name} className="bg-slate-800/50 border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{item.icon}</span>
                                <div>
                                    <h3 className="font-black text-amber-400 uppercase text-lg leading-tight">{item.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                                    <div className="text-[9px] font-black text-blue-400 uppercase mb-1">Equip Effect</div>
                                    <div className="text-[11px] font-bold text-slate-300">{item.equipDesc}</div>
                                </div>
                                <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                                    <div className="text-[9px] font-black text-red-500 uppercase mb-1">Burst Effect</div>
                                    <div className="text-[11px] font-bold text-slate-300">{item.useDesc}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 text-center">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Monsters drop 1 random loot on death</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (gameState === 'LOBBY') {
        const cls = CLASSES[viewingClass]; const isTaken = selectedClasses.includes(viewingClass);
        const groupedDeck = cls.deck.reduce((acc, card) => {
            const existing = acc.find(c => c.name === card.name);
            if (existing) existing.count += 1;
            else acc.push({ ...card, count: 1 });
            return acc;
        }, []);

        return (
            <div className="lobby-view bg-slate-950 flex flex-col p-6">
                {showRules && <RulesModal />}
                {showLootBook && <LootBookModal />}
                <header className="mb-6 shrink-0 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black italic text-red-600 uppercase leading-none tracking-tighter">Vault & Vigor</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${choosingPlayer === 1 ? 'bg-blue-600' : 'bg-orange-600'}`}>Player {choosingPlayer}</span>
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Hardcore Difficulty</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowLootBook(true)} className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center font-black text-slate-400 hover:text-white hover:border-slate-500 transition-colors">📦</button>
                        <button onClick={() => setShowRules(true)} className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center font-black text-slate-400 hover:text-white hover:border-slate-500 transition-colors">?</button>
                    </div>
                </header>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-4 shrink-0 no-scrollbar">
                    {Object.keys(CLASSES).map(k => (
                        <button key={k} onClick={() => setViewingClass(k)} className={`px-4 py-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 min-w-[90px] relative ${viewingClass === k ? 'border-white bg-slate-800' : 'border-slate-800 bg-slate-900 opacity-60'}`}>
                            <span className="text-3xl mb-1">{CLASSES[k].icon}</span>
                            <span className="text-[10px] font-black uppercase">{CLASSES[k].name}</span>
                            {selectedClasses.includes(k) && <div className="absolute -top-2 -right-2 bg-slate-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-950">P{selectedClasses.indexOf(k) + 1}</div>}
                        </button>
                    ))}
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 p-6 flex flex-col mb-10 shadow-2xl relative">
                    {isTaken && <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white font-black uppercase text-xl">Already Taken</div>}
                    <div className="flex justify-between items-start mb-6">
                        <div className="text-6xl">{cls.icon}</div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black uppercase italic">{cls.name}</h2>
                            <div className="flex gap-2 justify-end mt-2">
                                <div className="stat-pill text-amber-500">Vitality {cls.vitality}</div>
                                <div className="stat-pill text-blue-400">Range {cls.baseRange}</div>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-8">
                        {groupedDeck.map((card, i) => (
                            <div key={i} className="bg-slate-800/40 p-3 rounded-2xl flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-3">
                                    {card.count > 1 && <span className="bg-slate-700 text-blue-400 text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border border-white/10">{card.count}x</span>}
                                    <div className="text-xs font-black uppercase">{card.name}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {card.damage && <div className="text-[10px] font-black text-red-500 uppercase">{card.damage} Damage</div>}
                                    {card.type === 'draw' && <div className="text-[10px] font-black text-blue-400 uppercase">+{card.count} Cards</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => selectClass(viewingClass)} disabled={isTaken} className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-base shadow-lg ${isTaken ? 'bg-slate-800 text-slate-600' : (choosingPlayer === 1 ? 'bg-blue-600' : 'bg-orange-600')}`}>Lock In {cls.name}</button>
                </div>
            </div>
        );
    }

    const cp = players[activePlayerIdx]; 
    const cw = cp.hand.filter(c => c.type === 'wound').length;

    return (
        <div className="game-view max-w-md mx-auto relative">
            {showRules && <RulesModal />}
            {showLootBook && <LootBookModal />}
            {errorMsg && <div className="error-toast bg-red-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl border-2 border-red-400">{errorMsg}</div>}
            <div className="p-4 pt-8 shrink-0 bg-slate-900/60 flex justify-between items-center border-b border-white/5">
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Floor {round}</div>
                    <div className="flex gap-1 mt-1">{Array.from({length: cp.classData.vitality}).map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full border border-black ${i < cw ? 'bg-red-500' : 'bg-slate-700'}`}></div>))}</div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-2 mr-2">
                        {players.map((p, i) => (
                            <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${i === activePlayerIdx ? 'border-blue-500 bg-blue-900' : 'border-slate-800 bg-slate-900 opacity-30'}`}><span className="text-xl">{p.classData.icon}</span></div>
                        ))}
                    </div>
                    <button onClick={() => setShowLootBook(true)} className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-black text-slate-400 hover:text-white">📦</button>
                    <button onClick={() => setShowRules(true)} className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-black text-slate-400 hover:text-white">?</button>
                </div>
            </div>
            <div className="bg-slate-900 shrink-0">
                <div className={`px-4 py-1.5 text-[10px] font-black uppercase text-center tracking-widest ${phase === 'DISCARD' ? 'bg-orange-600' : 'bg-blue-600'}`}>{cp.classData.name}: {phase === 'ACTION' ? `${cp.ap} Action Points Remaining` : 'Cleanup Phase: Discard to continue'}</div>
                <div className="flex justify-center items-center gap-2 py-2 px-4 border-b border-white/5"><div className="stat-pill text-blue-400">Range {cp.classData.baseRange + cp.rangeBonus}</div><div className="stat-pill text-red-400">Weapon Bonus +{cp.weaponBonus}</div></div>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2 px-2 pt-4 relative bg-slate-950">
                {vanguard.map((ens, i) => (
                    <div key={i} className="flex flex-col h-full">
                        <div className={`flex-1 rounded-2xl border-2 flex flex-col items-center p-1.5 gap-1.5 relative ${ens.length > 0 ? 'bg-red-950/10 border-red-500/30' : 'border-slate-800/50 bg-slate-900/20'}`}>
                            <div className="text-[8px] font-black text-slate-700 uppercase">Zone {i+1}</div>
                            <div className="w-full flex flex-col gap-1.5">{ens.map(m => (
                                <div key={m.id} className="w-full aspect-square bg-slate-900 border border-red-500/30 rounded-lg flex items-center justify-center relative shadow-md">
                                    <span className="text-xl">{m.icon}</span><div className="absolute -top-1 -right-1 bg-white text-black font-black text-[8px] px-1 h-4 flex items-center justify-center rounded-full border border-red-900">{m.hp}</div><div className="absolute -bottom-1 -left-1 bg-red-600 text-white font-black text-[7px] px-1 h-3 flex items-center justify-center rounded-full">Atk {m.atk}</div>
                                </div>
                            ))}</div>
                        </div>
                        <div className="h-24 mt-2 flex flex-col items-center justify-start py-2 gap-2">{players.map((p, pi) => p.zone === i && (<div key={pi} className={`player-token w-10 h-10 bg-slate-900 rounded-full border-2 flex items-center justify-center text-xl ${pi === activePlayerIdx ? 'active-token' : 'border-slate-700'}`}>{p.classData.icon}</div>))}</div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-950/80 pt-2 border-t border-white/10 shrink-0">
                <div className="px-5 flex justify-between items-center mb-1 text-[8px] font-bold text-slate-600 uppercase tracking-widest"><div className="flex gap-2"><span>Deck: {cp.deck.length}</span><span>Discard: {cp.discard.length}</span></div><span className="text-blue-500">Hand Capacity {cp.hand.length}/{HAND_LIMIT}</span></div>
                <div className="hand-scroll-area no-scrollbar">{cp.hand.map((card, i) => {
                    const isF = card.type === 'fatigue', isW = card.type === 'wound', isM = card.type === 'move', isL = card.type === 'loot';
                    return (
                        <div key={card.id} onClick={() => playCard(i)} className={`playing-card p-2 text-center no-tap ${isW ? 'wound-card' : isF ? 'fatigue-card' : isL ? 'loot-card' : cp.className.toLowerCase() + '-card'} ${phase === 'DISCARD' && !isF && !isW ? 'scale-90 opacity-60' : ''}`}>
                            <div className="text-[8px] font-black uppercase text-slate-400 opacity-80">{card.name}</div>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {card.damage > 0 ? (
                                    <div className="flex flex-col items-center"><span className="card-damage-display text-white">{card.damage + cp.weaponBonus}</span><span className="text-[8px] font-black uppercase text-red-500 mt-1">Damage</span></div>
                                ) : card.type === 'draw' ? (
                                    <div className="flex flex-col items-center"><span className="card-damage-display text-white">+{card.count}</span><span className="text-[8px] font-black uppercase text-blue-400 mt-1">Cards</span></div>
                                ) : card.type === 'heal' ? (
                                    <div className="flex flex-col items-center"><span className="card-damage-display text-white">Heal</span><span className="text-[8px] font-black uppercase text-emerald-400 mt-1">Wound</span></div>
                                ) : isW ? <span className="text-5xl">🩸</span> : isF ? <span className="text-5xl">💤</span> : isM ? <span className="text-5xl">🏃</span> : <span className="text-5xl">{card.icon || '✨'}</span>}
                            </div>
                            <div className="bg-black/40 rounded-lg p-1.5 flex flex-col items-center justify-center min-h-[28px]"><div className="text-[7px] font-black uppercase text-slate-300 leading-tight">{card.desc}</div></div>
                        </div>
                    );
                })}</div>
            </div>
            <div className="p-4 pb-8 bg-slate-950 shrink-0"><button onClick={handleNext} className={`w-full h-14 rounded-2xl font-black uppercase text-sm shadow-xl transition-all active:scale-[0.98] ${phase === 'ACTION' ? 'bg-blue-600' : 'bg-orange-600'}`}>{phase === 'ACTION' ? "Confirm Action Phase" : "End Player Turn"}</button></div>
            {activeLootChoice && (
                <div className="fixed inset-0 z-[120] bg-slate-950/95 flex items-center justify-center p-6"><div className="bg-slate-900 border-2 border-amber-500 rounded-[2.5rem] w-full max-w-xs overflow-hidden shadow-2xl">
                    <div className="bg-amber-500 p-6 text-center"><div className="text-5xl mb-2">{activeLootChoice.card.icon}</div><h3 className="text-2xl font-black uppercase text-slate-950">{activeLootChoice.card.name}</h3></div>
                    <div className="p-6 flex flex-col gap-4">
                        <button onClick={() => handleLootChoice('equip')} className="bg-slate-800 p-4 rounded-2xl text-left border border-amber-500/20"><div className="font-black text-amber-500 uppercase text-xs">Equip Permanent</div><div className="text-[10px] text-slate-400 font-bold">{activeLootChoice.card.equipDesc}</div></button>
                        <button onClick={() => handleLootChoice('burst')} className="bg-slate-800 p-4 rounded-2xl text-left border border-red-500/20"><div className="font-black text-red-500 uppercase text-xs">Burst Effect</div><div className="text-[10px] text-slate-400 font-bold">{activeLootChoice.card.useDesc}</div></button>
                        <button onClick={() => setActiveLootChoice(null)} className="mt-2 text-slate-500 font-black uppercase text-[10px] w-full text-center">Back</button>
                    </div>
                </div></div>
            )}
            {activeMoveChoice && (
                <div className="fixed inset-0 z-[110] bg-slate-950/90 flex items-center justify-center p-6"><div className="bg-slate-900 border-2 border-blue-500 rounded-[2rem] w-full max-w-xs p-8 text-center"><h3 className="text-xl font-black mb-6 uppercase text-blue-500 tracking-widest">Zone Shift</h3><div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleMoveChoice(-1)} className={`py-8 rounded-2xl flex flex-col items-center justify-center ${cp.zone === 0 ? 'bg-slate-800 opacity-20 pointer-events-none' : 'bg-blue-600'}`}><span className="text-3xl">⬅️</span><span className="text-[8px] font-black uppercase mt-2">Zone {cp.zone}</span></button>
                        <button onClick={() => handleMoveChoice(1)} className={`py-8 rounded-2xl flex flex-col items-center justify-center ${cp.zone === 3 ? 'bg-slate-800 opacity-20 pointer-events-none' : 'bg-blue-600'}`}><span className="text-3xl">➡️</span><span className="text-[8px] font-black uppercase mt-2">Zone {cp.zone + 2}</span></button>
                    </div><button onClick={() => setActiveMoveChoice(null)} className="mt-8 text-slate-500 font-black uppercase text-[10px]">Cancel Movement</button></div></div>
            )}
            {gameState === 'GAMEOVER' && (
                <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center p-10 text-center"><h2 className="text-6xl font-black text-red-600 italic mb-4 leading-tight">SLAIN</h2><p className="text-slate-400 mb-8 uppercase tracking-widest text-[10px]">The party has fallen in the vanguard zones.</p><button onClick={() => window.location.reload()} className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-2xl">Reawaken</button></div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
