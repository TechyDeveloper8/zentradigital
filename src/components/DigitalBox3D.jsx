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

    // 2. Camera Setup (50mm equivalent perspective angle for zero wide-angle distortion)
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 7.8);

    // 3. WebGL Renderer with Shadows & High Quality Studio Settings
    const isMobile = window.innerWidth <= 768;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    // Key Studio Light (Upper Left)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(-6, 12, 8);
    keyLight.castShadow = !isMobile;
    if (!isMobile) {
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0001;
    }
    scene.add(keyLight);

    // Fill Soft White Light (Right)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(6, 6, 6);
    scene.add(fillLight);

    // Rim Zentra Red Light (From box rear)
    const rimLight = new THREE.DirectionalLight(0xE00000, 1.4);
    rimLight.position.set(-8, -4, -4);
    scene.add(rimLight);

    // Interior Red Light (grows during energy buildup & opening)
    const boxInteriorLight = new THREE.PointLight(0xE00000, 0, 14);
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

    // Standard Box Materials
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

    // Red LED Trim seam around lip
    const trimGeo = new THREE.BoxGeometry(1.94, 0.04, 1.34);
    const trimMesh = new THREE.Mesh(trimGeo, redAccentMat);
    trimMesh.position.y = 0.01;
    boxGroup.add(trimMesh);

    // --- B. HINGED TOP LID ---
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.01, -0.65);
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

    // --- C. EXACTLY 5 REALISTIC 3D SOCIAL MEDIA HERO OBJECTS ---
    const iconsGroup = new THREE.Group();
    boxGroup.add(iconsGroup);

    // Texture Generator Helper for Official Instagram Gradient
    const createInstagramTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#5B2A86');
      grad.addColorStop(0.25, '#C13584');
      grad.addColorStop(0.50, '#E1306C');
      grad.addColorStop(0.75, '#F56040');
      grad.addColorStop(1.0, '#FCAF45');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    const instaGradTexture = createInstagramTexture();

    // 1. INSTAGRAM — 100% LARGE HERO OBJECT
    const createInstagram3D = () => {
      const g = new THREE.Group();

      // Front Face Material with Instagram Gradient
      const instaFrontMat = new THREE.MeshPhysicalMaterial({
        map: instaGradTexture,
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
      });

      const instaSideMat = new THREE.MeshStandardMaterial({
        color: 0x3d1754,
        roughness: 0.25,
        metalness: 0.7,
      });

      // 3D Rounded Square Body with physical depth
      const bodyGeo = new THREE.BoxGeometry(0.72, 0.72, 0.20);
      const materials = [
        instaSideMat, instaSideMat, instaSideMat, instaSideMat,
        instaFrontMat, instaSideMat,
      ];
      const body = new THREE.Mesh(bodyGeo, materials);
      body.castShadow = true;
      g.add(body);

      // Extruded Physical White Camera Symbol
      const outerRingGeo = new THREE.TorusGeometry(0.19, 0.024, 16, 32);
      const outerRing = new THREE.Mesh(outerRingGeo, whiteMat);
      outerRing.position.z = 0.11;
      g.add(outerRing);

      const lensGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 24);
      lensGeo.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeo, whiteMat);
      lens.position.z = 0.11;
      g.add(lens);

      const flashGeo = new THREE.SphereGeometry(0.038, 16, 16);
      const flash = new THREE.Mesh(flashGeo, whiteMat);
      flash.position.set(0.21, 0.21, 0.11);
      g.add(flash);

      return g;
    };

    // 2. FACEBOOK — 90% LARGE HERO OBJECT
    const createFacebook3D = () => {
      const g = new THREE.Group();

      const fbFrontMat = new THREE.MeshStandardMaterial({
        color: 0x1877F2,
        roughness: 0.2,
        metalness: 0.4,
      });

      const fbSideMat = new THREE.MeshStandardMaterial({
        color: 0x0a3c82,
        roughness: 0.35,
        metalness: 0.6,
      });

      const bodyGeo = new THREE.BoxGeometry(0.72, 0.72, 0.20);
      const materials = [
        fbSideMat, fbSideMat, fbSideMat, fbSideMat,
        fbFrontMat, fbSideMat,
      ];
      const body = new THREE.Mesh(bodyGeo, materials);
      body.castShadow = true;
      g.add(body);

      // Extruded Physical 3D 'f' Emblem
      const fStemGeo = new THREE.BoxGeometry(0.10, 0.46, 0.06);
      fStemGeo.translate(0.07, -0.02, 0.12);
      const fStem = new THREE.Mesh(fStemGeo, whiteMat);
      g.add(fStem);

      const fBarGeo = new THREE.BoxGeometry(0.24, 0.09, 0.06);
      fBarGeo.translate(0.07, 0.06, 0.12);
      const fBar = new THREE.Mesh(fBarGeo, whiteMat);
      g.add(fBar);

      const fTopGeo = new THREE.BoxGeometry(0.20, 0.09, 0.06);
      fTopGeo.translate(0.12, 0.19, 0.12);
      const fTop = new THREE.Mesh(fTopGeo, whiteMat);
      g.add(fTop);

      return g;
    };

    // 3. WHATSAPP — 60% SMALLER OBJECT
    const createWhatsApp3D = () => {
      const g = new THREE.Group();

      const waMat = new THREE.MeshStandardMaterial({
        color: 0x25D366,
        roughness: 0.3,
        metalness: 0.2,
      });

      const waSideMat = new THREE.MeshStandardMaterial({
        color: 0x126932,
        roughness: 0.4,
        metalness: 0.4,
      });

      const bodyGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.16, 32);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, waMat);
      body.castShadow = true;
      g.add(body);

      const tailGeo = new THREE.ConeGeometry(0.11, 0.20, 3);
      tailGeo.rotateZ(-Math.PI * 0.75);
      tailGeo.rotateX(Math.PI / 2);
      const tail = new THREE.Mesh(tailGeo, waSideMat);
      tail.position.set(-0.21, -0.21, 0);
      g.add(tail);

      // WhatsApp Phone Handset Emblem
      const phoneRingGeo = new THREE.TorusGeometry(0.13, 0.024, 12, 24, Math.PI * 0.65);
      phoneRingGeo.rotateZ(Math.PI * 0.2);
      const phoneRing = new THREE.Mesh(phoneRingGeo, whiteMat);
      phoneRing.position.z = 0.09;
      g.add(phoneRing);

      return g;
    };

    // 4. YOUTUBE — 58% SMALLER OBJECT
    const createYouTube3D = () => {
      const g = new THREE.Group();

      const ytFrontMat = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        roughness: 0.15,
        metalness: 0.3,
      });

      const ytSideMat = new THREE.MeshStandardMaterial({
        color: 0x800000,
        roughness: 0.3,
        metalness: 0.5,
      });

      const bodyGeo = new THREE.BoxGeometry(0.76, 0.52, 0.16);
      const materials = [
        ytSideMat, ytSideMat, ytSideMat, ytSideMat,
        ytFrontMat, ytSideMat,
      ];
      const body = new THREE.Mesh(bodyGeo, materials);
      body.castShadow = true;
      g.add(body);

      // Recessed/Raised White 3D Play Triangle Prism
      const playShape = new THREE.ConeGeometry(0.17, 0.06, 3);
      playShape.rotateZ(-Math.PI / 2);
      playShape.rotateX(Math.PI / 2);
      const playMesh = new THREE.Mesh(playShape, whiteMat);
      playMesh.position.set(0.02, 0, 0.10);
      g.add(playMesh);

      return g;
    };

    // 5. LINKEDIN — 55% SMALLER OBJECT
    const createLinkedIn3D = () => {
      const g = new THREE.Group();

      const liFrontMat = new THREE.MeshStandardMaterial({
        color: 0x0A66C2,
        roughness: 0.25,
        metalness: 0.5,
      });

      const liSideMat = new THREE.MeshStandardMaterial({
        color: 0x04284d,
        roughness: 0.4,
        metalness: 0.6,
      });

      const bodyGeo = new THREE.BoxGeometry(0.62, 0.62, 0.16);
      const materials = [
        liSideMat, liSideMat, liSideMat, liSideMat,
        liFrontMat, liSideMat,
      ];
      const body = new THREE.Mesh(bodyGeo, materials);
      body.castShadow = true;
      g.add(body);

      // Extruded 3D 'in' Symbol
      const iDotGeo = new THREE.SphereGeometry(0.042, 12, 12);
      iDotGeo.translate(-0.17, 0.15, 0.10);
      const iDot = new THREE.Mesh(iDotGeo, whiteMat);
      g.add(iDot);

      const iStemGeo = new THREE.BoxGeometry(0.075, 0.22, 0.05);
      iStemGeo.translate(-0.17, -0.04, 0.10);
      const iStem = new THREE.Mesh(iStemGeo, whiteMat);
      g.add(iStem);

      const nStemGeo = new THREE.BoxGeometry(0.075, 0.22, 0.05);
      nStemGeo.translate(0.02, -0.04, 0.10);
      const nStem = new THREE.Mesh(nStemGeo, whiteMat);
      g.add(nStem);

      const nArchGeo = new THREE.BoxGeometry(0.15, 0.075, 0.05);
      nArchGeo.translate(0.09, 0.03, 0.10);
      const nArch = new THREE.Mesh(nArchGeo, whiteMat);
      g.add(nArch);

      const nLegGeo = new THREE.BoxGeometry(0.075, 0.15, 0.05);
      nLegGeo.translate(0.14, -0.07, 0.10);
      const nLeg = new THREE.Mesh(nLegGeo, whiteMat);
      g.add(nLeg);

      return g;
    };

    // EXACT 5 ICON SPECIFICATIONS & TIMELINE
    const fiveIconsSpecs = [
      {
        name: 'Instagram',
        createFn: createInstagram3D,
        targetPos: new THREE.Vector3(-2.1, 2.1, 1.4), // Upper Left
        targetRot: new THREE.Vector3(0.3, 0.4, -0.15),
        scale: 1.15, // 100% LARGE
        launchSec: 2.00, // 2.00s
      },
      {
        name: 'Facebook',
        createFn: createFacebook3D,
        targetPos: new THREE.Vector3(1.9, 2.3, 1.2), // Upper Right
        targetRot: new THREE.Vector3(-0.25, -0.4, 0.1),
        scale: 1.035, // 90% LARGE
        launchSec: 2.15, // 2.15s
      },
      {
        name: 'WhatsApp',
        createFn: createWhatsApp3D,
        targetPos: new THREE.Vector3(-0.2, 2.7, 0.4), // Middle Left High
        targetRot: new THREE.Vector3(0.2, 0.6, -0.2),
        scale: 0.69, // 60% SMALL
        launchSec: 2.35, // 2.35s
      },
      {
        name: 'YouTube',
        createFn: createYouTube3D,
        targetPos: new THREE.Vector3(2.5, 0.9, 0.6), // Middle Right
        targetRot: new THREE.Vector3(-0.4, 0.5, -0.2),
        scale: 0.667, // 58% SMALL
        launchSec: 2.50, // 2.50s
      },
      {
        name: 'LinkedIn',
        createFn: createLinkedIn3D,
        targetPos: new THREE.Vector3(-2.5, 0.7, 0.5), // Upper Middle Right
        targetRot: new THREE.Vector3(0.4, -0.5, 0.25),
        scale: 0.6325, // 55% SMALL
        launchSec: 2.70, // 2.70s
      },
    ];

    const iconMeshes = [];

    fiveIconsSpecs.forEach((spec) => {
      const model = spec.createFn();
      model.position.set(0, -0.2, 0);
      model.scale.set(0.0001, 0.0001, 0.0001);

      iconsGroup.add(model);
      iconMeshes.push({
        group: model,
        targetPos: spec.targetPos,
        targetRot: spec.targetRot,
        baseScale: spec.scale,
        launchSec: spec.launchSec,
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

    // --- E. EXACT 12-SECOND TIMELINE LOOP ENGINE ---
    let animId;
    const clock = new THREE.Clock();
    const LOOP_DURATION = 12.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const loopTime = elapsedTime % LOOP_DURATION;

      // Exact prompt timeline stages:
      // 0.0 - 1.0s: Box closed
      // 1.0 - 1.5s: Red light begins glowing inside
      // 1.5 - 2.0s: Box lid starts opening naturally
      // 2.00s: Instagram launches
      // 2.15s: Facebook launches
      // 2.35s: WhatsApp launches
      // 2.50s: YouTube launches
      // 2.70s: LinkedIn launches
      // 3.5 - 5.0s: Icons reach floating positions
      // 5.0 - 8.0s: Icons gently float
      // 8.0 - 10.0s: Icons return toward box
      // 10.0 - 11.0s: Box closes
      // 11.0 - 12.0s: Short pause

      let lidAngle = 0;
      let glowIntensity = 0;
      let vibrationY = 0;

      if (loopTime < 1.0) {
        lidAngle = 0;
        glowIntensity = 0.1;
      } else if (loopTime < 1.5) {
        const t = (loopTime - 1.0) / 0.5; // 0 to 1
        glowIntensity = 0.1 + t * 2.5;
        vibrationY = Math.sin(t * 40) * 0.012;
      } else if (loopTime < 2.0) {
        const t = (loopTime - 1.5) / 0.5; // 0 to 1
        lidAngle = -t * (Math.PI * 0.65);
        glowIntensity = 2.6 + t * 2.0;
      } else if (loopTime < 8.0) {
        lidAngle = -Math.PI * 0.65;
        glowIntensity = 4.6 + Math.sin(loopTime * 2.5) * 0.4;
      } else if (loopTime < 10.0) {
        lidAngle = -Math.PI * 0.65;
        glowIntensity = 4.6 * (1 - (loopTime - 8.0) / 2.0);
      } else if (loopTime < 11.0) {
        const t = (loopTime - 10.0) / 1.0;
        lidAngle = -Math.PI * 0.65 * (1 - Math.pow(t, 2));
        glowIntensity = 0.1;
      } else {
        lidAngle = 0;
        glowIntensity = 0.1;
      }

      lidPivot.rotation.x = lidAngle;
      boxInteriorLight.intensity = glowIntensity;

      // Icon Launch & Return Physics
      iconMeshes.forEach((item, i) => {
        let iconProg = 0;

        if (loopTime < item.launchSec) {
          iconProg = 0;
        } else if (loopTime < 5.0) {
          // Launch phase (launchSec -> 5.0s) with inertia & decelerated arrival
          const totalLaunchTime = 5.0 - item.launchSec;
          const currentLaunchTime = loopTime - item.launchSec;
          const rawProg = Math.min(Math.max(currentLaunchTime / totalLaunchTime, 0), 1);
          iconProg = Math.sin(rawProg * Math.PI * 0.5); // Ease out
        } else if (loopTime < 8.0) {
          // Floating phase (5.0s - 8.0s)
          iconProg = 1;
        } else if (loopTime < 10.0) {
          // Return phase (8.0s - 10.0s)
          const returnTime = (loopTime - 8.0) / 2.0;
          iconProg = 1 - Math.pow(returnTime, 2);
        } else {
          iconProg = 0;
        }

        // Parabolic trajectory + subtle float (±5px)
        const floatY = loopTime >= 2.0 ? Math.sin(elapsedTime * 1.5 + i * 1.2) * 0.06 : 0;
        const currentX = THREE.MathUtils.lerp(0, item.targetPos.x, iconProg);
        const currentY = THREE.MathUtils.lerp(-0.2, item.targetPos.y + Math.sin(iconProg * Math.PI) * 0.3 + floatY, iconProg);
        const currentZ = THREE.MathUtils.lerp(0, item.targetPos.z, iconProg);

        item.group.position.set(currentX, currentY, currentZ);

        // Scale swell according to prompt size hierarchy
        const scaleVal = item.baseScale * iconProg;
        item.group.scale.set(
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001)
        );

        // Subtle 3D rotation float (no rapid spinning)
        item.group.rotation.x = item.targetRot.x * iconProg + Math.sin(elapsedTime * 0.7 + i) * 0.07;
        item.group.rotation.y = item.targetRot.y * iconProg + Math.cos(elapsedTime * 0.5 + i) * 0.09;
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
