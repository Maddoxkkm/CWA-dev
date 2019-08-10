export function eqSet<T = any>(as: Set<T>, bs: Set<T>) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

export function sleep(ms: number): Promise<any> {
    return new Promise(res => setTimeout(res, ms))
}