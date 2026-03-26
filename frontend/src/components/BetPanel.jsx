import React, { useState } from 'react';
import { Coins } from 'lucide-react';

const BetPanel = ({ onPlay, balance, isPlaying }) => {
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
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Place Your Bet</h2>
        <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
          <Coins className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-purple-600">{balance} LUCKY</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min="1"
            max={balance}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            disabled={isPlaying}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pick Your Number
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setPrediction(num)}
                className={`
                  py-3 rounded-xl font-bold transition-all
                  ${prediction === num
                    ? 'bg-purple-600 text-white scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
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
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? 'Rolling...' : `Roll the Dice!`}
        </button>

        {prediction && (
          <div className="text-center text-sm text-gray-500">
            Win 5x your bet if you roll a {prediction}!
          </div>
        )}
      </div>
    </div>
  );
};

export default BetPanel;
