import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const NetworkMap = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const fgRef = useRef();

  // Image Cache to prevent flickering and lag
  const imgCache = useRef({});

  const fetchGraph = () => {
    setError("Scanning sector...");
    callBackend('get_visual_graph').then(data => {
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
        setError(null);
      } else {
        setError("Neural network empty. Connect signals to generate map.");
      }
    }).catch(err => setError("Neural link failed."));
  };

  useEffect(() => {
    fetchGraph();
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ w: width, h: height });
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- CANVAS PAINTING LOGIC ---
  const paintNode = useCallback((node, ctx, globalScale) => {
    const size = Math.sqrt(node.val) * 5; // Node radius based on friend count

    // 1. Draw Glow Effect
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 1.4, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fill();

    // 2. Draw Outer Ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    ctx.fillStyle = '#0B0B15';
    ctx.fill();

    // 3. Draw Avatar Image
    const imgUrl = node.avatar && node.avatar !== "NULL" && node.avatar !== "none" ? node.avatar : null;

    if (imgUrl) {
      if (!imgCache.current[imgUrl]) {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => { imgCache.current[imgUrl] = img; };
      }

      const cachedImg = imgCache.current[imgUrl];
      if (cachedImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, size - 0.5, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.drawImage(cachedImg, node.x - size, node.y - size, size * 2, size * 2);
        ctx.restore();
      }
    } else {
      // Placeholder if no avatar (First letter)
      ctx.fillStyle = '#00F0FF';
      ctx.font = `${size}px Orbitron`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name[0].toUpperCase(), node.x, node.y);
    }

    // 4. Draw Label (User Name)
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(label, node.x, node.y + size + 2);
  }, []);

  return (
    <GlassCard className="h-full w-full relative overflow-hidden flex flex-col p-0 border-cyan-supernova/20">
      <div className="absolute top-4 left-4 z-20 pointer-events-none p-4">
        <h2 className="font-orbitron text-2xl text-cyan-supernova drop-shadow-glow">GALAXY MAP</h2>
        <p className="text-gray-400 text-xs tracking-widest uppercase">Visualizing Neural Connections</p>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button onClick={fetchGraph} className="bg-void-black/80 hover:bg-cyan-supernova/20 text-cyan-supernova text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-cyan-supernova/40 backdrop-blur-md transition-all active:scale-95">
          Sync Network
        </button>
      </div>

      <div ref={containerRef} className="flex-1 bg-void-black w-full h-full relative">
        {graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-4">
            <div className="w-12 h-12 border-2 border-cyan-supernova border-t-transparent rounded-full animate-spin"></div>
            <p className="font-orbitron tracking-widest text-sm">{error || "LOADING SECTOR..."}</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.w}
            height={dimensions.h}
            graphData={graphData}
            backgroundColor="#0B0B15"

            // Custom Node Rendering
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              const size = Math.sqrt(node.val) * 5;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fill();
            }}

            // Tooltip on hover
            nodeLabel={node => `
                  <div style="background: rgba(11, 11, 21, 0.9); border: 1px solid #00F0FF; padding: 8px; border-radius: 8px; color: white; font-family: Montserrat;">
                    <b style="color: #00F0FF;">${node.name}</b><br/>
                    <small style="opacity: 0.7;">Neural ID: ${node.id}</small>
                  </div>
                `}

            // Links
            linkColor={() => "rgba(108, 99, 255, 0.3)"}
            linkWidth={1.5}
            linkDirectionalParticles={4}
            linkDirectionalParticleSpeed={0.003}
            linkDirectionalParticleWidth={2}

            // Physics
            d3VelocityDecay={0.1}
            d3AlphaDecay={0.01}
            cooldownTicks={100}

            onNodeClick={node => {
              fgRef.current.centerAt(node.x, node.y, 1000);
              fgRef.current.zoom(5, 2000);
            }}
          />
        )}
      </div>
    </GlassCard>
  );
};

export default NetworkMap;