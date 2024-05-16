import moment from "moment";

export class RetryHandler {
	private countdown: number;
	private countdownDuration: number;
	private countdownTimerId?: NodeJS.Timeout;
	private fetchIntervalId?: NodeJS.Timeout;
	private fetchFunction: () => Promise<void>;
	private updateViewFunction: (countdown: string) => void;

	constructor(
		initialDuration: number,
		fetchFunction: () => Promise<void>,
		updateViewFunction: (countdown: string) => void
	) {
		this.countdownDuration = initialDuration;
		this.countdown = this.countdownDuration;
		this.fetchFunction = fetchFunction;
		this.updateViewFunction = updateViewFunction;
	}

	public async startFetchInterval() {
		this.stopFetchInterval();
		this.fetchIntervalId = setInterval(async () => {
			await this.fetchFunction();
		}, 1000); // Fetch every second
	}

	public startCountdown() {
		this.stopTimers();
		this.countdown = this.countdownDuration;

		this.countdownTimerId = setInterval(() => {
			this.updateViewFunction(this.formatCountdown(this.countdown));
			this.countdown--;

			if (this.countdown <= 0) {
				clearInterval(this.countdownTimerId);
				this.countdownTimerId = undefined;
				this.countdownDuration *= 2; // Double the countdown duration for the next retry
				this.startFetchInterval(); // Retry fetching projects
			}
		}, 1000);
	}

	public formatCountdown(seconds: number): string {
		const duration = moment.duration(seconds, "seconds");
		if (duration.hours() > 0) {
			return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
		} else if (duration.minutes() > 0) {
			return `${duration.minutes()}m ${duration.seconds()}s`;
		} else {
			return `${duration.seconds()}s`;
		}
	}

	public resetCountdown() {
		if (this.countdownTimerId) {
			clearInterval(this.countdownTimerId);
			this.countdownTimerId = undefined;
		}
		this.countdownDuration = 60; // Reset the countdown duration
		this.countdown = this.countdownDuration;
		this.startFetchInterval(); // Resume regular fetching
	}

	public stopTimers() {
		this.stopFetchInterval();
		if (this.countdownTimerId) {
			clearInterval(this.countdownTimerId);
			this.countdownTimerId = undefined;
		}
	}

	private stopFetchInterval() {
		if (this.fetchIntervalId) {
			clearInterval(this.fetchIntervalId);
			this.fetchIntervalId = undefined;
		}
	}
}
