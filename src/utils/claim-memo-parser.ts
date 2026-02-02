export const getBusinessName = (memo: string): string => {
  const regex = /adding review of a (.+?) -/;
  const match = memo.match(regex);
  if (match) {
    return match[1];
  } else {
    const regex = /adding review of (.+?) -/;
    const match = memo.match(regex);
    return match ? match[1] : '';
  }
};

export const extractPercentage = (memo: string): number => {
    const regex = /^You claimed back (\d+\.\d{2}) %/;
    const match = memo.match(regex);
    if (match) {
        return parseFloat(match[1]);
    }
    return 0.0;
}

export const extractLink = (memo: string): string => {
    const regex = /-(\s*)(https?:\/\/[^\s]+)$/;
    const match = memo.match(regex);
    return match ? match[2]?.trim() ?? '' : '';
}
