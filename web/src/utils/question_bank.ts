export interface BankQuestion {
    type: string;
    difficulty: number;
    prompt: string;
    answer: number;
}

export const bankQuestions: BankQuestion[] = [
    // Examples from prompt
    { type: 'arithmetic', difficulty: 0, prompt: "What is 15% of 240?", answer: 36.0 },
    { type: 'arithmetic', difficulty: 2, prompt: "Increase 80 by 12.5%.", answer: 90.0 },
    { type: 'multiplication', difficulty: 1, prompt: "What is 12 × 50?", answer: 600.0 },
    { type: 'division', difficulty: 1, prompt: "What is 250 ÷ 5?", answer: 50.0 },
    { type: 'growth_compounding', difficulty: 0, prompt: "Doubling time rule of 72 for 8%?", answer: 9.0 },
];
