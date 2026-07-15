import bodymapFrontImg from '../../../imports/bodymap_front.png';

export function BodymapDemo() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <img
        src={bodymapFrontImg}
        alt="Bodymap — front view, lower legs selected"
        className="w-full"
      />
    </div>
  );
}
