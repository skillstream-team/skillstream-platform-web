import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Settings,
  Download,
  Bookmark,
  ChevronDown,
  X,
  Gauge,
  PictureInPicture,
  Subtitles,
  SkipBack,
  SkipForward
} from 'lucide-react';

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  autoResume?: boolean;
  lessonId?: string;
  allowDownload?: boolean;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  videoUrl,
  poster,
  onTimeUpdate,
  onComplete,
  autoResume = true,
  lessonId,
  allowDownload = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const videoQualities = ['Auto', '1080p', '720p', '480p', '360p'];

  // Load saved progress
  useEffect(() => {
    if (autoResume && lessonId && videoRef.current) {
      const savedTime = localStorage.getItem(`video-progress-${lessonId}`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        videoRef.current.currentTime = time;
      }
    }
  }, [autoResume, lessonId]);

  // Save progress
  useEffect(() => {
    if (lessonId && currentTime > 0) {
      localStorage.setItem(`video-progress-${lessonId}`, currentTime.toString());
    }
  }, [currentTime, lessonId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case '>':
        case '.':
          e.preventDefault();
          increaseSpeed();
          break;
        case '<':
        case ',':
          e.preventDefault();
          decreaseSpeed();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (!isPiP) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } else {
        await document.exitPictureInPicture();
        setIsPiP(false);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  const increaseSpeed = () => {
    const currentIndex = playbackSpeeds.indexOf(playbackRate);
    if (currentIndex < playbackSpeeds.length - 1) {
      changePlaybackRate(playbackSpeeds[currentIndex + 1]);
    }
  };

  const decreaseSpeed = () => {
    const currentIndex = playbackSpeeds.indexOf(playbackRate);
    if (currentIndex > 0) {
      changePlaybackRate(playbackSpeeds[currentIndex - 1]);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const time = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(time);
      setDuration(dur);
      onTimeUpdate?.(time, dur);

      // Check if video completed
      if (dur > 0 && time >= dur - 0.5) {
        onComplete?.();
      }
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const addBookmark = () => {
    if (lessonId && currentTime > 0) {
      const bookmarks = JSON.parse(localStorage.getItem(`bookmarks-${lessonId}`) || '[]');
      bookmarks.push({
        time: currentTime,
        note: bookmarkNote,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(`bookmarks-${lessonId}`, JSON.stringify(bookmarks));
      setShowBookmarkModal(false);
      setBookmarkNote('');
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        src={videoUrl}
        poster={poster}
        onTimeUpdate={handleVideoTimeUpdate}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={() => setIsPlaying(false)}
        muted={isMuted}
        volume={volume}
        playbackRate={playbackRate}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center hover:bg-opacity-100 transition-all"
          >
            <Play className="h-10 w-10 text-black ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end">
          {/* Progress Bar */}
          <div className="px-4 pb-2">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00B5AD 0%, #00B5AD ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`
                }}
              />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayPause}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                </button>

                <button
                  onClick={() => seek(-10)}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Rewind 10s"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                <button
                  onClick={() => seek(10)}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Forward 10s"
                >
                  <SkipForward className="h-5 w-5" />
                </button>

                <div className="flex items-center space-x-2 ml-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setVolume(vol);
                      if (videoRef.current) {
                        videoRef.current.volume = vol;
                      }
                    }}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="text-sm ml-4">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-2">
                {/* Speed Control */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSettings(false);
                      setShowQualityMenu(false);
                    }}
                    className="p-2 hover:bg-white/20 rounded transition-colors flex items-center space-x-1"
                    title={`Playback Speed: ${playbackRate}x`}
                  >
                    <Gauge className="h-5 w-5" />
                    <span className="text-sm">{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2 min-w-[120px]">
                      {playbackSpeeds.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackRate(speed)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-white/20 transition-colors ${
                            playbackRate === speed ? 'bg-white/30' : ''
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitles */}
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`p-2 rounded transition-colors ${
                    showSubtitles ? 'bg-white/30' : 'hover:bg-white/20'
                  }`}
                  title="Subtitles"
                >
                  <Subtitles className="h-5 w-5" />
                </button>

                {/* Bookmark */}
                <button
                  onClick={() => setShowBookmarkModal(true)}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Add Bookmark"
                >
                  <Bookmark className="h-5 w-5" />
                </button>

                {/* Picture in Picture */}
                {document.pictureInPictureEnabled && (
                  <button
                    onClick={togglePiP}
                    className={`p-2 rounded transition-colors ${
                      isPiP ? 'bg-white/30' : 'hover:bg-white/20'
                    }`}
                    title="Picture in Picture"
                  >
                    <PictureInPicture className="h-5 w-5" />
                  </button>
                )}

                {/* Download */}
                {allowDownload && (
                  <button
                    onClick={downloadVideo}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                    title="Download Video"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {showControls && !isPlaying && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs p-3 rounded-lg space-y-1">
          <div><kbd className="px-1 py-0.5 bg-white/20 rounded">Space</kbd> Play/Pause</div>
          <div><kbd className="px-1 py-0.5 bg-white/20 rounded">←</kbd> <kbd className="px-1 py-0.5 bg-white/20 rounded">→</kbd> Seek</div>
          <div><kbd className="px-1 py-0.5 bg-white/20 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white/20 rounded">↓</kbd> Volume</div>
          <div><kbd className="px-1 py-0.5 bg-white/20 rounded">F</kbd> Fullscreen</div>
          <div><kbd className="px-1 py-0.5 bg-white/20 rounded">M</kbd> Mute</div>
        </div>
      )}

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>Add Bookmark</h3>
              <button
                onClick={() => {
                  setShowBookmarkModal(false);
                  setBookmarkNote('');
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6F73D2' }}>
              At {formatTime(currentTime)}
            </p>
            <textarea
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Add a note for this bookmark..."
              className="w-full p-3 border rounded-lg mb-4 resize-none"
              rows={3}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBookmarkModal(false);
                  setBookmarkNote('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg font-medium"
                style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
              >
                Cancel
              </button>
              <button
                onClick={addBookmark}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: '#00B5AD' }}
              >
                Save Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

