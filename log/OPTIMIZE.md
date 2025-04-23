`
        precision mediump float;
        uniform sampler2D u_image;
        uniform vec2 u_textureSize;
        uniform float u_blurAmount;
        varying vec2 v_texCoord;
        
        // 高斯模糊实现
        vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, float blurAmount) {
            // 在这里翻转y坐标
            vec2 flipUV = vec2(uv.x, 1.0 - uv.y);
            
            float d = blurAmount / 10.0;
            vec4 color = vec4(0.0);
            
            // 13个采样点的高斯模糊
            vec2 off1 = vec2(1.411764705882353) * d;
            vec2 off2 = vec2(3.2941176470588234) * d;
            vec2 off3 = vec2(5.176470588235294) * d;
            
            color += texture2D(image, flipUV) * 0.1964825501511404;
            color += texture2D(image, flipUV + (off1 / resolution)) * 0.2969069646728344;
            color += texture2D(image, flipUV - (off1 / resolution)) * 0.2969069646728344;
            color += texture2D(image, flipUV + (off2 / resolution)) * 0.09447039785044732;
            color += texture2D(image, flipUV - (off2 / resolution)) * 0.09447039785044732;
            color += texture2D(image, flipUV + (off3 / resolution)) * 0.010381362401148057;
            color += texture2D(image, flipUV - (off3 / resolution)) * 0.010381362401148057;
            
            return color;
        }
        
        void main() {
            // 翻转y坐标
            vec2 flipYTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
            
            if (u_blurAmount <= 0.01) {
            // 如果模糊量很小，直接显示原图像
            gl_FragColor = texture2D(u_image, flipYTexCoord);
            } else {
            // 应用模糊 - 使用未翻转的坐标，因为blur13内部会进行翻转
            gl_FragColor = blur13(u_image, v_texCoord, u_textureSize, u_blurAmount);
            }
        }
        `