import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const GlobeIntro = () => {
  const mountRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("initial");

  useEffect(() => {
    const mountPoint = mountRef.current;
    if (!mountPoint) return undefined;

    let disposed = false;
    let frameId = 0;
    let animationTime = 0;
    let lastFrameTime = 0;
    let isInView = true;
    let texturesReady = false;
    let panScheduled = false;
    let panTimer;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    mountPoint.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight, directionalLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const earthGeometry = new THREE.SphereGeometry(1.5, 48, 48);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      bumpScale: 0.02,
      metalness: 0.1,
      roughness: 0.9,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earth);

    const wireframeGeometry = new THREE.SphereGeometry(1.51, 28, 28);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    globeGroup.add(new THREE.Mesh(wireframeGeometry, wireframeMaterial));

    const imgGeometry = new THREE.CircleGeometry(0.12, 24);
    const imgMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const imgPlane = new THREE.Mesh(imgGeometry, imgMaterial);
    imgPlane.rotation.z = Math.PI;
    imgPlane.position.z = 0.1;

    const imagePivot = new THREE.Group();
    imagePivot.add(imgPlane);
    imagePivot.rotation.y = Math.PI / 180;

    const pinGroup = new THREE.Group();
    const headGeometry = new THREE.SphereGeometry(0.06, 12, 12);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.add(imagePivot);
    pinGroup.add(head);

    const baseLat = 23.8103;
    const baseLon = 180.4125;
    const finalLatRad = baseLat * (Math.PI / 180);
    const finalLonRad = baseLon * (Math.PI / 180);
    const pinPosition = new THREE.Vector3().setFromSphericalCoords(
      1.5,
      Math.PI / 2 - finalLatRad,
      finalLonRad,
    );
    pinGroup.position.copy(pinPosition);
    pinGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      pinPosition.clone().normalize(),
    );
    pinGroup.scale.setScalar(reduceMotion ? 1 : 0);
    globeGroup.add(pinGroup);

    globeGroup.rotation.y = -finalLonRad + Math.PI + Math.PI / 2.5 + 1;
    globeGroup.rotation.x = finalLatRad + 0.05;
    camera.position.set(0, 0, 5);

    const handleResize = () => {
      const width = Math.max(mountPoint.clientWidth, 1);
      const height = Math.max(mountPoint.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    };

    const canRender = () => texturesReady && isInView && !document.hidden && !disposed;

    const animate = (time) => {
      frameId = 0;
      if (!canRender()) return;

      if (lastFrameTime) {
        const delta = Math.min((time - lastFrameTime) / 1000, 0.05);
        animationTime += delta;
        if (!reduceMotion) globeGroup.rotation.y += delta * 0.24;
      }
      lastFrameTime = time;

      if (!reduceMotion && animationTime > 0.5) {
        const progress = Math.min((animationTime - 0.5) / 1, 1);
        const bounce = 1 + Math.sin(progress * Math.PI) * 0.15;
        pinGroup.scale.setScalar(progress * bounce);
        imgMaterial.opacity = THREE.MathUtils.clamp(progress * 2 - 0.5, 0, 1);

        if (progress === 1 && !panScheduled) {
          panScheduled = true;
          setAnimationPhase("pinned");
          panTimer = window.setTimeout(() => {
            if (!disposed) setAnimationPhase("panned");
          }, 500);
        }
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    const startLoop = () => {
      if (!frameId && canRender()) {
        lastFrameTime = 0;
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrameTime = 0;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView) startLoop();
        else stopLoop();
      },
      { rootMargin: "160px" },
    );
    observer.observe(mountPoint);

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const textureLoader = new THREE.TextureLoader();
    Promise.all([
      textureLoader.loadAsync("/assets/images/globe/earth-gray.jpg"),
      textureLoader.loadAsync("/assets/images/globe/earth-bump.jpg"),
      textureLoader.loadAsync("/assets/images/rajin-main.jpeg"),
    ])
      .then(([earthTexture, bumpTexture, profileTexture]) => {
        if (disposed) {
          earthTexture.dispose();
          bumpTexture.dispose();
          profileTexture.dispose();
          return;
        }

        earthTexture.colorSpace = THREE.SRGBColorSpace;
        profileTexture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = earthTexture;
        earthMaterial.bumpMap = bumpTexture;
        imgMaterial.map = profileTexture;
        earthMaterial.needsUpdate = true;
        imgMaterial.needsUpdate = true;
        imgMaterial.opacity = reduceMotion ? 1 : 0;
        texturesReady = true;

        if (reduceMotion) setAnimationPhase("panned");
        setIsReady(true);
        startLoop();
      })
      .catch(() => {
        if (!disposed) {
          texturesReady = true;
          setIsReady(true);
          setAnimationPhase("panned");
          startLoop();
        }
      });

    return () => {
      disposed = true;
      stopLoop();
      window.clearTimeout(panTimer);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose();
          });
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="relative flex h-[400px] w-full items-center overflow-hidden md:h-[500px]">
      <div
        className={`relative flex h-full w-full items-center justify-center transition-transform duration-1000 ease-in-out ${
          animationPhase === "panned" ? "md:translate-x-[-20%]" : "translate-x-0"
        }`}
      >
        <div ref={mountRef} className="h-full w-full md:w-1/2" aria-hidden="true" />
      </div>

      <div
        className={`absolute inset-y-0 right-0 flex w-full items-center justify-center px-8 transition-[opacity,transform] duration-1000 ease-in-out md:w-1/2 md:justify-start ${
          animationPhase === "panned"
            ? "translate-x-0 opacity-100"
            : "translate-x-10 opacity-0"
        }`}
      >
        <div className="max-w-md text-left">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-5xl lg:text-6xl">
            About Me
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-white md:text-lg">
            Hey! I'm Rajin Khan, a Computer Science student from Dhaka, Bangladesh. I'm proficient with Generative AI, Deep Learning, Web Development, and Graphic Design too! (My formal name is Adib Ar Rahman Khan, in case my resume confused you.)
          </p>
        </div>
      </div>

      {!isReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white dark:bg-neutral-950">
          <p className="animate-pulse text-neutral-600 dark:text-neutral-300">Locating Rajin...</p>
        </div>
      )}
    </div>
  );
};

export default GlobeIntro;
