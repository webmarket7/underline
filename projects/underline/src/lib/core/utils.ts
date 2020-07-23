export function diffObj<T>(curr, last): Partial<T> | null {
    const difference: Partial<T> = {};
    let diffLen = 0;

    for (const key in curr) {
        if (curr.hasOwnProperty(key) && last.hasOwnProperty(key)) {
            const currValue = curr[key];
            const lastValue = last[key];

            if (currValue !== lastValue) {
                difference[key] = currValue;
                diffLen++;
            }
        }
    }

    return diffLen ? difference : null;
}

export function hasAnyKey<T>(obj: Partial<T>, keys: Array<keyof T>): boolean {
    for (let i = 0, len = keys.length; i < len; i++) {
        if (keys[i] in obj) {
            return true;
        }
    }

    return false;
}

export function percentageAsDecimal(percentage: number): number {
    return percentage / 100;
}

export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}
