import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Coffee,
  Sparkles,
  Layers,
  Subtitles,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  FORMAL_VIDEO_SCENES,
  FORMAL_VOCABULARY_LIST,
  VideoScene,
  VocabularyItem,
} from '../data/vocabulary';
import { drawSceneToCanvas, exportVideoFile, RenderProgress } from '../utils/videoExporter';
import { speechService, ambientAudio } from '../utils/speech';

interface VideoPlayerProps {
  imageSrc: string;
  onSelectWord: (word: VocabularyItem) => void;
  externalSeekTime?: number | null;
  scenes?: VideoScene[];
  vocabularyList?: VocabularyItem[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  imageSrc,
  onSelectWord,
  externalSeekTime,
  scenes = FORMAL_VIDEO_SCENES,
  vocabularyList = FORMAL_VOCABULARY_LIST,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const currentSceneIdRef = useRef<number>(1);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderFrame(currentTime);
    };
  }, [imageSrc]);

  // Handle external seek requests
  useEffect(() => {
    if (externalSeekTime !== undefined && externalSeekTime !== null) {
      setCurrentTime(externalSeekTime);
      renderFrame(externalSeekTime);
      setIsPlaying(false);
    }
  }, [externalSeekTime]);

  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width || 800;
      const displayHeight = rect.height || 450;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      drawSceneToCanvas(ctx, img, time, displayWidth, displayHeight, {
        showLabels,
        showSubtitles,
        showVignette: true,
        scenes,
        vocabularyList,
      });

      ctx.restore();
    },
    [showLabels, showSubtitles, scenes, vocabularyList]
  );

  // Animation Loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSeconds * playbackSpeed;
          if (next >= 30) {
            return 0; // Loop video tour
          }
          return next;
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Re-render when time changes
  useEffect(() => {
    renderFrame(currentTime);

    // Audio narration when entering new scene
    const scene = scenes.find((s) => currentTime >= s.startTime && currentTime < s.endTime);
    if (scene && scene.id !== currentSceneIdRef.current) {
      currentSceneIdRef.current = scene.id;
      if (!isMuted && isPlaying) {
        speechService.speak(scene.narration, { rate: 0.95 });
      }
    }
  }, [currentTime, renderFrame, isMuted, isPlaying, scenes]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      speechService.stop();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    renderFrame(newTime);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    speechService.setMuted(nextMuted);
  };

  const handleToggleAmbient = () => {
    const active = ambientAudio.toggle();
    setIsAmbientOn(active);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  const handleExportVideo = async () => {
    try {
      setIsExporting(true);
      setIsPlaying(false);
      speechService.stop();

      const result = await exportVideoFile(
        imageSrc,
        (progress) => setExportProgress(progress),
        scenes,
        vocabularyList
      );

      setDownloadUrl(result.url);
      setDownloadFilename(result.filename);
    } catch (err) {
      console.error('Failed to export video:', err);
      alert('Video export could not complete. You can still play the video in real-time above.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentScene =
    scenes.find((s) => currentTime >= s.startTime && currentTime < s.endTime) || scenes[0];

  const activeWordsInScene = vocabularyList.filter((w) =>
    currentScene.featuredWordIds.includes(w.id)
  );

  return (
    <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Video Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-white">
            Formal Table Setting • Cinematic Video Tour
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Image Converted to Video
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cafe Ambience Toggle */}
          <button
            onClick={handleToggleAmbient}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition ${
              isAmbientOn
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle soothing background restaurant audio"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restaurant Ambience</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900/50">
              {isAmbientOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Export Video Button */}
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg shadow transition"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating MP4...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Video File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group select-none"
      >
        <canvas
          ref={canvasRef}
          onClick={handleTogglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Floating Quick Action Overlay when paused */}
        {!isPlaying && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 transition transform">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <p className="mt-3 text-white text-sm font-medium tracking-wide">
              Click to Resume Video Tour
            </p>
          </div>
        )}

        {/* Export Progress Modal */}
        {isExporting && exportProgress && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 mb-4 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center">
              <span className="text-xs font-bold text-amber-400">
                {exportProgress.progress}%
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">
              Rendering Video from Table Setting Image
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Synthesizing smooth cinematic zooms on silverware, plates, stemware, and English vocabulary labels...
            </p>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${exportProgress.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-amber-300">
              Frame {exportProgress.currentFrame} / {exportProgress.totalFrames} •{' '}
              {exportProgress.sceneTitle}
            </span>
          </div>
        )}

        {/* Export Ready Modal */}
        {downloadUrl && !isExporting && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h4 className="text-xl font-bold text-white mb-1">Video Ready for Download!</h4>
            <p className="text-xs text-slate-300 max-w-md mb-6">
              Your formal table setting image has been converted into a high-definition motion video with
              English dining vocabulary callouts.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition"
              >
                <Download className="w-4 h-4" />
                Download {downloadFilename.endsWith('.mp4') ? 'MP4' : 'Video'} File
              </a>
              <button
                onClick={() => setDownloadUrl(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition"
              >
                Close & Keep Watching
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Controls & Timeline Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col gap-3">
        {/* Timeline Slider with Scene Tick Marks */}
        <div className="relative flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-none transition"
          />
          {/* Scene Marker Labels */}
          <div className="flex justify-between text-[10px] text-slate-500 font-medium px-0.5">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => {
                  setCurrentTime(scene.startTime);
                  renderFrame(scene.startTime);
                }}
                className={`hover:text-amber-400 transition text-left ${
                  currentTime >= scene.startTime && currentTime < scene.endTime
                    ? 'text-amber-400 font-semibold'
                    : ''
                }`}
              >
                {scene.startTime}s {scene.title.split(':')[1]?.trim() || scene.title}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition font-bold"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setCurrentTime(0);
                renderFrame(0);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              {[0.5, 1, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 text-xs rounded font-medium transition ${
                    playbackSpeed === speed
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Time readout */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 ml-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {String(Math.floor(currentTime)).padStart(2, '0')}:
                {String(Math.floor((currentTime % 1) * 100)).padStart(2, '0')} / 00:30
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Audio Voice Narration */}
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-lg border transition ${
                !isMuted
                  ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={isMuted ? 'Unmute English Narration' : 'Mute English Narration'}
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Word Labels Overlay */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                showLabels
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Toggle floating English word pins"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Word Pins</span>
            </button>

            {/* Subtitles */}
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                showSubtitles
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Toggle English narration captions"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subtitles</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Words Currently on Screen Bar */}
      <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Words in this shot:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {activeWordsInScene.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                onSelectWord(w);
                speechService.speak(w.word);
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 text-xs transition"
            >
              <span className="font-medium">{w.word}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-400 font-mono">
                {w.phonetic}
              </span>
              <Volume2 className="w-3 h-3 text-slate-500 group-hover:text-amber-300 opacity-60" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
