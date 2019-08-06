import { Request, Response, NextFunction } from "express";

export default class TryHardCounter {
    readonly catchInterval: number;
    private counter: number;
    private urlSet: Set<string>;
    private ipSet: Set<string>;

    constructor(catcherInterval: number = 86400000) {
        this.catchInterval = catcherInterval;
        this.counter = 0;
        this.urlSet = new Set();
        this.ipSet = new Set();
        setInterval(this.logAndClearCounter, this.catchInterval)
    }

    public middleware = (req: Request, res: Response, next: NextFunction): void  => {
        res.on("finish", () => {
            if (res.statusCode === 404) {
                this.counter++;
                this.urlSet.add(req.path);
                this.ipSet.add(req.ip);
            }
        })

        // Definitely need to call this
        next();
    }

    private logAndClearCounter = (): void => {
        console.log(`The number of tryhard attempts in the recent loggable period is: ${this.counter}, from ${this.ipSet.size} unique tryhards, and them tryharding on ${this.urlSet.size} different paths :D`)
        this.counter = 0;
        this.urlSet.clear();
        this.ipSet.clear();
    }
}