import { EXPONENTIAL_RETRY_COUNTDOWN_MULTIPLIER, INITIAL_RETRY_SCHEDULE_COUNTDOWN } from "@constants";
import moment from "moment";

export class RetrySchedulerController {
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
		}, 1000);
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
				this.countdownDuration *= EXPONENTIAL_RETRY_COUNTDOWN_MULTIPLIER;
				this.startFetchInterval();
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
		this.countdownDuration = INITIAL_RETRY_SCHEDULE_COUNTDOWN;
		this.countdown = this.countdownDuration;
		this.startFetchInterval();
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
