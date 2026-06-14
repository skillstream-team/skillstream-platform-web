import React from 'react';
import { Mic, MicOff, PhoneOff, ScreenShare, ScreenShareOff, Video, VideoOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LiveControlsBarProps {
  micOn: boolean;
  cameraOn: boolean;
  screenSharingOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export const LiveControlsBar: React.FC<LiveControlsBarProps> = ({
  micOn,
  cameraOn,
  screenSharingOn,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onToggleMic}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600')}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={onToggleCamera}
        title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', cameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-500 text-white hover:bg-rose-600')}
      >
        {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={onToggleScreenShare}
        title={screenSharingOn ? 'Stop sharing screen' : 'Share your screen'}
        className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', screenSharingOn ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/10 text-white hover:bg-white/20')}
      >
        {screenSharingOn ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
      </button>

      <div className="mx-1 h-8 w-px bg-white/15" />

      <button
        type="button"
        onClick={onLeave}
        title="Leave session"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700 active:scale-95"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
};
