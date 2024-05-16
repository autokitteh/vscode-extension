type OverlayProps = {
	onOverlayClick?: () => void;
	isVisibile: boolean;
	className?: string;
};
export const Overlay = ({ onOverlayClick = () => {}, isVisibile, className }: OverlayProps) => {
	const overlayClass = `absolute h-screen w-screen top-0 left-0 bg-black opacity-50 z-50 ${className}`;
	return isVisibile && <div className={overlayClass} onClick={() => onOverlayClick()}></div>;
};
