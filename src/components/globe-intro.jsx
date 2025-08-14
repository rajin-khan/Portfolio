import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';

const GlobeIntro = () => {
  const mountRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('initial'); // initial, pinned, panned

  useEffect(() => {
    if (!mountRef.current || isReady) return;

    let isMounted = true;
    const mountPoint = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountPoint.clientWidth / mountPoint.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountPoint.clientWidth, mountPoint.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountPoint.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Texture Loading
    const textureLoader = new TextureLoader();
    const profileTexture = textureLoader.load('/assets/images/rajin-main.jpeg');

    // Create a new group for the globe and its wireframe to apply grayscale
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      bumpScale: 0.02,
      metalness: 0.1,
      roughness: 0.9,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earth);

    // Process Earth texture to be grayscale
    textureLoader.load('/assets/images/globe/earth.jpg', (colorTexture) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = colorTexture.image.width;
      canvas.height = colorTexture.image.height;
      context.filter = 'grayscale(100%)';
      context.drawImage(colorTexture.image, 0, 0);
      const grayscaleTexture = new THREE.CanvasTexture(canvas);
      earthMaterial.map = grayscaleTexture;
      earthMaterial.needsUpdate = true;
    });
    textureLoader.load('/assets/images/globe/earth_bump.png', (bumpMap) => {
        earthMaterial.bumpMap = bumpMap;
        earthMaterial.needsUpdate = true;
    });

    // Wireframe Overlay
    const wireframeGeometry = new THREE.SphereGeometry(1.51, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globeGroup.add(wireframe);

    // --- IMAGE POSITION FINE-TUNING ---
    // Adjust these values to move the image spherically AROUND the pin.
    const imageOrbitAngle = 1;  // degrees: Rotates left/right around the pin (0 = front)
    const imageTiltAngle = 0;   // degrees: Tilts the image up or down
    const imageDistance = 0.1; // How far the image is from the pin head's center

    // Profile Image for Pin (Now in COLOR)
    const imgGeometry = new THREE.CircleGeometry(0.12, 32);
    const imgMaterial = new THREE.MeshBasicMaterial({
      map: profileTexture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const imgPlane = new THREE.Mesh(imgGeometry, imgMaterial);

    imgPlane.rotation.z = Math.PI;
    // Position the image out from the pivot point
    imgPlane.position.z = imageDistance;

    // Create a pivot for the image to achieve spherical rotation
    const imagePivot = new THREE.Group();
    imagePivot.add(imgPlane);
    imagePivot.rotation.y = imageOrbitAngle * (Math.PI / 180);
    imagePivot.rotation.x = imageTiltAngle * (Math.PI / 180);

    // Pin Marker
    const pinGroup = new THREE.Group();
    const headGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    pinGroup.add(head);
    head.add(imagePivot); // Attach the image pivot to the pin head

    // --- PIN POSITION FINE-TUNING ---
    // Adjust these values in DEGREES to move the pin along the globe's surface.
    const latOffsetDegrees = 0.0; // Positive moves North (up), Negative moves South (down)
    const lonOffsetDegrees = 90.0; // Positive moves East (right), Negative moves West (left)
    
    const baseLat = 23.8103;
    const baseLon = 90.4125;
    const radius = 1.5;

    const finalLat = baseLat + latOffsetDegrees;
    const finalLon = baseLon + lonOffsetDegrees;

    const finalLatRad = finalLat * (Math.PI / 180);
    const finalLonRad = finalLon * (Math.PI / 180);

    const pinPosition = new THREE.Vector3();
    pinPosition.setFromSphericalCoords(radius, Math.PI / 2 - finalLatRad, finalLonRad);
    pinGroup.position.copy(pinPosition);
    pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pinPosition.clone().normalize());
    pinGroup.scale.set(0, 0, 0);
    globeGroup.add(pinGroup); // Attach pin to the globe group

    // Set initial rotation of the Earth to center the final pin position
    const initialRotationY = -finalLonRad + Math.PI + Math.PI / 2.5 + 1; 
    const initialRotationX = finalLatRad + 0.05; // Positive value tilts North Pole towards camera (downwards)
    
    globeGroup.rotation.y = initialRotationY;
    globeGroup.rotation.x = initialRotationX;

    // Camera
    camera.position.set(0, 0, 5);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (!isMounted) return;
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Constant gentle rotation
      globeGroup.rotation.y += 0.001;

      // Pin animation
      if (elapsed > 0.5 && animationPhase === 'initial') {
        const progress = Math.min((elapsed - 0.5) / 1.0, 1.0);
        const scale = THREE.MathUtils.lerp(0, 1.0, progress);
        const bounce = 1 + Math.sin(progress * Math.PI) * 0.15;
        pinGroup.scale.setScalar(scale * bounce);
        imgMaterial.opacity = THREE.MathUtils.lerp(0, 1, progress * 2 - 0.5);

        if (progress >= 1.0) {
          setAnimationPhase('pinned');
          setTimeout(() => setAnimationPhase('panned'), 500);
        }
      }
      
      renderer.render(scene, camera);
    };

    animate();
    setIsReady(true);

    const handleResize = () => {
      if (!mountPoint) return;
      camera.aspect = mountPoint.clientWidth / mountPoint.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountPoint.clientWidth, mountPoint.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (mountPoint && renderer.domElement) {
        mountPoint.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-neutral-950 flex items-center">
      <div 
        className={`relative w-full h-full flex items-center justify-center transition-transform duration-1000 ease-in-out
                    ${animationPhase === 'panned' ? 'md:translate-x-[-20%]' : 'translate-x-0'}`}
      >
        <div ref={mountRef} className="w-full md:w-1/2 h-full" />
      </div>

      <div className={`absolute inset-y-0 right-0 w-full md:w-1/2 flex items-center justify-center md:justify-start px-8 
                      transition-all duration-1000 ease-in-out
                      ${animationPhase === 'panned' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
      >
        <div className="text-left max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            About Me
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white md:text-lg">
            Hey! I'm Rajin Khan, a Computer Science student from Dhaka, Bangladesh. I'm proficient with Generative AI, Deep Learning, Web Development, and Graphic Design too! (My formal name is Adib Ar Rahman Khan, in case my resume confused you.)
          </p>
        </div>
      </div>
      {!isReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-950">
          <p className="text-white animate-pulse">Initializing quantum realm...</p>
        </div>
      )}
    </div>
  );
};

export default GlobeIntro;