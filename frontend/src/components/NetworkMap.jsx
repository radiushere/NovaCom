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
    setError("Curating connections...");
    callBackend('get_visual_graph').then(data => {
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
        setError(null);
      } else {
        setError("Collection empty. Connect with others to visualize.");
      }
    }).catch(err => setError("Connection failed."));
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

    // 1. Draw Outer Ring (Clean, Museum Style)
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.strokeStyle = '#1C1917'; // Museum Text (Soft Black)
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 2. Draw Avatar Image
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
      ctx.fillStyle = '#1C1917';
      ctx.font = `${size}px "Playfair Display", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name[0].toUpperCase(), node.x, node.y);
    }

    // 3. Draw Label (User Name)
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#44403C'; // Stone 700
    ctx.fillText(label, node.x, node.y + size + 4);
  }, []);

  return (
    <GlassCard className="h-full w-full relative overflow-hidden flex flex-col p-0 border-museum-stone">
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <h2 className="font-serif text-3xl text-museum-text">Cartography</h2>
        <p className="text-museum-muted text-sm italic">Visualizing the network of patrons</p>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/80 backdrop-blur-sm">
          <p className="text-museum-muted font-serif text-xl">{error}</p>
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full h-full bg-museum-bg">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.w}
          height={dimensions.h}
          graphData={graphData}
          nodeLabel="name"
          nodeCanvasObject={paintNode}
          linkColor={() => '#E7E5E4'} // Museum Stone
          backgroundColor="#FAFAF9" // Museum BG
          d3VelocityDecay={0.1}
          cooldownTicks={100}
          onEngineStop={() => fgRef.current.zoomToFit(400)}
        />
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex gap-2">
        <button onClick={() => fetchGraph()} className="bg-white border border-museum-stone p-3 rounded-full shadow-sm hover:shadow-md text-museum-text transition-all" title="Refresh">
          🔄
        </button>
        <button onClick={() => fgRef.current.zoomToFit(400)} className="bg-white border border-museum-stone p-3 rounded-full shadow-sm hover:shadow-md text-museum-text transition-all" title="Center">
          🎯
        </button>
      </div>
    </GlassCard>
  );
};

export default NetworkMap;