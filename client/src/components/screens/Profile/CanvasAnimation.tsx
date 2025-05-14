import { useRef, useEffect } from "react";

interface CanvasSpriteProps {
    frames: string[]; // Array of image URLs for the animation frames
    fps?: number;     // Frames per second (optional, defaults to 12)
    size: { w: number; h: number }; // Width and height of the canvas
}

export function CanvasSprite({ frames, fps = 12, size: { w, h } }: CanvasSpriteProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const images = useRef<HTMLImageElement[]>([]);
    
    useEffect(() => {
        let frame = 0;
        let rafId: number;

        // 1. Preload images
        images.current = frames.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        const draw = () => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, w, h); // Clear the canvas
                ctx.drawImage(images.current[frame], 0, 0, w, h); // Draw the current frame
            }
            frame = (frame + 1) % frames.length; // Move to the next frame
            // Schedule the next frame
            rafId = window.setTimeout(() => requestAnimationFrame(draw), 1000 / fps) as unknown as number;
        };

        // Wait for at least the first frame to load before starting
        images.current[0].onload = () => draw();

        return () => {
            window.clearTimeout(rafId); // Cleanup on component unmount
        };
    }, [frames, fps, w, h]);

    return <canvas ref={canvasRef} width={w} height={h} />;
}
