import raw from "./shots.generated.json";

export type Shot = {
  id: number;
  name: string;
  start: number;
  end: number;
  duration: number;
  fps: number;
  width: number;
  mode: "loop" | "scrub";
  src: string;
  poster: string;
};

const shots = raw as Shot[];

/** Look a shot up by the name assigned in scripts/prep-assets.mjs. */
export function shot(name: Shot["name"]): Shot {
  const s = shots.find((x) => x.name === name);
  if (!s) throw new Error(`Unknown shot: ${name}`);
  return s;
}

export default shots;
