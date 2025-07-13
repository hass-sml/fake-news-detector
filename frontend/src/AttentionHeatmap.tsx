import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface AttentionHeatmapProps {
  tokens: string[];
  attention: number[][]; // This is correct - a 2D matrix
}

const AttentionHeatmap: React.FC<AttentionHeatmapProps> = ({ tokens, attention }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter out non-meaningful tokens
  const filteredTokensIndices = tokens
    .map((token, index) => ({ token, index }))
    .filter(item => {
      // Filter out empty tokens, special tokens, and other non-meaningful tokens
      return item.token.trim() !== '' && 
             !item.token.match(/^<.*>$/) && // Remove tokens like <s>, </s>, etc.
             !item.token.match(/^\[.*\]$/) && // Remove tokens like [PAD], [CLS], etc.
             item.token !== '.' && // Remove single punctuation tokens if needed
             item.token !== ',' &&
             item.token !== '!' &&
             item.token !== '?';
    });
  
  const filteredTokens = filteredTokensIndices.map(item => item.token);
  const filteredIndices = filteredTokensIndices.map(item => item.index);
  
  // Filter attention matrix to only include the filtered tokens
  const filteredAttention = filteredIndices.map(rowIdx => 
    filteredIndices.map(colIdx => attention[rowIdx][colIdx])
  );

  // Process tokens to identify subword tokens
  const processedTokens = filteredTokens.map((token, i) => {
    // Check if token starts with '##' or other subword indicators
    const isSubword = token.startsWith('##') || 
                      (i > 0 && !token.startsWith(' ') && !token.match(/^[.,!?;:'")\]}/]/) && 
                       !filteredTokens[i-1].match(/[.,!?;:'"(\[{]$/));
    
    // Clean the token for display (remove ## if present)
    const displayToken = token.startsWith('##') ? token.substring(2) : token;
    
    return {
      original: token,
      display: displayToken.trim(),
      isSubword
    };
  });

  useEffect(() => {
    if (!svgRef.current || !filteredTokens.length || !filteredAttention.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Calculate max label length to determine margins
    const maxLabelLength = Math.max(...processedTokens.map(t => t.display.length));
    const leftMargin = Math.max(120, maxLabelLength * 8);
    const rightMargin = Math.max(100, maxLabelLength * 6); // Increased right margin

    const margin = { 
      top: 150,  // Increased top margin
      right: rightMargin, 
      bottom: 50, 
      left: leftMargin
    };
    
    const cellSize = 30;
    const width = cellSize * filteredTokens.length;
    const height = cellSize * filteredTokens.length;
    const totalWidth = width + margin.left + margin.right;
    const totalHeight = height + margin.top + margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .style('display', 'block')
      .style('margin', '0 auto');

    // Create container group with margin
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, d3.max(filteredAttention.flat()) || 1])
      .range(['#f7fafc', '#7b3ff7']);

    // Create cells
    g.selectAll('rect')
      .data(filteredAttention.flat())
      .enter()
      .append('rect')
      .attr('x', (_, i) => (i % filteredTokens.length) * cellSize)
      .attr('y', (_, i) => Math.floor(i / filteredTokens.length) * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => colorScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 0.5);

    // Add token labels on top with visual indication of subwords
    // Increased distance and adjusted rotation for better visibility
    g.selectAll('.top-label')
      .data(processedTokens)
      .enter()
      .append('text')
      .attr('class', 'top-label')
      .attr('x', (_, i) => i * cellSize + cellSize / 2)
      .attr('y', -50)  // Increased distance from heatmap
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.isSubword ? '#a78bfa' : 'white')
      .attr('font-size', '12px')
      .attr('font-style', d => d.isSubword ? 'italic' : 'normal')
      .text(d => d.display)
      .attr('transform', (_, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -50)`);

    // Add token labels on left with visual indication of subwords
    g.selectAll('.left-label')
      .data(processedTokens)
      .enter()
      .append('text')
      .attr('class', 'left-label')
      .attr('x', -15)  // Increased distance from heatmap
      .attr('y', (_, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.isSubword ? '#a78bfa' : 'white')
      .attr('font-size', '12px')
      .attr('font-style', d => d.isSubword ? 'italic' : 'normal')
      .text(d => d.display);

    // Add connecting lines between subword tokens
    let currentWordStart = 0;
    processedTokens.forEach((token, i) => {
      if (i > 0 && token.isSubword) {
        // Draw a subtle connecting line
        g.append('line')
          .attr('x1', (i-1) * cellSize + cellSize / 2)
          .attr('y1', -70)  // Adjusted to match new label position
          .attr('x2', i * cellSize + cellSize / 2)
          .attr('y2', -70)
          .attr('stroke', '#a78bfa')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');
      } else if (i > 0 && !token.isSubword && processedTokens[i-1].isSubword) {
        // End of a subword sequence
        currentWordStart = i;
      }
    });

    // Add a small legend in the top-right corner
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${totalWidth - 20}, 20)`);
      
    legendGroup.append('circle')
      .attr('cx', -5)
      .attr('cy', 0)
      .attr('r', 5)
      .attr('fill', '#a78bfa');
      
    legendGroup.append('text')
      .attr('x', -15)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text('Subword tokens');

  }, [filteredTokens, filteredAttention]);

  return (
    <div className="flex flex-col items-center w-full overflow-auto p-4">
      <h3 className="text-white text-lg font-medium mb-1">Attention Visualization</h3>
      <p className="text-gray-400 text-sm mb-4">Shows how tokens attend to each other (purple = subword tokens)</p>
      <div className="flex justify-center items-center w-full">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default AttentionHeatmap;
