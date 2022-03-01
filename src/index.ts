import Stats from "stats.js";
import { SupportedModels, createDetector, Keypoint } from "@tensorflow-models/hand-pose-detection"
import { estimateFolds } from "./hand";
const { MediaPipeHands } = SupportedModels

const stats = new Stats()
document.body.appendChild(stats.dom)

const EMOJI_MAP: { [name: string]: string } = {
  0b00000: "🖐",
  0b11001: "✌",
  0b00010: "☝",
  0b11110: "👍",
  0b11100: "🔫",
  0b11111: "✊",
}


async function main() {
  const detector = await createDetector(MediaPipeHands, {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1635986972/",
  })
  const container = document.querySelector(".container")!
  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  mainCanvas.style.transform = "scale(-1, 1)"
  container.appendChild(mainCanvas)

  const emoji = document.createElement("div")
  emoji.style.position = "absolute"
  emoji.style.top = "0"
  emoji.style.right = "0"
  emoji.style.color = "white"
  emoji.style.fontSize = "100px"
  container.appendChild(emoji)

  const cameraVideo = document.createElement("video");
  const cameraCanvas = document.createElement("canvas")
  const cameraContext = cameraCanvas.getContext("2d")

  if (!cameraContext) {
    throw new Error("no video context")
  }
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 960,
        },
        height: {
          ideal: 540,
        }
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  async function process() {
    if (!cameraContext) {
      throw new Error("no video context")
    }
    if (!mainContext) {
      throw new Error("no main context")
    }
    stats.begin()

    cameraContext.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height)
    const hands = await detector.estimateHands(cameraCanvas)
    if (hands.length > 0) {
      const hand = hands[0]
      const { keypoints3D: kp3 } = hand
      if (kp3) {
        const folds = estimateFolds(kp3)
        console.log(folds.thumb, folds.index, folds.middle, folds.ring, folds.pinky)
        const bits = (folds.thumb ? 1 : 0) | (folds.index ? 2 : 0) | (folds.middle ? 4 : 0) | (folds.ring ? 8 : 0) | (folds.pinky ? 16 : 0)
        console.log(bits)
        console.log(EMOJI_MAP)
        emoji.textContent = EMOJI_MAP[bits] || ""
      }
    }
    mainContext.drawImage(cameraVideo, 0, 0, mainCanvas.width, mainCanvas.height)
    stats.end()
    requestAnimationFrame(process)
  }
  cameraVideo.addEventListener("playing", () => {
    const vw = cameraVideo.videoWidth
    const vh = cameraVideo.videoHeight
    mainCanvas.width = vw
    mainCanvas.height = vh
    mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`
    cameraCanvas.width = vw
    cameraCanvas.height = vh
    requestAnimationFrame(process)
  })
}

main()