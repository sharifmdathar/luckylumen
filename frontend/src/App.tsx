import { useEffect, useState } from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import BetPanel from './components/BetPanel';
import Dice from './components/Dice';
import ResultModal from './components/ResultModal';
import { connectWallet, playDice, getTokenBalance } from './utils/stellar';

type PlayResult = {
  actualRoll: number;
  won: boolean;
  payout: number;
  prediction: number;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<number | null>(null);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  useEffect(() => {
    // Check if wallet is already connected
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      const bal = await getTokenBalance(address);
      setBalance(bal);
    } catch {
      console.log('Wallet not connected');
    }
  };

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      const bal = await getTokenBalance(address);
      setBalance(bal);
    } catch {
      alert('Please install Freighter wallet');
    }
  };

  const handlePlay = async (betAmount: number, prediction: number) => {
    setIsPlaying(true);
    setResult(null);
    
    // Simulate rolling animation
    const rollInterval = setInterval(() => {
      setCurrentRoll(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      // Simulate network delay
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      const gameResult = await playDice(walletAddress, betAmount, prediction);
      
      clearInterval(rollInterval);
      setCurrentRoll(gameResult.actualRoll);
      
      // Update balance
      const newBalance = gameResult.won 
        ? balance - betAmount + gameResult.payout
        : balance - betAmount;
      setBalance(newBalance);
      
      // Show result
      setTimeout(() => {
        setResult({
          ...gameResult,
          prediction,
        });
        
        // Add to recent games
        setRecentGames((prev) => [{
          prediction,
          roll: gameResult.actualRoll,
          won: gameResult.won,
          timestamp: new Date().toLocaleTimeString(),
        }, ...prev.slice(0, 4)]);
      }, 500);
      
    } catch (error) {
      console.error('Game error:', error);
      alert('Transaction failed');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-12 h-12 text-yellow-300" />
          <h1 className="text-5xl font-bold text-white">LuckyLumen</h1>
        </div>
        <p className="text-white text-lg opacity-90">Provably Fair Dice on Stellar</p>
      </div>

      {/* Wallet Connection */}
      {!walletAddress ? (
        <button
          onClick={handleConnect}
          className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:shadow-2xl transition-all"
        >
          <Wallet className="w-6 h-6" />
          Connect Freighter Wallet
        </button>
      ) : (
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
          {/* Left side - Dice Display */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <Dice value={currentRoll} isRolling={isPlaying} />
            
            {/* Recent Games */}
            {recentGames.length > 0 && (
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-white font-bold mb-4">Recent Rolls</h3>
                <div className="space-y-2">
                  {recentGames.map((game) => (
                    <div key={`${game.timestamp}-${game.roll}-${game.prediction}`} className="flex items-center justify-between text-white text-sm">
                      <span>{game.timestamp}</span>
                      <span>Predicted: {game.prediction} → Rolled: {game.roll}</span>
                      <span className={game.won ? 'text-green-300' : 'text-red-300'}>
                        {game.won ? '✓ Win' : '✗ Loss'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Bet Panel */}
          <BetPanel
            onPlay={handlePlay}
            balance={balance}
            isPlaying={isPlaying}
          />
        </div>
      )}

      {/* Result Modal */}
      <ResultModal
        result={result}
        onClose={() => setResult(null)}
      />

      {/* Footer */}
      <div className="mt-12 text-center text-white text-sm opacity-75">
        <p>Built on Stellar • Provably Fair • Open Source</p>
        <p className="mt-2">
          Connected: {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not connected'}
        </p>
      </div>
    </div>
  );
}

export default App;
