import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { Settings2, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QualityLevel {
    index: number;
    height: number;
    bitrate: number;
}

interface HlsVideoPlayerProps {
    src: string;
    className?: string;
}

export function HlsVideoPlayer({ src, className }: HlsVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [levels, setLevels] = useState<QualityLevel[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto (ABR)
    const [showMenu, setShowMenu] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false); // quality switch in progress

    // Close quality menu when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls({
                startLevel: -1,             // start with ABR
                capLevelToPlayerSize: true, // don't serve 1080p to a tiny player

                // ── Gradual / progressive segment loading ──────────────────────
                // Only buffer ~10 s ahead so segments arrive one-by-one as the
                // playhead advances, rather than downloading everything upfront.
                maxBufferLength: 10,              // target look-ahead (s)   [default 30]
                maxMaxBufferLength: 30,           // hard cap (s)            [default 600]
                maxBufferSize: 10 * 1024 * 1024,  // 10 MB max buffer size   [default 60 MB]
                // Don't fetch the first fragment before the user presses play
                startFragPrefetch: false,
                // Keep only 5 s of back-buffer; reclaim memory for forward segments
                backBufferLength: 5,
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                setLevels(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.levels.map((l: any, i: number) => ({
                        index: i,
                        height: l.height,
                        bitrate: l.bitrate,
                    }))
                );
                setCurrentLevel(-1);
            });

            // When a quality switch is requested, show the spinner
            hls.on(Hls.Events.LEVEL_SWITCHING, () => {
                setIsSwitching(true);
            });

            // Track which level is actually active; hide spinner once settled
            hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
                setIsSwitching(false);
                if (!hls.autoLevelEnabled) {
                    setCurrentLevel(data.level);
                }
            });

            return () => {
                hls.destroy();
                hlsRef.current = null;
                setLevels([]);
                setCurrentLevel(-1);
                setIsSwitching(false);
            };
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari — native HLS, no JS quality API
            video.src = src;
        }
    }, [src]);

    const selectLevel = (index: number) => {
        const hls = hlsRef.current;
        if (!hls) return;

        // Stop loading, flush the forward buffer for the current quality,
        // then restart at the newly selected quality level. This discards
        // any prefetched segments from the old rendition so the player
        // immediately begins pulling packets for the chosen quality.
        hls.stopLoad();
        hls.currentLevel = index; // -1 re-enables ABR; any other value locks the rendition
        hls.startLoad(hls.media?.currentTime ?? -1); // resume from playhead, not from buffer end

        setCurrentLevel(index);
        setShowMenu(false);
    };

    const activeLabelText =
        currentLevel === -1
            ? "Auto"
            : levels[currentLevel]
                ? `${levels[currentLevel].height}p`
                : "Auto";

    // Sort levels highest quality first for the menu
    const sortedLevels = [...levels].sort((a, b) => b.height - a.height);

    return (
        <div className={cn("relative w-full bg-black rounded-2xl overflow-hidden group", className)}>
            <video
                ref={videoRef}
                controls
                className="w-full max-h-96"
                playsInline
            />

            {/* Quality selector — only shown when HLS.js parsed levels */}
            {levels.length > 0 && (
                <div ref={menuRef} className="absolute bottom-14 right-3 z-20">
                    <button
                        onClick={() => setShowMenu((v) => !v)}
                        className="flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
                        title="Select video quality"
                    >
                        {isSwitching
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Settings2 className="h-3.5 w-3.5" />
                        }
                        {activeLabelText}
                    </button>

                    {showMenu && (
                        <div className="absolute bottom-8 right-0 min-w-[110px] rounded-xl border border-white/10 bg-black/90 py-1.5 text-xs text-white shadow-2xl backdrop-blur-sm">
                            <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                Quality
                            </p>

                            {/* Auto (ABR) option */}
                            <button
                                onClick={() => selectLevel(-1)}
                                className={cn(
                                    "flex w-full items-center justify-between px-3 py-1.5 hover:bg-white/10 transition-colors",
                                    currentLevel === -1 && "text-blue-400"
                                )}
                            >
                                <span>Auto</span>
                                {currentLevel === -1 && <CheckCheck className="h-3 w-3" />}
                            </button>

                            {/* Per-rendition levels */}
                            {sortedLevels.map((l) => (
                                <button
                                    key={l.index}
                                    onClick={() => selectLevel(l.index)}
                                    className={cn(
                                        "flex w-full items-center justify-between px-3 py-1.5 hover:bg-white/10 transition-colors",
                                        currentLevel === l.index && "text-blue-400"
                                    )}
                                >
                                    <span>{l.height}p</span>
                                    {currentLevel === l.index && <CheckCheck className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
