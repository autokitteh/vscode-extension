import { EXPONENTIAL_RETRY_COUNTDOWN_MULTIPLIER } from "@constants";
import moment from "moment";

export class RetrySchedulerController {
	private countdown: number;
	private currentCountdownDuration: number;
	private countdownTimerId?: NodeJS.Timeout;
	private fetchIntervalId?: NodeJS.Timeout;
	private initialDuration: number;
	private startTime: Date;
	private hourlyRetryStarted: boolean = false;
	private fetchFunction: () => Promise<void>;
	private updateViewFunction: (countdown: string) => void;

	constructor(
		initialDuration: number,
		fetchFunction: () => Promise<void>,
		updateViewFunction: (countdown: string) => void
	) {
		this.currentCountdownDuration = initialDuration;
		this.initialDuration = initialDuration;
		this.countdown = this.currentCountdownDuration;
		this.fetchFunction = fetchFunction;
		this.updateViewFunction = updateViewFunction;
		this.startTime = new Date();
	}

	public async startFetchInterval() {
		this.stopFetchInterval();
		this.fetchIntervalId = setInterval(async () => {
			await this.fetchFunction();
		}, 1000);
	}

	public startCountdown() {
		this.stopTimers();
		this.countdown = this.currentCountdownDuration;

		this.countdownTimerId = setInterval(() => {
			this.updateViewFunction(this.formatCountdown(this.countdown));
			this.countdown--;

			if (this.countdown <= 0) {
				clearInterval(this.countdownTimerId);
				this.countdownTimerId = undefined;

				const currentTime = new Date();
				const elapsedTime = (currentTime.getTime() - this.startTime.getTime()) / 1000;

				if (!this.hourlyRetryStarted && elapsedTime >= 3600) {
					this.hourlyRetryStarted = true;
					this.currentCountdownDuration = 3600;
				}

				if (this.hourlyRetryStarted) {
					this.startFetchInterval();
				} else {
					this.currentCountdownDuration *= EXPONENTIAL_RETRY_COUNTDOWN_MULTIPLIER;
					this.startFetchInterval();
				}
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
		this.currentCountdownDuration = this.initialDuration;
		this.countdown = this.currentCountdownDuration;
		this.startTime = new Date();
		this.hourlyRetryStarted = false;
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
