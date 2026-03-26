import { useEffect, useState } from 'react';
import { Wallet, Sparkles, Menu, X, ShieldCheck, History } from 'lucide-react';
import BetPanel from './components/BetPanel';
import Dice from './components/Dice';
import ResultModal from './components/ResultModal';
import { connectWallet, playDice, getTokenBalance, getConnectedWalletAddress } from './utils/stellar';

type PlayResult = {
  prediction: number;
  actualRoll: number;
  won: boolean;
  payout: number;
};

type RecentGame = {
  prediction: number;
  roll: number;
  won: boolean;
  timestamp: string;
};

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<number | null>(null);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    const address = await getConnectedWalletAddress();
    if (address) {
      setWalletAddress(address);
      const bal = await getTokenBalance(address);
      setBalance(bal);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      const bal = await getTokenBalance(address);
      setBalance(bal);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect to Freighter wallet.';
      console.error('Wallet connection error:', error);
      alert(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePlay = async (betAmount: number, prediction: number) => {
    setIsPlaying(true);
    setResult(null);

    const rollInterval = setInterval(() => {
      setCurrentRoll(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      const gameResult = await playDice(walletAddress ?? '', betAmount, prediction);

      clearInterval(rollInterval);
      setCurrentRoll(gameResult.actualRoll);

      const newBalance = gameResult.won ? balance - betAmount + gameResult.payout : balance - betAmount;
      setBalance(newBalance);

      setTimeout(() => {
        setResult({
          ...gameResult,
          prediction,
        });

        setRecentGames((prev) => [
          {
            prediction,
            roll: gameResult.actualRoll,
            won: gameResult.won,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);
      }, 500);
    } catch (error) {
      console.error('Game error:', error);
      alert('Transaction failed');
    } finally {
      clearInterval(rollInterval);
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-8 md:py-8 flex items-center">
      <div className="mx-auto w-full max-w-6xl ll-shell rounded-3xl p-4 md:p-7">
        <div className="md:hidden mb-4 ll-elevated px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--ll-secondary)]" />
              <h1 className="text-2xl font-black tracking-tight text-[var(--ll-neutral-100)]">LuckyLumen</h1>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="ll-btn ll-btn-secondary px-3 py-2"
              aria-label="Toggle menu"
            >
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {showMenu && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--ll-neutral-100)]">
              <p className="ll-chip justify-center">Balance: {balance.toFixed(2)}</p>
              <p className="ll-chip justify-center">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet'}
              </p>
            </div>
          )}
        </div>

        <header className="hidden md:flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-[var(--ll-secondary)]" />
              <h1 className="text-5xl font-black tracking-tight text-[var(--ll-neutral-100)]">LuckyLumen</h1>
            </div>
            <p className="text-[var(--ll-neutral-300)] mt-2">Roll with confidence: transparent, fair, and instant.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="ll-pill">
              <ShieldCheck className="w-4 h-4" />
              Provably Fair
            </div>
            <div className="ll-pill">
              <Wallet className="w-4 h-4" />
              {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not connected'}
            </div>
          </div>
        </header>

        {!walletAddress ? (
          <div className="ll-surface flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-[var(--ll-neutral-300)] mb-4">Connect Freighter to join the table</p>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="ll-btn ll-btn-primary px-8 py-4 rounded-2xl text-lg flex items-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <section className="ll-surface p-5 md:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[var(--ll-neutral-100)] text-2xl font-bold">Live Table</h2>
                <div className="ll-chip">Balance: {balance.toFixed(2)} LUCKY</div>
              </div>

              <div className="mt-8 flex justify-center">
                <Dice value={currentRoll} isRolling={isPlaying} />
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3 text-[var(--ll-neutral-100)]">
                  <History className="w-4 h-4 text-[var(--ll-secondary)]" />
                  <h3 className="font-semibold">Recent Rounds</h3>
                </div>
                {recentGames.length === 0 ? (
                  <p className="text-sm text-[var(--ll-neutral-300)]">No rounds yet. Roll your first dice.</p>
                ) : (
                  <div className="space-y-2">
                    {recentGames.map((game, i) => (
                      <div key={`${game.timestamp}-${i}`} className="ll-row">
                        <span className="text-[var(--ll-neutral-300)] text-xs">{game.timestamp}</span>
                        <span className="text-[var(--ll-neutral-100)] text-sm">You: {game.prediction} | Roll: {game.roll}</span>
                        <span className={game.won ? 'text-[var(--ll-success)] text-sm font-semibold' : 'text-[var(--ll-error)] text-sm font-semibold'}>
                          {game.won ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <BetPanel onPlay={handlePlay} balance={balance} isPlaying={isPlaying} />
            </section>
          </div>
        )}
      </div>

      <ResultModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

export default App;
