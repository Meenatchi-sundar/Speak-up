export const calculateGDEffort = (minutes: number): number => {
  if (minutes >= 20) return 100;
  if (minutes >= 10) return 50 + ((minutes - 10) / 10) * 50;
  if (minutes >= 2) return 10 + ((minutes - 2) / 8) * 40;
  return (minutes / 2) * 10;
};

export const calculateTestEffort = (questions: number): number => {
  if (questions >= 20) return 100;
  if (questions >= 10) return 50 + ((questions - 10) / 10) * 50;
  if (questions >= 4) return 10 + ((questions - 4) / 6) * 40;
  return (questions / 4) * 10;
};
