const SUPPORTED_3D_EXTENSIONS = Object.freeze([
  '.glb',
  '.gltf',
  '.usdz',
]) as readonly string[];

const SUPPORTED_AUDIO_EXTENSIONS = Object.freeze(['.mp3']) as readonly string[];

const SUPPORTED_VIDEO_EXTENSIONS = Object.freeze(['.mp4']) as readonly string[];

export default Object.freeze({
  SUPPORTED_3D_EXTENSIONS,
  SUPPORTED_AUDIO_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
});
