import { useState } from 'react';
import { Coins } from 'lucide-react';

type BetPanelProps = {
  onPlay: (betAmount: number, prediction: number) => void;
  balance: number;
  isPlaying: boolean;
};

const BetPanel = ({ onPlay, balance, isPlaying }: BetPanelProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState(1);

  const handlePlay = () => {
    if (betAmount > balance) {
      alert('Insufficient balance!');
      return;
    }
    onPlay(betAmount, prediction);
  };

  return (
    <div className="ll-panel ll-ticket-corner p-5 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[var(--ll-neutral-100)] tracking-tight">Place Your Bet</h2>
        <div className="ll-chip">
          <Coins className="w-5 h-5 text-[var(--ll-secondary)]" />
          <span className="font-bold text-[var(--ll-neutral-100)]">{balance.toFixed(2)} LUCKY</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[var(--ll-neutral-100)] mb-2">Bet Amount</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min="1"
            max={balance}
            className="ll-input"
            disabled={isPlaying}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ll-neutral-100)] mb-3">Pick Your Number</label>
          <div className="grid grid-cols-6 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setPrediction(num)}
                data-active={prediction === num}
                className="ll-number-btn"
                disabled={isPlaying}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="ll-btn ll-btn-primary w-full py-4 text-lg"
        >
          {isPlaying ? 'Rolling...' : 'Roll the Dice!'}
        </button>

        {prediction && (
          <div className="text-center text-sm text-[var(--ll-neutral-300)]">
            Win 5x your bet if you roll a {prediction}!
          </div>
        )}
      </div>
    </div>
  );
};

export default BetPanel;
