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

    // 2. Camera Setup (Angled view for maximum depth)
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

    // Interior Red Light (grows during energy buildup & opening)
    const boxInteriorLight = new THREE.PointLight(0xE00000, 0, 12);
    boxInteriorLight.position.set(2.3, 0.2, 0);
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
    const defaultRotY = -Math.PI * 0.18;
    const defaultRotX = Math.PI * 0.06;
    boxGroup.rotation.y = defaultRotY;
    boxGroup.rotation.x = defaultRotX;
    scene.add(boxGroup);

    // Standard Materials
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.25,
      metalness: 0.85,
    });

    const glossyBlackMat = new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.1,
      metalness: 0.9,
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

    // Red LED Trim seam around lip
    const trimGeo = new THREE.BoxGeometry(1.94, 0.04, 1.34);
    const trimMesh = new THREE.Mesh(trimGeo, redAccentMat);
    trimMesh.position.y = 0.01;
    boxGroup.add(trimMesh);

    // --- B. HINGED TOP LID ---
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.01, -0.65); // Hinge line at rear
    boxGroup.add(lidPivot);

    const lidGeo = new THREE.BoxGeometry(1.92, 0.12, 1.32);
    lidGeo.translate(0, 0.06, 0.66);
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

    // --- C. EXACTLY 5 RECOGNIZABLE 3D SOCIAL MEDIA ICONS ---
    const iconsGroup = new THREE.Group();
    boxGroup.add(iconsGroup);

    // Helper to draw textured canvas faces for 100% crisp logo recognition
    const createLogoTexture = (drawFn) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      drawFn(ctx, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // 1. INSTAGRAM 3D MODEL (LARGE - Upper Left)
    const createInstagram3D = () => {
      const g = new THREE.Group();
      // Thick 3D Rounded Square Body
      const bodyGeo = new THREE.BoxGeometry(0.68, 0.68, 0.18);
      const body = new THREE.Mesh(bodyGeo, glossyBlackMat);
      body.castShadow = true;
      g.add(body);

      // Camera Outer Bevel Ring
      const outerRingGeo = new THREE.TorusGeometry(0.18, 0.022, 16, 32);
      const outerRing = new THREE.Mesh(outerRingGeo, whiteMat);
      outerRing.position.z = 0.10;
      g.add(outerRing);

      // Camera Lens Center
      const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24);
      lensGeo.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeo, redAccentMat);
      lens.position.z = 0.10;
      g.add(lens);

      // Camera Flash Dot
      const flashGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const flash = new THREE.Mesh(flashGeo, whiteMat);
      flash.position.set(0.20, 0.20, 0.10);
      g.add(flash);

      return g;
    };

    // 2. FACEBOOK 3D MODEL (LARGE - Upper Right)
    const createFacebook3D = () => {
      const g = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(0.68, 0.68, 0.18);
      const body = new THREE.Mesh(bodyGeo, glossyBlackMat);
      body.castShadow = true;
      g.add(body);

      // Extruded Physical 3D 'f' Emblem
      const fStemGeo = new THREE.BoxGeometry(0.09, 0.44, 0.05);
      fStemGeo.translate(0.06, -0.02, 0.11);
      const fStem = new THREE.Mesh(fStemGeo, whiteMat);
      g.add(fStem);

      const fBarGeo = new THREE.BoxGeometry(0.22, 0.08, 0.05);
      fBarGeo.translate(0.06, 0.06, 0.11);
      const fBar = new THREE.Mesh(fBarGeo, whiteMat);
      g.add(fBar);

      const fTopGeo = new THREE.BoxGeometry(0.18, 0.08, 0.05);
      fTopGeo.translate(0.11, 0.18, 0.11);
      const fTop = new THREE.Mesh(fTopGeo, whiteMat);
      g.add(fTop);

      return g;
    };

    // 3. WHATSAPP 3D MODEL (MEDIUM/SMALLER - Floating behind)
    const createWhatsApp3D = () => {
      const g = new THREE.Group();
      // Speech Bubble Base
      const bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.14, 32);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, blackMat);
      body.castShadow = true;
      g.add(body);

      // Tail of Speech Bubble
      const tailGeo = new THREE.ConeGeometry(0.10, 0.18, 3);
      tailGeo.rotateZ(-Math.PI * 0.75);
      tailGeo.rotateX(Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, blackMat);
      tail.position.set(-0.20, -0.20, 0);
      g.add(tail);

      // WhatsApp Phone Emblem Ring
      const phoneRingGeo = new THREE.TorusGeometry(0.12, 0.02, 12, 24, Math.PI * 0.65);
      phoneRingGeo.rotateZ(Math.PI * 0.2);
      const phoneRing = new THREE.Mesh(phoneRingGeo, redAccentMat);
      phoneRing.position.z = 0.08;
      g.add(phoneRing);

      return g;
    };

    // 4. YOUTUBE 3D MODEL (MEDIUM/SMALLER - Floating behind)
    const createYouTube3D = () => {
      const g = new THREE.Group();
      // Rounded 3D Play Card
      const bodyGeo = new THREE.BoxGeometry(0.72, 0.48, 0.14);
      const body = new THREE.Mesh(bodyGeo, glossyBlackMat);
      body.castShadow = true;
      g.add(body);

      // Recessed/Extruded 3D Play Triangle Prism
      const playShape = new THREE.ConeGeometry(0.16, 0.05, 3);
      playShape.rotateZ(-Math.PI / 2);
      playShape.rotateX(Math.PI / 2);
      const playMesh = new THREE.Mesh(playShape, redAccentMat);
      playMesh.position.set(0.02, 0, 0.09);
      g.add(playMesh);

      return g;
    };

    // 5. LINKEDIN 3D MODEL (MEDIUM/SMALLER - Floating behind)
    const createLinkedIn3D = () => {
      const g = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(0.58, 0.58, 0.14);
      const body = new THREE.Mesh(bodyGeo, blackMat);
      body.castShadow = true;
      g.add(body);

      // Extruded 3D 'i' dot & stem
      const iDotGeo = new THREE.SphereGeometry(0.04, 12, 12);
      iDotGeo.translate(-0.16, 0.14, 0.09);
      const iDot = new THREE.Mesh(iDotGeo, whiteMat);
      g.add(iDot);

      const iStemGeo = new THREE.BoxGeometry(0.07, 0.20, 0.04);
      iStemGeo.translate(-0.16, -0.04, 0.09);
      const iStem = new THREE.Mesh(iStemGeo, whiteMat);
      g.add(iStem);

      // Extruded 3D 'n' stem & arch
      const nStemGeo = new THREE.BoxGeometry(0.07, 0.20, 0.04);
      nStemGeo.translate(0.02, -0.04, 0.09);
      const nStem = new THREE.Mesh(nStemGeo, whiteMat);
      g.add(nStem);

      const nArchGeo = new THREE.BoxGeometry(0.14, 0.07, 0.04);
      nArchGeo.translate(0.09, 0.02, 0.09);
      const nArch = new THREE.Mesh(nArchGeo, whiteMat);
      g.add(nArch);

      const nLegGeo = new THREE.BoxGeometry(0.07, 0.14, 0.04);
      nLegGeo.translate(0.13, -0.07, 0.09);
      const nLeg = new THREE.Mesh(nLegGeo, whiteMat);
      g.add(nLeg);

      return g;
    };

    // The EXACT 5 Social Media Icons Data Hierarchy
    const fiveIconsSpecs = [
      {
        name: 'Instagram',
        createFn: createInstagram3D,
        targetPos: new THREE.Vector3(-2.1, 2.1, 1.4), // Large Upper Left
        targetRot: new THREE.Vector3(0.3, 0.4, -0.15),
        scale: 1.15,
        delayRatio: 0.0, // Launches first
      },
      {
        name: 'Facebook',
        createFn: createFacebook3D,
        targetPos: new THREE.Vector3(1.9, 2.3, 1.2), // Large Upper Right
        targetRot: new THREE.Vector3(-0.25, -0.4, 0.1),
        scale: 1.15,
        delayRatio: 0.05, // Launches first
      },
      {
        name: 'WhatsApp',
        createFn: createWhatsApp3D,
        targetPos: new THREE.Vector3(-0.2, 2.7, 0.4), // Medium Center High
        targetRot: new THREE.Vector3(0.2, 0.6, -0.2),
        scale: 0.65,
        delayRatio: 0.22, // Launches behind
      },
      {
        name: 'YouTube',
        createFn: createYouTube3D,
        targetPos: new THREE.Vector3(2.5, 0.9, 0.6), // Medium Far Right
        targetRot: new THREE.Vector3(-0.4, 0.5, -0.2),
        scale: 0.65,
        delayRatio: 0.28, // Launches behind
      },
      {
        name: 'LinkedIn',
        createFn: createLinkedIn3D,
        targetPos: new THREE.Vector3(-2.5, 0.7, 0.5), // Medium Far Left
        targetRot: new THREE.Vector3(0.4, -0.5, 0.25),
        scale: 0.65,
        delayRatio: 0.32, // Launches behind
      },
    ];

    const iconMeshes = [];

    fiveIconsSpecs.forEach((spec) => {
      const model = spec.createFn();
      model.position.set(0, -0.2, 0);
      model.scale.set(0.001, 0.001, 0.001);

      iconsGroup.add(model);
      iconMeshes.push({
        group: model,
        targetPos: spec.targetPos,
        targetRot: spec.targetRot,
        baseScale: spec.scale,
        delayRatio: spec.delayRatio,
      });
    });

    // --- D. MOUSE PARALLAX TRACKING ---
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

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

    // --- E. AUTONOMOUS 12-SECOND CINEMATIC LOOP RENDER ENGINE ---
    let animId;
    const clock = new THREE.Clock();
    const LOOP_DURATION = 12.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const loopTime = elapsedTime % LOOP_DURATION;

      let lidAngle = 0;
      let glowIntensity = 0;
      let vibrationY = 0;

      if (loopTime < 2.0) {
        // Stage 1: Closed box sitting calmly
        lidAngle = 0;
        glowIntensity = 0.2;
      } else if (loopTime < 3.0) {
        // Stage 2: Energy buildup
        const t = loopTime - 2.0; // 0 to 1
        glowIntensity = 0.2 + t * 2.5;
        vibrationY = Math.sin(t * 50) * 0.015;
      } else if (loopTime < 4.0) {
        // Stage 3: Box opens naturally
        const t = loopTime - 3.0; // 0 to 1
        const easeT = Math.pow(t, 2);
        lidAngle = -easeT * (Math.PI * 0.65);
        glowIntensity = 2.7 + t * 2.0;
      } else if (loopTime < 9.0) {
        // Stage 4 & 5: Open & Floating
        lidAngle = -Math.PI * 0.65;
        glowIntensity = 4.7 + Math.sin(loopTime * 3) * 0.5;
      } else if (loopTime < 11.0) {
        // Stage 6: Icons pull back into box
        lidAngle = -Math.PI * 0.65;
        glowIntensity = 4.7 * (1 - (loopTime - 9.0) / 2.0);
      } else {
        // Stage 7: Box closes
        const t = (loopTime - 11.0) / 1.0;
        lidAngle = -Math.PI * 0.65 * (1 - Math.pow(t, 2));
        glowIntensity = 0.2;
      }

      lidPivot.rotation.x = lidAngle;
      boxInteriorLight.intensity = glowIntensity;

      // Icon Launch & Return Physics
      iconMeshes.forEach((item, i) => {
        let iconProg = 0;

        if (loopTime < 4.0) {
          iconProg = 0;
        } else if (loopTime < 6.0) {
          // Launch phase (4.0s - 6.0s) with staggered launch delay
          const launchTime = loopTime - 4.0;
          const delay = item.delayRatio;
          const rawProg = Math.min(Math.max((launchTime - delay) / (1.8 - delay), 0), 1);
          // Ease out acceleration
          iconProg = Math.sin(rawProg * Math.PI * 0.5);
        } else if (loopTime < 9.0) {
          // Floating phase (6.0s - 9.0s)
          iconProg = 1;
        } else if (loopTime < 11.0) {
          // Pull-back phase (9.0s - 11.0s)
          const returnTime = (loopTime - 9.0) / 2.0;
          iconProg = 1 - Math.pow(returnTime, 2);
        } else {
          iconProg = 0;
        }

        // Parabolic launch trajectory + floating motion
        const floatY = loopTime >= 4.0 ? Math.sin(elapsedTime * 1.4 + i * 1.5) * 0.07 : 0;
        const currentX = THREE.MathUtils.lerp(0, item.targetPos.x, iconProg);
        const currentY = THREE.MathUtils.lerp(-0.2, item.targetPos.y + Math.sin(iconProg * Math.PI) * 0.35 + floatY, iconProg);
        const currentZ = THREE.MathUtils.lerp(0, item.targetPos.z, iconProg);

        item.group.position.set(currentX, currentY, currentZ);

        // Scale swell & shrink
        const scaleVal = item.baseScale * iconProg;
        item.group.scale.set(
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001)
        );

        // Subtle 3D rotation float (no aggressive spinning)
        item.group.rotation.x = item.targetRot.x * iconProg + Math.sin(elapsedTime * 0.8 + i) * 0.08;
        item.group.rotation.y = item.targetRot.y * iconProg + Math.cos(elapsedTime * 0.6 + i) * 0.10;
        item.group.rotation.z = item.targetRot.z * iconProg;
      });

      // Mouse Parallax
      boxGroup.rotation.y = defaultRotY + (mouseX - boxGroup.rotation.y) * 0.04;
      boxGroup.rotation.x = defaultRotX + (-mouseY - boxGroup.rotation.x) * 0.04;
      boxGroup.position.y = (window.innerWidth > 900 ? -0.4 : 0.2) + vibrationY;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
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
