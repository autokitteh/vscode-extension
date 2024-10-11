type OverlayProps = {
	onOverlayClick?: () => void;
	isVisibile: boolean;
	className?: string;
};
export const Overlay = ({ onOverlayClick = () => {}, isVisibile, className }: OverlayProps) =>
	isVisibile && (
		<div
			className={`absolute left-0 top-0 z-50 h-screen w-screen bg-black opacity-50 ${className}`}
			onClick={(event) => {
				event.stopPropagation();
				onOverlayClick();
			}}
		></div>
	);
