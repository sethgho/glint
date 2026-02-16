/**
 * Lightweight SMIL animation renderer for glint
 * Parses <animate> and <animateTransform> tags and interpolates values at frame times
 */

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { renderSVGtoPNG } from './styles';

interface AnimateElement {
  element: Element;
  attributeName: string;
  values: string[];
  dur: number; // duration in seconds
  begin: number; // start time in seconds
  repeatCount: number | 'indefinite';
  fill?: string;
}

/**
 * Check if an SVG contains SMIL animations
 */
export function isAnimated(svgContent: string): boolean {
  return /< animate|<animateTransform|<animateMotion|@keyframes/.test(svgContent);
}

/**
 * Parse duration string like "2s", "300ms" to seconds
 */
function parseDuration(dur: string): number {
  if (dur.endsWith('ms')) {
    return parseFloat(dur) / 1000;
  }
  if (dur.endsWith('s')) {
    return parseFloat(dur);
  }
  return parseFloat(dur); // assume seconds
}

/**
 * Parse begin attribute (supports "0s", "2s", "0s;3s" for repeating begins)
 */
function parseBegin(begin: string | null): number {
  if (!begin) return 0;
  const parts = begin.split(';');
  return parseDuration(parts[0] || '0s');
}

/**
 * Linear interpolation between two numeric values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate a value from a values array at time t
 */
function interpolateValues(values: string[], dur: number, begin: number, t: number, repeatCount: number | 'indefinite'): string {
  const elapsed = t - begin;
  
  if (elapsed < 0) {
    // Animation hasn't started yet
    return values[0];
  }
  
  // Handle repeat
  let effectiveTime = elapsed;
  if (repeatCount === 'indefinite') {
    effectiveTime = elapsed % dur;
  } else if (repeatCount > 1) {
    const totalDur = dur * repeatCount;
    if (elapsed > totalDur) {
      return values[values.length - 1];
    }
    effectiveTime = elapsed % dur;
  } else {
    if (elapsed > dur) {
      return values[values.length - 1];
    }
  }
  
  // Calculate position in values array
  const progress = effectiveTime / dur;
  const segmentCount = values.length - 1;
  const segment = progress * segmentCount;
  const segmentIndex = Math.floor(segment);
  const segmentProgress = segment - segmentIndex;
  
  if (segmentIndex >= values.length - 1) {
    return values[values.length - 1];
  }
  
  const from = values[segmentIndex];
  const to = values[segmentIndex + 1];
  
  // Try to interpolate numerically
  const fromNum = parseFloat(from);
  const toNum = parseFloat(to);
  
  if (!isNaN(fromNum) && !isNaN(toNum)) {
    return lerp(fromNum, toNum, segmentProgress).toString();
  }
  
  // For non-numeric values (like paths), just snap to nearest
  return segmentProgress < 0.5 ? from : to;
}

/**
 * Apply animations to SVG at a specific time
 */
function applySMILAnimations(svgContent: string, time: number): string {
  // Parse SVG as DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // Find all animate elements (need to use getElementsByTagName since querySelectorAll may not be available)
  const animateElements: Element[] = [];
  const animateNodes = doc.getElementsByTagName('animate');
  const animateTransformNodes = doc.getElementsByTagName('animateTransform');
  
  for (let i = 0; i < animateNodes.length; i++) {
    animateElements.push(animateNodes[i]);
  }
  for (let i = 0; i < animateTransformNodes.length; i++) {
    animateElements.push(animateTransformNodes[i]);
  }
  
  animateElements.forEach(animEl => {
    const attributeName = animEl.getAttribute('attributeName');
    const valuesStr = animEl.getAttribute('values');
    const dur = animEl.getAttribute('dur');
    const begin = animEl.getAttribute('begin');
    const repeatCount = animEl.getAttribute('repeatCount');
    const fill = animEl.getAttribute('fill');
    
    if (!attributeName || !valuesStr || !dur) return;
    
    const values = valuesStr.split(';').map(v => v.trim());
    const durSeconds = parseDuration(dur);
    const beginSeconds = parseBegin(begin);
    const repeat = repeatCount === 'indefinite' ? 'indefinite' : (parseInt(repeatCount || '1', 10) || 1);
    
    // Calculate interpolated value at current time
    const interpolated = interpolateValues(values, durSeconds, beginSeconds, time, repeat);
    
    // Apply to parent element
    const parent = animEl.parentNode as Element;
    if (parent) {
      if (animEl.tagName === 'animateTransform') {
        const type = animEl.getAttribute('type') || 'translate';
        parent.setAttribute('transform', `${type}(${interpolated})`);
      } else {
        parent.setAttribute(attributeName, interpolated);
      }
      
      // Remove the animate element from output
      parent.removeChild(animEl);
    }
  });
  
  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

/**
 * Render animated SVG to multiple PNG frames
 * 
 * @param svgContent - SVG source with SMIL animations
 * @param fps - Frames per second (default 15)
 * @param duration - Total duration in seconds (default 3)
 * @param width - Output width in pixels
 * @param height - Output height in pixels
 * @returns Array of PNG buffers, one per frame
 */
export function renderAnimatedFrames(
  svgContent: string,
  fps: number = 15,
  duration: number = 3,
  width: number = 64,
  height: number = 32
): Buffer[] {
  const frames: Buffer[] = [];
  const frameCount = Math.ceil(fps * duration);
  
  for (let i = 0; i < frameCount; i++) {
    const t = i / fps;
    const frameSvg = applySMILAnimations(svgContent, t);
    frames.push(renderSVGtoPNG(frameSvg, width, height));
  }
  
  return frames;
}
