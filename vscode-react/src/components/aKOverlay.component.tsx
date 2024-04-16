type AKOverlayProps = {
	onOverlayClick?: () => void;
	isVisibile: boolean;
};
export const AKOverlay = ({ onOverlayClick = () => {}, isVisibile }: AKOverlayProps) =>
	isVisibile && (
		<div
			className="absolute h-screen w-screen top-0 left-0 bg-black opacity-60 z-50"
			onClick={() => onOverlayClick()}
		></div>
	);
