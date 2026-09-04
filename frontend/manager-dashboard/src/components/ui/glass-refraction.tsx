'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Vertex shader
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader with lens refraction
const FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec4 u_baseColor;
  
  varying vec2 v_texCoord;
  
  const float LENS_MULTIPLIER = 5000.0;
  const float LENS_RADIUS = 0.25;
  
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec2 mouseUV = u_mouse / u_resolution;
    mouseUV.y = 1.0 - mouseUV.y;
    
    // Distance from mouse
    float dist = distance(uv, mouseUV);
    
    // Lens distortion strength
    float lensStrength = smoothstep(LENS_RADIUS, 0.0, dist);
    float roundedBoxVal = lensStrength * 0.0003;
    
    // Refracted UV
    vec2 refractedUV = (uv - 0.5) * (1.0 - roundedBoxVal * LENS_MULTIPLIER) + 0.5;
    
    // Base glass color with lighting
    vec4 color = u_baseColor;
    
    // Add dynamic lighting based on mouse position
    float lightIntensity = lensStrength * 0.4;
    
    // Fresnel-like edge effect
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float fresnel = smoothstep(0.0, 0.1, edgeDist);
    
    // Light refraction highlight
    vec3 highlight = vec3(1.0, 1.0, 1.0) * lightIntensity;
    
    // Chromatic aberration effect
    float chromatic = lensStrength * 0.02;
    vec3 chromaticColor = vec3(
      color.r + chromatic * 0.5,
      color.g,
      color.b - chromatic * 0.3
    );
    
    // Combine effects
    color.rgb = mix(color.rgb, chromaticColor, lensStrength * 0.5);
    color.rgb += highlight;
    
    // Add subtle animated caustics
    float caustics = sin(uv.x * 20.0 + u_time * 0.002) * 
                     sin(uv.y * 20.0 - u_time * 0.0015) * 
                     lensStrength * 0.1;
    color.rgb += vec3(caustics);
    
    // Edge glow when mouse is near
    float edgeGlow = (1.0 - fresnel) * lensStrength * 0.3;
    color.rgb += vec3(edgeGlow);
    
    // Gradient overlay for depth
    float gradientY = uv.y * 0.15;
    color.rgb += vec3(gradientY, gradientY, gradientY);
    
    gl_FragColor = color;
  }
`;

interface GlassRefractionProps {
  children: React.ReactNode;
  className?: string;
  baseColor?: [number, number, number, number]; // RGBA 0-1
  enabled?: boolean;
}

export function GlassRefraction({
  children,
  className,
  baseColor = [0.1, 0.3, 0.5, 0.35], // Default blue glass
  enabled = true,
}: GlassRefractionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!enabled || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Initialize WebGL
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });

    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, VERTEX_SHADER);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    // Set up geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Render function
    const render = () => {
      if (!gl || !program) return;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Set uniforms
      gl.uniform2f(
        gl.getUniformLocation(program, 'u_resolution'),
        canvas.width,
        canvas.height
      );
      gl.uniform2f(
        gl.getUniformLocation(program, 'u_mouse'),
        mouseRef.current.x * dpr,
        mouseRef.current.y * dpr
      );
      gl.uniform1f(
        gl.getUniformLocation(program, 'u_time'),
        performance.now()
      );
      gl.uniform4f(
        gl.getUniformLocation(program, 'u_baseColor'),
        baseColor[0],
        baseColor[1],
        baseColor[2],
        baseColor[3]
      );

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Handle resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      canvas.style.width = `${newRect.width}px`;
      canvas.style.height = `${newRect.height}px`;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      }
    };
  }, [enabled, baseColor]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {enabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0"
          style={{ mixBlendMode: 'overlay' }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default GlassRefraction;
