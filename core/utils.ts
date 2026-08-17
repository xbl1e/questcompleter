export const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

export const jitteredDelay = (min: number, max: number): Promise<void> =>
    sleep(Math.random() * (max - min) + min);
