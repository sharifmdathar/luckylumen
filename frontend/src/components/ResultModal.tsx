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
    <div className="fixed inset-0 ll-overlay flex items-center justify-center p-4 z-50">
      <div className="ll-panel ll-ticket-corner p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 ll-btn ll-btn-secondary p-2"
          aria-label="Close result modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {result.won ? (
            <>
              <Trophy className="w-16 h-16 text-[var(--ll-secondary)] mx-auto mb-4" />
              <h2 className="text-3xl font-black text-[var(--ll-success)] mb-2">You Won!</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4 text-[var(--ll-error)]">X</div>
              <h2 className="text-3xl font-black text-[var(--ll-error)] mb-2">Not This Time</h2>
            </>
          )}

          <div className="my-6 flex justify-center">
            <Dice value={result.actualRoll} />
          </div>

          <div className="space-y-2 text-[var(--ll-neutral-100)]">
            <p>You predicted: <span className="font-bold">{result.prediction}</span></p>
            <p>Actual roll: <span className="font-bold">{result.actualRoll}</span></p>
            {result.won && (
              <p className="text-2xl font-bold text-[var(--ll-success)] mt-4">
                +{result.payout} LUCKY
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 ll-btn ll-btn-primary w-full py-3 font-bold"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
