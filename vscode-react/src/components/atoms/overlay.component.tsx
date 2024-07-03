type OverlayProps = {
	onOverlayClick?: () => void;
	isVisibile: boolean;
	className?: string;
};
export const Overlay = ({ onOverlayClick = () => {}, isVisibile, className }: OverlayProps) =>
	isVisibile && (
		<div
			className={`absolute h-screen w-screen top-0 left-0 bg-black opacity-50 z-50 ${className}`}
			onClick={(event) => {
				event.stopPropagation();
				onOverlayClick();
			}}
		></div>
	);
