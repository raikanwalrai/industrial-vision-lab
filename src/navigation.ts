export type SprintStatus = "complete" | "current" | "planned";

export type Sprint = {
  number: number;
  title: string;
  status: SprintStatus;
};

export const curriculum: Sprint[] = [
  { number: 1, title: "Filter Zoo", status: "complete" },
  { number: 2, title: "Filter Mathematics", status: "complete" },
  { number: 3, title: "Interactive Convolution", status: "complete" },
  { number: 4, title: "Custom Kernels + Enhancement", status: "complete" },
  { number: 5, title: "Noise + Restoration + Illumination", status: "complete" },
  { number: 6, title: "Colour + Image Formation", status: "complete" },
  { number: 7, title: "Derivatives + Edges + Scale", status: "complete" },
  { number: 8, title: "Corners + Blobs + SIFT", status: "current" },
  { number: 9, title: "Texture + Grouping + Model Fitting", status: "planned" },
  { number: 10, title: "Camera Models + Calibration", status: "planned" },
  { number: 11, title: "Single-view + Stereo + Epipolar Geometry", status: "planned" },
  { number: 12, title: "Multi-view + SfM + Registration", status: "planned" },
  { number: 13, title: "Optical Flow + Motion + Tracking", status: "planned" },
  { number: 14, title: "Segmentation + Shapes + Range Data", status: "planned" },
  { number: 15, title: "CNNs + Learned Feature Maps", status: "planned" },
  { number: 16, title: "Object Detection + Deep Segmentation", status: "planned" },
  { number: 17, title: "Modern Recognition + Vision Models", status: "planned" },
  { number: 18, title: "Depth + 3D Reconstruction + SLAM", status: "planned" },
  { number: 19, title: "NeRF + Neural 3D Rendering", status: "planned" },
  { number: 20, title: "3D Human Pose + Industrial Capstone", status: "planned" },
  { number: 21, title: "Learning Platform + Research Evaluation", status: "planned" },
];

export function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
