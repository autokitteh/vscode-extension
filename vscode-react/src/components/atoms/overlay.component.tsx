type OverlayProps = {
	onOverlayClick?: () => void;
	isVisibile: boolean;
};
export const Overlay = ({ onOverlayClick = () => {}, isVisibile }: OverlayProps) =>
	isVisibile && (
		<div
			className="absolute h-screen w-screen top-0 left-0 bg-black opacity-50 z-50"
			onClick={() => onOverlayClick()}
		></div>
	);
