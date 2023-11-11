import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import GUI from "lil-gui";
import gsap from "gsap";

export default class Sketch {
  constructor(options) {
    this.container = options.domElement;
    this.time = 0;
    this.sizes = {
      width: this.container.getBoundingClientRect().width,
      height: this.container.getBoundingClientRect().height,
    };

    this.settings = {
      progress: 0,
      rgbShiftAmount: 0.015,
      reverse: false,
    };

    this.activeImageIndex = null;

    this.init();
    this.createObjects();
    this.resize();
    this.setupResize();
    // this.setupSettings();
    this.render();
  }

  init() {
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.sizes.width / this.sizes.height,
      10,
      1000
    );
    this.camera.position.z = 600;
    this.camera.fov =
      2 *
      (180 / Math.PI) *
      Math.atan((this.sizes.height * 0.5) / this.camera.position.z);

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    this.container.appendChild(this.renderer.domElement);
  }

  setupSettings() {
    this.gui = new GUI();

    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "rgbShiftAmount", 0, 0.1, 0.0001);
  }

  resize() {
    this.sizes.width = this.container.getBoundingClientRect().width;
    this.sizes.height = this.container.getBoundingClientRect().height;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.camera.fov =
      2 *
      (180 / Math.PI) *
      Math.atan((this.sizes.height * 0.5) / this.camera.position.z);

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.imagesStore.forEach((o) => {
      const bounds = o.img.getBoundingClientRect();

      o.left = bounds.left;
      o.top = bounds.top;

      o.width = bounds.width;
      o.height = bounds.height;

      o.mesh.scale.set(bounds.width, bounds.height, 1);

      o.mesh.material.uniforms.uQuadSize.value = new THREE.Vector2(
        bounds.width,
        bounds.height
      );

      o.mesh.material.uniforms.uResolution.value = new THREE.Vector2(
        this.sizes.width,
        this.sizes.height
      );
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  createObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
    this.material = new THREE.ShaderMaterial({
      // wireframe: true,
      transparent: true,
      fragmentShader,
      vertexShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: "" },
        uProgress: { value: this.settings.progress },
        uRgbShiftAmount: { value: this.settings.rgbShiftAmount },
        uResolution: {
          value: new THREE.Vector2(this.sizes.width, this.sizes.height),
        },

        uQuadSize: {
          value: new THREE.Vector2(300, 300),
        },

        uCorners: {
          value: new THREE.Vector4(0, 0, 0, 0),
        },
      },
    });

    this.images = [...document.querySelectorAll(".myimage")];
    this.closeBtn = document.querySelector(".close-button");

    this.imagesStore = this.images.map((img) => {
      const bounds = img.getBoundingClientRect();

      const m = this.material.clone();
      this.mesh = new THREE.Mesh(this.geometry, m);
      this.mesh.scale.set(bounds.width, bounds.height, 1);

      const image = new Image();
      image.src = img.src;

      const texture = new THREE.Texture(image);

      image.addEventListener("load", () => {
        texture.needsUpdate = true;
      });

      m.uniforms.uTexture.value = texture;
      m.uniforms.uQuadSize.value = new THREE.Vector2(
        bounds.width,
        bounds.height
      );

      this.scene.add(this.mesh);

      img.addEventListener("click", () => {
        this.activeImageIndex = img.getAttribute("data-index");

        console.log(this.activeImageIndex);

        this.tween = gsap
          .timeline({
            onStart: () => {
              document.querySelector(".images-container").style.pointerEvents =
                "none";
            },

            onComplete: () => {
              this.closeBtnTween = gsap.to(this.closeBtn, {
                opacity: 1,
                pointerEvents: "all",
              });
            },
          })
          .to(m.uniforms.uCorners.value, {
            x: 1,
            duration: 0.5,
            // ease: Power4.easeInOut,
          })
          .to(
            m.uniforms.uCorners.value,
            {
              y: 1,
              duration: 0.5,
              // ease: Power4.easeInOut,
            },
            0.1
          )
          .to(
            m.uniforms.uCorners.value,
            {
              z: 1,
              duration: 0.5,
              // ease: Power4.easeInOut,
            },
            0.2
          )
          .to(
            m.uniforms.uCorners.value,
            {
              w: 1,
              duration: 0.5,
              // ease: Power4.easeInOut,
            },
            0.3
          );
      });

      this.closeBtn.addEventListener("click", () => {
        if (this.activeImageIndex) {
          this.tween.reverse();

          this.activeImageIndex = null;
          document.querySelector(".images-container").style.pointerEvents =
            "all";

          this.closeBtnTween.reverse();
        }
      });

      img.addEventListener("mouseover", () => {
        gsap.to(m.uniforms.uProgress, {
          value: 1,
          duration: 0.5,
        });
      });
      img.addEventListener("mouseout", () => {
        gsap.to(m.uniforms.uProgress, {
          value: 0,
          duration: 0.5,
        });
      });

      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        tween: this.tween,
        img: img,
        mesh: this.mesh,
        texture: texture,
      };
    });
  }

  setPosition() {
    this.imagesStore.map((o) => {
      o.mesh.position.x = o.left - this.sizes.width / 2 + o.width / 2;
      o.mesh.position.y =
        window.scrollY - o.top + this.sizes.height / 2 - o.height / 2;
    });
  }

  render() {
    this.time += 0.05;

    // this.material.uniforms.uTime.value = this.time;
    this.imagesStore.map((o) => {
      o.mesh.material.uniforms.uTime.value = this.time;
      o.mesh.material.uniforms.uRgbShiftAmount.value =
        this.settings.rgbShiftAmount;
    });

    this.setPosition();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }
}
