export class Shader {
  private gl: WebGL2RenderingContext;
  public program: WebGLProgram;

  // 使用 TypeScript 的 Record 動態儲存未知的變數
  public attributes: Record<string, number> = {};
  public uniforms: Record<string, WebGLUniformLocation> = {};

  constructor(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {
    this.gl = gl;
    this.program = this.initShaderProgram(vsSource, fsSource)!;
    
    // 魔法在這裡：自動提取所有變數！
    this.extractAttributes();
    this.extractUniforms();
  }

  private extractAttributes() {
    const gl = this.gl;
    // 1. 問 GPU：這個程式總共有幾個 Attribute 變數？
    const numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);

    // 2. 跑迴圈把名字和門牌號碼全部抓出來
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(this.program, i);
      if (info) {
        // info.name 就是 "aVertexPosition" 或 "aTextureCoord" 等字串
        const location = gl.getAttribLocation(this.program, info.name);
        this.attributes[info.name] = location;
      }
    }
  }

  private extractUniforms() {
    const gl = this.gl;
    // 1. 問 GPU：總共有幾個 Uniform 變數？
    const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

    // 2. 跑迴圈自動綁定
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(this.program, i);
      if (info) {
        /* 注意：如果是陣列變數 (例如 uLightColors[0])，WebGL 回傳的名字會帶有 [0]
           我們可以把它過濾掉，保持乾淨的名字 */
        let name = info.name;
        if (name.endsWith('[0]')) {
          name = name.substring(0, name.length - 3);
        }
        
        const location = gl.getUniformLocation(this.program, info.name)!;
        this.uniforms[name] = location;
      }
    }
  }

  // (略) initShaderProgram 的實作，就是你原本編譯 Shader 的那段邏輯
  private initShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

    if (vertexShader == null || fragmentShader == null) {
      return null;
    }

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }

    return shaderProgram;
  }

  //
  // creates a shader of the given type, uploads the source and
  // compiles it.
  //
  private loadShader(type: GLenum, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type) as WebGLShader;

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}
