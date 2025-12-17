import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const NetworkMap = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const fgRef = useRef();

  const fetchGraph = () => {
    setError("Loading...");
    callBackend('get_visual_graph').then(data => {
      console.log("Graph API Response:", data); // Check Console F12 if issues persist
      
      if (data && data.error) {
          setError(`Backend Error: ${data.error}`);
      } else if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
        setError(null);
      } else {
        setError("Map Unavailable: No signals found. Try adding friends.");
      }
    }).catch(err => {
        console.error("Graph Network Error:", err);
        setError("Failed to connect to Neural Network.");
    });
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ w: width, h: height });
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <GlassCard className="h-full w-full relative overflow-hidden flex flex-col p-0">
      <div className="absolute top-4 left-4 z-10 pointer-events-none p-4">
        <h2 className="font-orbitron text-2xl text-cyan-supernova drop-shadow-glow">GALAXY MAP</h2>
        <p className="text-gray-400 text-xs">Real-time Network Topology</p>
      </div>

      <div className="absolute top-4 right-4 z-10">
          <button onClick={fetchGraph} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded border border-white/10 pointer-events-auto">
              Refresh Map
          </button>
      </div>

      <div ref={containerRef} className="flex-1 bg-void-black w-full h-full relative">
        {graphData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 flex-col">
                <p>{error || "Loading..."}</p>
            </div>
        ) : (
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                backgroundColor="#0B0B15" 
                nodeColor={() => "#00F0FF"} 
                linkColor={() => "#6C63FF"} 
                nodeLabel="name"
                nodeRelSize={4}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                d3VelocityDecay={0.1}
                d3AlphaDecay={0.02}
                onNodeClick={node => {
                    fgRef.current.centerAt(node.x, node.y, 1000);
                    fgRef.current.zoom(6, 2000);
                }}
            />
        )}
      </div>
    </GlassCard>
  );
};

export default NetworkMap;