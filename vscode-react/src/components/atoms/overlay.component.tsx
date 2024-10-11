type OverlayProps = {
	className?: string;
	isVisibile: boolean;
	onOverlayClick?: () => void;
};
export const Overlay = ({ className, isVisibile, onOverlayClick = () => {} }: OverlayProps) =>
	isVisibile && (
		<div
			className={`absolute left-0 top-0 z-50 h-screen w-screen bg-black opacity-50 ${className}`}
			onClick={(event) => {
				event.stopPropagation();
				onOverlayClick();
			}}
		></div>
	);
