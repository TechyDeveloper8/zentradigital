import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DigitalBox3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Studio White Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.02);

    // 2. Camera Setup (Angled Front + Top + Side view for maximum depth)
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 7.8);

    // 3. WebGL Renderer
    const isMobile = window.innerWidth <= 768;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(6, 10, 8);
    mainLight.castShadow = !isMobile;
    if (!isMobile) {
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.bias = -0.0001;
    }
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xE00000, 1.2);
    rimLight.position.set(-8, -4, -4);
    scene.add(rimLight);

    // Interior Red Light (grows as lid opens)
    const boxInteriorLight = new THREE.PointLight(0xE00000, 0, 10);
    boxInteriorLight.position.set(2.2, 0.2, 0);
    scene.add(boxInteriorLight);

    // 5. Main Right-Aligned Box Group
    const boxGroup = new THREE.Group();
    if (window.innerWidth > 900) {
      boxGroup.position.set(2.3, -0.4, 0);
      boxGroup.scale.set(1, 1, 1);
    } else {
      boxGroup.position.set(0.6, 0.2, -1.8);
      boxGroup.scale.set(0.68, 0.68, 0.68);
    }
    boxGroup.rotation.y = -Math.PI * 0.18; // Angled front-side view
    boxGroup.rotation.x = Math.PI * 0.06;
    scene.add(boxGroup);

    // Materials
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.25,
      metalness: 0.85,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.15,
      metalness: 0.1,
    });

    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xE00000,
      emissive: 0xE00000,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });

    const interiorGlowMat = new THREE.MeshStandardMaterial({
      color: 0xE00000,
      emissive: 0xE00000,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });

    // --- A. BASE CONTAINER BOX ---
    const baseGeo = new THREE.BoxGeometry(1.9, 0.95, 1.3);
    const baseBox = new THREE.Mesh(baseGeo, blackMat);
    baseBox.position.y = -0.475;
    baseBox.castShadow = true;
    baseBox.receiveShadow = true;
    boxGroup.add(baseBox);

    // Interior Red Glowing Floor
    const interiorFloorGeo = new THREE.PlaneGeometry(1.7, 1.1);
    const interiorFloor = new THREE.Mesh(interiorFloorGeo, interiorGlowMat);
    interiorFloor.rotation.x = -Math.PI / 2;
    interiorFloor.position.y = -0.01;
    boxGroup.add(interiorFloor);

    // Red LED Trim seam around base lip
    const trimGeo = new THREE.BoxGeometry(1.94, 0.04, 1.34);
    const trimMesh = new THREE.Mesh(trimGeo, redAccentMat);
    trimMesh.position.y = 0.01;
    boxGroup.add(trimMesh);

    // --- B. HINGED TOP LID ---
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.01, -0.65); // Hinge line at back
    boxGroup.add(lidPivot);

    const lidGeo = new THREE.BoxGeometry(1.92, 0.12, 1.32);
    lidGeo.translate(0, 0.06, 0.66); // Offset center to hinge
    const lidMesh = new THREE.Mesh(lidGeo, blackMat);
    lidMesh.castShadow = true;
    lidPivot.add(lidMesh);

    // White Top Trim on Lid
    const lidTopTrimGeo = new THREE.BoxGeometry(1.7, 0.02, 1.1);
    lidTopTrimGeo.translate(0, 0.13, 0.66);
    const lidTopTrim = new THREE.Mesh(lidTopTrimGeo, whiteMat);
    lidPivot.add(lidTopTrim);

    // Embossed Branding Emblem ("ZENTRA DIGITAL")
    const brandBadgeGeo = new THREE.BoxGeometry(0.8, 0.03, 0.25);
    brandBadgeGeo.translate(0, 0.15, 0.66);
    const brandBadge = new THREE.Mesh(brandBadgeGeo, redAccentMat);
    lidPivot.add(brandBadge);

    // --- C. PROCEDURAL 13 3D DIGITAL ICONS ---
    const iconsGroup = new THREE.Group();
    boxGroup.add(iconsGroup);

    // Helper to create rounded 3D box shapes
    const createBeveledBox = (w, h, d, colorHex) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.2,
        metalness: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      return mesh;
    };

    // Definitions of the 13 Ecosystem 3D Icons
    const iconDataList = [
      { name: 'Instagram', color: 0x0A0A0A, target: new THREE.Vector3(-1.8, 1.8, 0.8), rot: new THREE.Vector3(0.4, 0.6, 0) },
      { name: 'Facebook', color: 0x1A1A1A, target: new THREE.Vector3(1.6, 2.2, 0.4), rot: new THREE.Vector3(-0.3, -0.5, 0.2) },
      { name: 'WhatsApp', color: 0x0A0A0A, target: new THREE.Vector3(-2.2, 0.6, 1.2), rot: new THREE.Vector3(0.2, 0.8, -0.3) },
      { name: 'YouTube', color: 0xE00000, target: new THREE.Vector3(1.9, 1.0, 1.1), rot: new THREE.Vector3(-0.5, 0.4, 0.1) },
      { name: 'LinkedIn', color: 0x0A0A0A, target: new THREE.Vector3(-1.2, 2.6, -0.4), rot: new THREE.Vector3(0.6, -0.3, 0.2) },
      { name: 'TikTok', color: 0x1A1A1A, target: new THREE.Vector3(2.3, 1.7, -0.2), rot: new THREE.Vector3(-0.2, 0.7, -0.4) },
      { name: 'Google', color: 0xFFFFFF, target: new THREE.Vector3(0.1, 2.8, 0.5), rot: new THREE.Vector3(0.3, 0.2, 0) },
      { name: 'Analytics', color: 0x0A0A0A, target: new THREE.Vector3(-2.6, 1.2, -0.6), rot: new THREE.Vector3(-0.4, -0.6, 0.3) },
      { name: 'AI Chatbot', color: 0xE00000, target: new THREE.Vector3(2.5, 0.4, 0.6), rot: new THREE.Vector3(0.5, -0.4, -0.2) },
      { name: 'CRM', color: 0x1A1A1A, target: new THREE.Vector3(-0.8, 1.9, 1.4), rot: new THREE.Vector3(-0.2, 0.5, 0.4) },
      { name: 'SEO', color: 0xFFFFFF, target: new THREE.Vector3(0.9, 2.5, -0.8), rot: new THREE.Vector3(0.4, -0.7, 0.1) },
      { name: 'Advertising', color: 0xE00000, target: new THREE.Vector3(1.2, 1.5, 1.6), rot: new THREE.Vector3(-0.6, 0.3, -0.3) },
      { name: 'Website', color: 0x0A0A0A, target: new THREE.Vector3(-1.9, 2.4, 0.2), rot: new THREE.Vector3(0.1, -0.5, 0.2) },
    ];

    const iconMeshes = [];

    iconDataList.forEach((data, index) => {
      if (isMobile && index >= 7) return; // Optimize for mobile

      const iconGroup = new THREE.Group();

      // Main 3D Beveled Body Block
      const body = createBeveledBox(0.42, 0.42, 0.14, data.color);
      iconGroup.add(body);

      // Red Accent Ring on front face
      const ringGeo = new THREE.TorusGeometry(0.13, 0.02, 12, 24);
      const ringMesh = new THREE.Mesh(ringGeo, redAccentMat);
      ringMesh.position.z = 0.08;
      iconGroup.add(ringMesh);

      // White Center Emblem Dot/Detail
      const centerDotGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const centerDot = new THREE.Mesh(centerDotGeo, whiteMat);
      centerDot.position.z = 0.08;
      iconGroup.add(centerDot);

      // Initial state inside box (scale 0)
      iconGroup.position.set(0, -0.2, 0);
      iconGroup.scale.set(0.001, 0.001, 0.001);

      iconsGroup.add(iconGroup);
      iconMeshes.push({
        group: iconGroup,
        targetPos: data.target,
        targetRot: data.rot,
        initialScale: 0.45,
      });
    });

    // --- D. SCROLL INTERACTION LOGIC ---
    let scrollProgress = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 1.2 || 1;
      scrollProgress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
    };

    window.addEventListener('scroll', handleScroll);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      if (window.innerWidth <= 900) {
        boxGroup.position.set(0.6, 0.2, -1.8);
        boxGroup.scale.set(0.68, 0.68, 0.68);
      } else {
        boxGroup.position.set(2.3, -0.4, 0);
        boxGroup.scale.set(1, 1, 1);
      }
    };

    window.addEventListener('resize', handleResize);

    // --- E. ANIMATION RENDER LOOP ---
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Stage 1: Closed -> Opening (0 to 0.3)
      const openProgress = Math.min(Math.max(scrollProgress / 0.35, 0), 1);
      // Smooth cubic opening curve
      const lidAngle = -Math.pow(openProgress, 2) * (Math.PI * 0.65);
      lidPivot.rotation.x = lidAngle;

      // Internal light intensifies as lid opens
      boxInteriorLight.intensity = openProgress * 4.5;

      // Stage 2 & 3: Icons Launch & Spread (0.25 to 0.85)
      const launchProgress = Math.min(Math.max((scrollProgress - 0.2) / 0.6, 0), 1);

      iconMeshes.forEach((item, i) => {
        // Staggered launch delay per icon
        const delay = (i / iconMeshes.length) * 0.25;
        const iconProg = Math.min(Math.max((launchProgress - delay) / (1 - delay), 0), 1);

        // Smooth parabolic trajectory out of box
        const currentX = THREE.MathUtils.lerp(0, item.targetPos.x, iconProg);
        const currentY = THREE.MathUtils.lerp(-0.2, item.targetPos.y + Math.sin(iconProg * Math.PI) * 0.4, iconProg);
        const currentZ = THREE.MathUtils.lerp(0, item.targetPos.z, iconProg);

        item.group.position.set(currentX, currentY, currentZ);

        // Scale swell
        const scaleVal = item.initialScale * Math.sin(iconProg * Math.PI * 0.5);
        item.group.scale.set(
          Math.max(scaleVal, 0.001),
          Math.max(scaleVal, 0.001),
          Math.max(scaleVal, 0.001)
        );

        // Rotation float
        item.group.rotation.x = item.targetRot.x * iconProg + Math.sin(elapsedTime + i) * 0.15;
        item.group.rotation.y = item.targetRot.y * iconProg + Math.cos(elapsedTime * 0.8 + i) * 0.2;
        item.group.rotation.z = item.targetRot.z * iconProg;
      });

      // Subtle Box Group idle hover & scroll rotation
      boxGroup.rotation.y = -Math.PI * 0.18 + Math.sin(elapsedTime * 0.5) * 0.04 + scrollProgress * 0.3;
      camera.position.z = 7.8 - scrollProgress * 0.8;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
