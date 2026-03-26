import React from 'react';

const Dice = ({ value, isRolling }) => {
  const dots = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };

  return (
    <div className={`
      w-24 h-24 bg-white rounded-2xl shadow-2xl 
      grid grid-cols-3 gap-2 p-4
      ${isRolling ? 'animate-spin' : ''}
    `}>
      {[...Array(9)].map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = value && dots[value]?.some(([r, c]) => r === row && c === col);
        
        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && (
              <div className="w-3 h-3 bg-purple-600 rounded-full" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Dice;
