'use client';

import { useEffect, useRef, useCallback } from 'react';

// Vertex shader - simple pass-through
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader with lens refraction effect
const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  
  varying vec2 v_texCoord;
  
  const float LENS_MULTIPLIER = 5000.0;
  const float LENS_RADIUS = 0.15;
  const int BLUR_SAMPLES = 9;
  
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec2 mouseUV = u_mouse / u_resolution;
    mouseUV.y = 1.0 - mouseUV.y; // Flip Y for WebGL coordinates
    
    // Calculate distance from mouse
    float dist = distance(uv, mouseUV);
    
    // Create lens distortion based on distance
    float lensStrength = smoothstep(LENS_RADIUS, 0.0, dist);
    float roundedBoxVal = lensStrength * 0.0002;
    
    // Calculate refracted UV coordinates
    vec2 refractedUV = (uv - 0.5) * (1.0 - roundedBoxVal * LENS_MULTIPLIER) + 0.5;
    
    // Multi-sample blur for realistic glass appearance
    vec4 color = vec4(0.0);
    float blurSize = 0.002 * lensStrength;
    
    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        vec2 offset = vec2(float(x), float(y)) * blurSize;
        color += texture2D(u_texture, refractedUV + offset);
      }
    }
    color /= float(BLUR_SAMPLES * BLUR_SAMPLES);
    
    // Add subtle chromatic aberration
    float chromatic = lensStrength * 0.003;
    float r = texture2D(u_texture, refractedUV + vec2(chromatic, 0.0)).r;
    float g = texture2D(u_texture, refractedUV).g;
    float b = texture2D(u_texture, refractedUV - vec2(chromatic, 0.0)).b;
    
    vec4 chromaticColor = vec4(r, g, b, 1.0);
    color = mix(color, chromaticColor, lensStrength * 0.5);
    
    // Add gradient lighting for depth
    float lightGradient = 1.0 + lensStrength * 0.2 * sin(u_time * 0.001 + uv.x * 3.14159);
    color.rgb *= lightGradient;
    
    // Edge highlight
    float edgeHighlight = smoothstep(LENS_RADIUS - 0.02, LENS_RADIUS, dist) * lensStrength;
    color.rgb += vec3(edgeHighlight * 0.1);
    
    gl_FragColor = color;
  }
`;

interface UseGlassRefractionOptions {
  enabled?: boolean;
  captureBackground?: boolean;
}

export function useGlassRefraction(options: UseGlassRefractionOptions = {}) {
  const { enabled = true } = options;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  const initWebGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return null;

    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    glRef.current = gl;
    programRef.current = program;
    textureRef.current = texture;

    return gl;
  }, [createShader, createProgram]);

  const captureBackground = useCallback(async () => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use html2canvas or similar to capture background
    // For now, we'll create a gradient texture as placeholder
    const gl = glRef.current;
    if (!gl || !textureRef.current) return;

    // Create a simple gradient texture
    const width = Math.floor(rect.width) || 256;
    const height = Math.floor(rect.height) || 256;
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        // Create a blue gradient matching the background
        const t = y / height;
        data[i] = Math.floor(0 + t * 30);     // R
        data[i + 1] = Math.floor(100 + t * 20); // G
        data[i + 2] = Math.floor(180 + t * 30); // B
        data[i + 3] = 255;                      // A
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }, []);

  const render = useCallback(function renderLoop() {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    
    if (!gl || !program || !canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);

    // Update uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
    gl.uniform1f(timeLocation, performance.now());

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const setupCanvas = useCallback((container: HTMLDivElement, canvas: HTMLCanvasElement) => {
    containerRef.current = container;
    canvasRef.current = canvas;
    
    if (!enabled) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const gl = initWebGL(canvas);
    if (gl) {
      captureBackground();
      render();
      
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', () => {
        if (!animationFrameRef.current) {
          render();
        }
      });
      container.addEventListener('mouseleave', () => {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      });
    }
  }, [enabled, initWebGL, captureBackground, render, handleMouseMove]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (containerRef.current) {
      containerRef.current.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    setupCanvas,
    cleanup,
    canvasRef,
    containerRef,
  };
}
