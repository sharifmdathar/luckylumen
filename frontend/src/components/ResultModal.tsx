import { Trophy, X } from 'lucide-react';
import Dice from './Dice';

type Result = {
  prediction: number;
  actualRoll: number;
  won: boolean;
  payout: number;
};

type ResultModalProps = {
  result: Result | null;
  onClose: () => void;
};

const ResultModal = ({ result, onClose }: ResultModalProps) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {result.won ? (
            <>
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-600 mb-2">You Won! 🎉</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-3xl font-bold text-red-600 mb-2">Not This Time</h2>
            </>
          )}

          <div className="my-6 flex justify-center">
            <Dice value={result.actualRoll} />
          </div>

          <div className="space-y-2 text-gray-700">
            <p>You predicted: <span className="font-bold">{result.prediction}</span></p>
            <p>Actual roll: <span className="font-bold">{result.actualRoll}</span></p>
            {result.won && (
              <p className="text-2xl font-bold text-green-600 mt-4">
                +{result.payout} LUCKY
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
