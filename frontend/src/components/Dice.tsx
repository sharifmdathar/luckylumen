type DiceProps = {
  value: number | null;
  isRolling?: boolean;
};

const Dice = ({ value, isRolling = false }: DiceProps) => {
  const dots: Record<number, Array<[number, number]>> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };

  return (
    <div
      className={`
        w-32 h-32 md:w-40 md:h-40 rounded-[1.6rem]
        bg-[var(--ll-bg-card-elevated)] grid grid-cols-3 gap-2.5 p-5 md:p-6
        border border-[rgba(255,209,102,0.38)] shadow-[var(--ll-shadow-lg)]
        ${isRolling ? 'll-roll' : 'll-pop'}
      `}
    >
      {[...Array(9)].map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = value !== null && dots[value]?.some(([r, c]) => r === row && c === col);

        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && <div className="w-4 h-4 md:w-5 md:h-5 bg-[var(--ll-secondary)] rounded-full shadow-md" />}
          </div>
        );
      })}
    </div>
  );
};

export default Dice;
