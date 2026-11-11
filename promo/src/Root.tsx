import { CalculateMetadataFunction, Composition } from "remotion";
import { Promo, promoDuration } from "./Promo";
import { DIMS, FPS, Format, SiteProps } from "./types";
import sample from "./sample-props.json";

const meta: CalculateMetadataFunction<SiteProps> = ({ props }) => {
  const [width, height] = DIMS[props.format];
  return { durationInFrames: promoDuration(props, FPS), width, height };
};

const ids: Record<Format, string> = { walk: "Walkthrough", reel: "Reel", teaser: "Teaser" };

export const RemotionRoot: React.FC = () => (
  <>
    {(Object.keys(ids) as Format[]).map((f) => (
      <Composition
        key={f}
        id={ids[f]}
        component={Promo}
        fps={FPS}
        width={DIMS[f][0]}
        height={DIMS[f][1]}
        durationInFrames={300}
        defaultProps={{ ...(sample as SiteProps), format: f }}
        calculateMetadata={meta}
      />
    ))}
  </>
);
