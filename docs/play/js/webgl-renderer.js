var IGRA = IGRA || {};
(function (G) {
  "use strict";

  function shader(gl, type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  G.WebGL = {
    canvas: null,
    gl: null,
    program: null,
    buffer: null,
    ready: false,
    count: 0,
    init: function () {
      this.canvas = document.getElementById("depth-stage");
      if (!this.canvas) return false;
      var gl = this.canvas.getContext("webgl", { alpha: false, antialias: false });
      if (!gl) return false;
      var vs = shader(gl, gl.VERTEX_SHADER,
        "attribute vec2 aSeed; uniform vec2 uSize; uniform float uTime; " +
        "varying float vGlow; void main(){ " +
        "float drift=sin(uTime*.07+aSeed.y*19.0)*.012; " +
        "vec2 p=vec2(aSeed.x+drift, fract(aSeed.y+uTime*.002)); " +
        "gl_Position=vec4(p*2.0-1.0,0.0,1.0); " +
        "gl_PointSize=1.0+2.2*fract(aSeed.x*91.7+aSeed.y*17.3); " +
        "vGlow=.35+.65*sin(uTime*.8+aSeed.x*40.0); }");
      var fs = shader(gl, gl.FRAGMENT_SHADER,
        "precision mediump float; varying float vGlow; void main(){ " +
        "vec2 p=gl_PointCoord-.5; float d=dot(p,p); " +
        "if(d>.25) discard; float a=(1.0-d*4.0)*vGlow*.55; " +
        "gl_FragColor=vec4(.48,.62,1.0,a); }");
      if (!vs || !fs) return false;
      var program = gl.createProgram();
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      var seeds = new Float32Array(260 * 2);
      var rng = new G.Rng(9031);
      for (var i = 0; i < seeds.length; i++) seeds[i] = rng.next();
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      this.program = program; this.gl = gl; this.count = 260; this.ready = true;
      this.resize();
      return true;
    },
    resize: function () {
      if (!this.ready) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(window.innerWidth * dpr));
      var h = Math.max(1, Math.round(window.innerHeight * dpr));
      this.canvas.width = w; this.canvas.height = h;
      this.canvas.style.width = "100%"; this.canvas.style.height = "100%";
      this.gl.viewport(0, 0, w, h);
    },
    draw: function (game) {
      if (!this.ready) return;
      var gl = this.gl;
      gl.useProgram(this.program);
      gl.clearColor(.008, .009, .018, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      var loc = gl.getAttribLocation(this.program, "aSeed");
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(this.program, "uTime"), game.time);
      gl.uniform2f(gl.getUniformLocation(this.program, "uSize"), this.canvas.width, this.canvas.height);
      gl.drawArrays(gl.POINTS, 0, this.count);
    }
  };
})(IGRA);
