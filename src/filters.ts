export type Kernel = {
  name: string;
  values: number[][];
  kind: string;
  description: string;

  // Educational metadata
  family: string;
  whatIsIt: string;
  whatDoesItLookFor: string;
  whatDoesItDo: string;
  mathematicalIdea: string;
  whatShouldISee: string;
  recommendedScene: string;
  experiment: string;
};

export const K = (
  name: string,
  values: number[][],
  kind: string,
  description: string,
  family: string,
  whatIsIt: string,
  whatDoesItLookFor: string,
  whatDoesItDo: string,
  mathematicalIdea: string,
  whatShouldISee: string,
  recommendedScene: string,
  experiment: string,
): Kernel => ({
  name,
  values,
  kind,
  description,
  family,
  whatIsIt,
  whatDoesItLookFor,
  whatDoesItDo,
  mathematicalIdea,
  whatShouldISee,
  recommendedScene,
  experiment,
});

export const filters: Kernel[] = [
  K(
    "Identity",
    [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    "identity",
    "Copies the local center pixel.",
    "Identity",
    "The identity filter is a baseline filter that leaves the image unchanged.",
    "It does not look for a special pattern. It simply selects the centre pixel.",
    "It reproduces the input intensity at each location.",
    "The kernel has a 1 at the centre and 0 everywhere else. Its kernel sum is 1.",
    "The output should look the same as the input.",
    "Constant image",
    "Apply it to several scenes. Does anything change?",
  ),

  K(
    "Box 3×3",
    Array.from({ length: 3 }, () => Array(3).fill(1 / 9)),
    "smoothing",
    "Uniform local average.",
    "Smoothing",
    "The box filter is a simple averaging filter.",
    "It looks at all pixels in a local 3×3 neighbourhood with equal weight.",
    "It replaces the centre value with the local average, reducing small variations.",
    "Every coefficient is 1/9, so the nine pixels contribute equally and the kernel sum is 1.",
    "The image should become slightly smoother and small details should be softened.",
    "Noisy shapes",
    "Compare the original image with the Box 3×3 result. What small variations disappear?",
  ),

  K(
    "Box 9×9",
    Array.from({ length: 9 }, () => Array(9).fill(1 / 81)),
    "smoothing",
    "Larger uniform average; stronger blur.",
    "Smoothing",
    "The Box 9×9 filter is a larger averaging filter.",
    "It looks at a much larger neighbourhood and gives every pixel equal weight.",
    "It produces stronger smoothing and removes more local detail than Box 3×3.",
    "All 81 coefficients are 1/81, so the kernel sum is 1.",
    "The image should look noticeably blurrier, with fine structures reduced.",
    "Checkerboard",
    "Compare Box 3×3 and Box 9×9. How does neighbourhood size affect detail?",
  ),

  K(
    "Gaussian σ≈1",
    [[1, 2, 1], [2, 4, 2], [1, 2, 1]].map((r) => r.map((v) => v / 16)),
    "smoothing",
    "Weighted smoothing; centre gets more weight.",
    "Smoothing",
    "The Gaussian filter is a weighted smoothing filter.",
    "It looks at nearby pixels but gives greater weight to pixels near the centre.",
    "It smooths local variation while generally preserving structure better than a uniform average of similar size.",
    "The kernel is normalized so its coefficients sum to 1. The centre coefficient has the largest weight.",
    "The image should become smoother, while important structures can remain more recognizable than with a large uniform average.",
    "Noisy shapes",
    "Compare Gaussian smoothing with Box 3×3. What difference do you notice around edges?",
  ),

  K(
    "Sobel X",
    [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
    "first derivative",
    "First derivative in x with perpendicular smoothing.",
    "First derivative",
    "Sobel X is a directional first-derivative filter.",
    "It looks for intensity changes along the x direction.",
    "It produces strong responses where the image intensity changes horizontally, especially around vertical edges.",
    "It approximates ∂I/∂x using a central difference with extra weighting in the perpendicular direction.",
    "Vertical edges should produce strong responses. Flat regions should produce responses near zero.",
    "Step edge",
    "Compare Sobel X and Sobel Y on the step edge. Which one responds strongly?",
  ),

  K(
    "Sobel Y",
    [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
    "first derivative",
    "First derivative in y with perpendicular smoothing.",
    "First derivative",
    "Sobel Y is a directional first-derivative filter.",
    "It looks for intensity changes along the y direction.",
    "It produces strong responses where the image intensity changes vertically, especially around horizontal edges.",
    "It approximates ∂I/∂y using a central difference with extra weighting in the perpendicular direction.",
    "Horizontal edges should produce strong responses. Flat regions should produce responses near zero.",
    "Step edge",
    "Rotate or change the scene orientation. How does the response of Sobel Y change?",
  ),

  K(
    "Prewitt X",
    [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
    "first derivative",
    "Simple first derivative in x.",
    "First derivative",
    "Prewitt X is a simple directional first-derivative filter.",
    "It looks for intensity changes along the x direction.",
    "It highlights edges where intensity changes horizontally.",
    "It approximates ∂I/∂x using equal weighting in the perpendicular direction.",
    "Vertical edges should stand out in the response.",
    "Step edge",
    "Compare Prewitt X with Sobel X. What is similar and what is different?",
  ),

  K(
    "Prewitt Y",
    [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    "first derivative",
    "Simple first derivative in y.",
    "First derivative",
    "Prewitt Y is a simple directional first-derivative filter.",
    "It looks for intensity changes along the y direction.",
    "It highlights edges where intensity changes vertically.",
    "It approximates ∂I/∂y using equal weighting in the perpendicular direction.",
    "Horizontal edges should stand out in the response.",
    "Step edge",
    "Compare Prewitt Y with Sobel Y. How does the weighting differ?",
  ),

  K(
    "Second derivative X",
    [[0, 0, 0], [1, -2, 1], [0, 0, 0]],
    "second derivative",
    "Approximation to ∂²/∂x².",
    "Second derivative",
    "This filter approximates the second derivative in the x direction.",
    "It looks for changes in the slope of intensity along x.",
    "It responds strongly to rapid changes in the first derivative and can highlight curvature or transitions.",
    "The centre coefficient is -2 and the two horizontal neighbours have coefficient +1.",
    "A smooth ramp should produce a small response, while changes in slope should produce stronger responses.",
    "Ramp",
    "Compare the first derivative and second derivative on a ramp. What changes?",
  ),

  K(
    "Second derivative Y",
    [[0, 1, 0], [0, -2, 0], [0, 1, 0]],
    "second derivative",
    "Approximation to ∂²/∂y².",
    "Second derivative",
    "This filter approximates the second derivative in the y direction.",
    "It looks for changes in the slope of intensity along y.",
    "It highlights curvature and changes in vertical intensity slope.",
    "The centre coefficient is -2 and the two vertical neighbours have coefficient +1.",
    "Regions with constant slope should have small responses; curvature and transitions should stand out.",
    "Ramp",
    "Compare Second derivative Y with the corresponding first derivative.",
  ),

  K(
    "Laplacian 4-neighbour",
    [[0, 1, 0], [1, -4, 1], [0, 1, 0]],
    "second derivative",
    "Sum of x and y second derivatives.",
    "Second derivative",
    "The 4-neighbour Laplacian combines second derivatives in the x and y directions.",
    "It responds to local curvature and intensity differences in multiple directions.",
    "It highlights regions where the centre pixel differs from its immediate neighbours.",
    "∇²I ≈ I_left + I_right + I_top + I_bottom - 4I_centre.",
    "Flat regions should be near zero. Bright or dark structures surrounded by different intensities produce positive or negative responses depending on the sign convention.",
    "Corner",
    "Inspect the centre pixel and its four neighbours. Does the Laplacian response match the local intensity relationship?",
  ),

  K(
    "Laplacian 8-neighbour",
    [[1, 1, 1], [1, -8, 1], [1, 1, 1]],
    "second derivative",
    "Eight-neighbour high-pass curvature response.",
    "Second derivative",
    "The 8-neighbour Laplacian uses all eight surrounding pixels.",
    "It responds to local intensity curvature using a larger directional neighbourhood.",
    "It emphasizes rapid local changes and high-frequency structure.",
    "The centre has weight -8 while all eight neighbours have weight +1, giving a kernel sum of 0.",
    "Flat regions should produce responses near zero, while strong local intensity differences produce larger responses.",
    "Checkerboard",
    "Compare the 4-neighbour and 8-neighbour Laplacians on high-frequency structure.",
  ),

  K(
    "Sharpen",
    [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    "sharpening",
    "Enhances local detail while preserving the DC component.",
    "Enhancement",
    "The sharpening kernel increases the importance of the centre pixel relative to its neighbours.",
    "It responds to local differences between the centre and surrounding pixels.",
    "It strengthens local detail and makes edges appear more pronounced.",
    "The kernel sum is 1, so a constant image is preserved. Negative neighbour weights increase local contrast.",
    "Edges and fine structures should appear stronger than in the original image.",
    "Synthetic scene",
    "Compare the original and sharpened images. Which structures become more prominent?",
  ),

  K(
    "LoG-like",
    [[0, 0, -1, 0, 0], [0, -1, -2, -1, 0], [-1, -2, 16, -2, -1], [0, -1, -2, -1, 0], [0, 0, -1, 0, 0]],
    "second derivative",
    "Sampled Laplacian-of-Gaussian-like kernel.",
    "Second derivative",
    "This is a Laplacian-of-Gaussian-like high-pass kernel.",
    "It combines smoothing-like spatial weighting with a second-derivative response.",
    "It can highlight edges while reducing some sensitivity to very small-scale noise compared with a raw second derivative.",
    "Conceptually, LoG follows the sequence: smooth with a Gaussian, then apply the Laplacian.",
    "Edges and zero-crossing-like structures should become prominent.",
    "Noisy shapes",
    "Compare the LoG-like response with the Laplacian on a noisy image.",
  ),
];

export function stats(k: number[][]) {
  const flat = k.flat();
  const sum = flat.reduce((a, b) => a + b, 0);
  const sumSq = flat.reduce((a, b) => a + b * b, 0);
  return {
    sum,
    sumSq,
    noiseGain: Math.sqrt(sumSq),
    min: Math.min(...flat),
    max: Math.max(...flat),
    size: `${k.length}×${k[0].length}`,
  };
}
