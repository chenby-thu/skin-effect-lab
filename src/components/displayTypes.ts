export type ViewMode = "full" | "surface" | "both";
export type ScaleMode = "linear" | "log";
export type AmplitudeMode = "absolute" | "normalized";
export type SurfaceSide = "left" | "right" | "both";

export type DisplayOptions = {
  viewMode: ViewMode;
  scaleMode: ScaleMode;
  amplitudeMode: AmplitudeMode;
  surfaceSide: SurfaceSide;
};
