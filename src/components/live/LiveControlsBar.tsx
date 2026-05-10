import React from 'react';
import { Mic, MicOff, PhoneOff, ScreenShare, ScreenShareOff, Video, VideoOff } from 'lucide-react';

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
    <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-[color:var(--hub-border)] bg-white p-3">
      <button
        type="button"
        onClick={onToggleMic}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${micOn ? 'bg-[color:var(--hub-soft)] text-[color:var(--hub-text)]' : 'bg-rose-100 text-rose-700'}`}
      >
        {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        {micOn ? 'Mic on' : 'Mic off'}
      </button>
      <button
        type="button"
        onClick={onToggleCamera}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${cameraOn ? 'bg-[color:var(--hub-soft)] text-[color:var(--hub-text)]' : 'bg-rose-100 text-rose-700'}`}
      >
        {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        {cameraOn ? 'Camera on' : 'Camera off'}
      </button>
      <button
        type="button"
        onClick={onToggleScreenShare}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${screenSharingOn ? 'bg-[color:var(--hub-primary)] text-white' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-text)]'}`}
      >
        {screenSharingOn ? <ScreenShareOff className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
        {screenSharingOn ? 'Stop share' : 'Share screen'}
      </button>
      <button
        type="button"
        onClick={onLeave}
        className="ml-auto inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
      >
        <PhoneOff className="h-4 w-4" />
        Leave
      </button>
    </div>
  );
};
