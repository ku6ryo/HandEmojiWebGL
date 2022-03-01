import { Keypoint } from "@tensorflow-models/hand-pose-detection"
import { Vector3 } from "./Vector3";

function createVector(v0: Keypoint, v1: Keypoint) {
  return new Vector3(v1.x - v0.x, v1.y - v0.y, (v1.z || 0) - (v0.z || 0));
}

export function isFolded(keypoints: Keypoint[]) {
  const v0 = createVector(keypoints[0], keypoints[1]).normalize();
  const v1 = createVector(keypoints[2], keypoints[3]).normalize();
  const cos = v0.dot(v1);
  return cos < -0.3;
}

export function isThumbFolded(keypoints: Keypoint[]) {
  const v0 = createVector(keypoints[0], keypoints[1]).normalize();
  const v1 = createVector(keypoints[2], keypoints[3]).normalize();
  const cos = v0.dot(v1);
  return cos < 0;
}

export function estimateFolds(keypoints: Keypoint[]) {
  const thumb = isThumbFolded(keypoints.slice(1, 5));
  const index = isFolded(keypoints.slice(5, 9));
  const middle = isFolded(keypoints.slice(9, 13));
  const ring = isFolded(keypoints.slice(13, 17));
  const pinky = isFolded(keypoints.slice(17, 21));
  return {
    thumb,
    index,
    middle,
    ring,
    pinky,
  }
}