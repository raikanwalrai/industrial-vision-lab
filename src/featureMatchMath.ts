import type {
  SiftDescriptor,
  SiftKeypoint,
} from "./siftMath";

export type DescriptorDistance = {
  indexA: number;
  indexB: number;
  squaredDifferences: number[];
  distance: number;
};

export type MatchCandidate = {
  indexA: number;
  nearestIndex: number;
  secondNearestIndex: number;
  nearestDistance: number;
  secondNearestDistance: number;
  ratio: number;
};

export type FeatureMatch = MatchCandidate & {
  accepted: boolean;
};

export function descriptorEuclideanDistance(
  a: SiftDescriptor,
  b: SiftDescriptor,
  indexA = -1,
  indexB = -1,
): DescriptorDistance {
  if (a.values.length !== b.values.length) {
    throw new Error(
      "SIFT descriptors must have the same dimension.",
    );
  }

  const squaredDifferences = a.values.map(
    (value, index) => {
      const difference =
        value - b.values[index];

      return difference * difference;
    },
  );

  const distance = Math.sqrt(
    squaredDifferences.reduce(
      (sum, value) => sum + value,
      0,
    ),
  );

  return {
    indexA,
    indexB,
    squaredDifferences,
    distance,
  };
}

export function findNearestDescriptors(
  source: SiftDescriptor[],
  target: SiftDescriptor[],
): MatchCandidate[] {
  return source.map((descriptor, indexA) => {
    const candidates = target
      .map((candidate, indexB) => ({
        indexB,
        distance:
          descriptorEuclideanDistance(
            descriptor,
            candidate,
          ).distance,
      }))
      .sort(
        (a, b) =>
          a.distance - b.distance,
      );

    const nearest =
      candidates[0] ?? {
        indexB: -1,
        distance: Infinity,
      };

    const second =
      candidates[1] ?? {
        indexB: -1,
        distance: Infinity,
      };

    const ratio =
      second.distance > 0 &&
      Number.isFinite(second.distance)
        ? nearest.distance /
          second.distance
        : 0;

    return {
      indexA,
      nearestIndex: nearest.indexB,
      secondNearestIndex:
        second.indexB,
      nearestDistance:
        nearest.distance,
      secondNearestDistance:
        second.distance,
      ratio,
    };
  });
}

export function applyRatioTest(
  candidates: MatchCandidate[],
  threshold = 0.75,
): FeatureMatch[] {
  return candidates.map(
    (candidate) => ({
      ...candidate,
      accepted:
        candidate.ratio <
        threshold,
    }),
  );
}

export function verifyDescriptorDistance(
  a: SiftDescriptor,
  b: SiftDescriptor,
): boolean {
  const result =
    descriptorEuclideanDistance(a, b);

  const expected = Math.sqrt(
    result.squaredDifferences.reduce(
      (sum, value) => sum + value,
      0,
    ),
  );

  return Math.abs(
    expected - result.distance,
  ) < 1e-10;
}

export function verifyRatio(
  nearestDistance: number,
  secondNearestDistance: number,
  ratio: number,
): boolean {
  if (
    !Number.isFinite(
      secondNearestDistance,
    ) ||
    secondNearestDistance === 0
  ) {
    return ratio === 0;
  }

  return (
    Math.abs(
      ratio -
        nearestDistance /
          secondNearestDistance,
    ) < 1e-10
  );
}

export type MatchVisualization = {
  source: SiftKeypoint;
  target: SiftKeypoint;
  match: FeatureMatch;
};

export function makeMatchVisualization(
  sourceKeypoints: SiftKeypoint[],
  targetKeypoints: SiftKeypoint[],
  matches: FeatureMatch[],
): MatchVisualization[] {
  return matches
    .filter(
      (match) =>
        match.accepted &&
        match.nearestIndex >= 0 &&
        match.nearestIndex <
          targetKeypoints.length &&
        match.indexA >= 0 &&
        match.indexA <
          sourceKeypoints.length,
    )
    .map((match) => ({
      source:
        sourceKeypoints[match.indexA],
      target:
        targetKeypoints[
          match.nearestIndex
        ],
      match,
    }));
}
