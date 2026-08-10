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

    // 2. Camera Setup (50mm equivalent angle)
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 7.8);

    // 3. WebGL Renderer with Shadows & High Quality PBR Settings
    const isMobile = window.innerWidth <= 768;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. PBR Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Soft White Key Light (Upper Left Front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(-6, 12, 8);
    keyLight.castShadow = !isMobile;
    if (!isMobile) {
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0001;
    }
    scene.add(keyLight);

    // Fill Light (Opposite Side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(6, 6, 6);
    scene.add(fillLight);

    // Subtle Rim Zentra Red Light
    const rimLight = new THREE.DirectionalLight(0xE00000, 1.5);
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

    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.4,
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

    // --- C. HIGH-PRECISION 3D SHAPE BUILDER HELPERS ---
    const iconsGroup = new THREE.Group();
    boxGroup.add(iconsGroup);

    // Helper for Rounded Rectangle 2D Shape
    const createRoundedRectShape = (w, h, r) => {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      shape.moveTo(x, y + r);
      shape.lineTo(x, y + h - r);
      shape.quadraticCurveTo(x, y + h, x + r, y + h);
      shape.lineTo(x + w - r, y + h);
      shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
      shape.lineTo(x + w, y + r);
      shape.quadraticCurveTo(x + w, y, x + w - r, y);
      shape.lineTo(x + r, y);
      shape.quadraticCurveTo(x, y, x, y + r);
      return shape;
    };

    // Official Instagram Gradient Canvas Texture Generator
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

    // 1. INSTAGRAM — 100% LARGE HERO OBJECT (Beveled Rounded Body + Raised White Camera)
    const createInstagram3D = () => {
      const g = new THREE.Group();

      const instaShape = createRoundedRectShape(0.74, 0.74, 0.16);
      const extrudeOpts = {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 6,
        curveSegments: 16,
      };

      const instaFrontMat = new THREE.MeshPhysicalMaterial({
        map: instaGradTexture,
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
      });

      const instaGeo = new THREE.ExtrudeGeometry(instaShape, extrudeOpts);
      instaGeo.center();
      const body = new THREE.Mesh(instaGeo, instaFrontMat);
      body.castShadow = true;
      g.add(body);

      // Raised Physical White Camera Outline
      const camShape = createRoundedRectShape(0.38, 0.38, 0.09);
      const camHole = createRoundedRectShape(0.30, 0.30, 0.07);
      camShape.holes.push(camHole);

      const camGeo = new THREE.ExtrudeGeometry(camShape, {
        depth: 0.03,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 4,
      });
      camGeo.center();
      const camMesh = new THREE.Mesh(camGeo, whiteMat);
      camMesh.position.z = 0.115;
      g.add(camMesh);

      // Center Camera Lens Ring
      const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24);
      lensGeo.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeo, whiteMat);
      lens.position.z = 0.115;
      g.add(lens);

      // Flash Dot
      const flashGeo = new THREE.SphereGeometry(0.032, 16, 16);
      const flash = new THREE.Mesh(flashGeo, whiteMat);
      flash.position.set(0.20, 0.20, 0.115);
      g.add(flash);

      return g;
    };

    // 2. FACEBOOK — 90% LARGE HERO OBJECT (3D Beveled "f" Sculpture)
    const createFacebook3D = () => {
      const g = new THREE.Group();

      const fbShape = new THREE.Shape();
      // Precise 3D 'f' vector contour
      fbShape.moveTo(-0.15, -0.36);
      fbShape.lineTo(-0.02, -0.36);
      fbShape.lineTo(-0.02, -0.04);
      fbShape.lineTo(0.12, -0.04);
      fbShape.lineTo(0.14, 0.08);
      fbShape.lineTo(-0.02, 0.08);
      fbShape.lineTo(-0.02, 0.20);
      fbShape.quadraticCurveTo(-0.02, 0.34, 0.12, 0.34);
      fbShape.lineTo(0.18, 0.34);
      fbShape.lineTo(0.18, 0.44);
      fbShape.lineTo(0.06, 0.44);
      fbShape.quadraticCurveTo(-0.16, 0.44, -0.16, 0.22);
      fbShape.lineTo(-0.16, 0.08);
      fbShape.lineTo(-0.24, 0.08);
      fbShape.lineTo(-0.24, -0.04);
      fbShape.lineTo(-0.16, -0.04);
      fbShape.closePath();

      const extrudeOpts = {
        depth: 0.18,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 6,
        curveSegments: 16,
      };

      const fbMat = new THREE.MeshPhysicalMaterial({
        color: 0x1877F2,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 0.4,
      });

      const fbGeo = new THREE.ExtrudeGeometry(fbShape, extrudeOpts);
      fbGeo.center();
      const fbMesh = new THREE.Mesh(fbGeo, fbMat);
      fbMesh.castShadow = true;
      g.add(fbMesh);

      return g;
    };

    // 3. WHATSAPP — 60% SMALLER OBJECT (Complete Beveled Speech-Bubble + Raised White Handset)
    const createWhatsApp3D = () => {
      const g = new THREE.Group();

      const waShape = new THREE.Shape();
      // Circle with lower-left speech bubble tail
      const r = 0.35;
      waShape.absarc(0, 0, r, 0.8 * Math.PI, 2.3 * Math.PI, false);
      waShape.lineTo(-r * 0.95, -r * 0.95);
      waShape.closePath();

      const extrudeOpts = {
        depth: 0.15,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 6,
        curveSegments: 24,
      };

      const waMat = new THREE.MeshPhysicalMaterial({
        color: 0x25D366,
        roughness: 0.2,
        metalness: 0.2,
        clearcoat: 0.3,
      });

      const waGeo = new THREE.ExtrudeGeometry(waShape, extrudeOpts);
      waGeo.center();
      const waMesh = new THREE.Mesh(waGeo, waMat);
      waMesh.castShadow = true;
      g.add(waMesh);

      // Raised Physical White Telephone Handset
      const handsetShape = new THREE.Shape();
      handsetShape.moveTo(-0.11, -0.04);
      handsetShape.quadraticCurveTo(-0.13, 0.09, -0.02, 0.14);
      handsetShape.quadraticCurveTo(0.05, 0.16, 0.12, 0.08);
      handsetShape.quadraticCurveTo(0.14, 0.04, 0.09, 0.01);
      handsetShape.quadraticCurveTo(0.05, -0.03, 0.02, 0.03);
      handsetShape.quadraticCurveTo(-0.02, 0.07, -0.04, 0.05);
      handsetShape.quadraticCurveTo(-0.08, 0.02, -0.05, -0.03);
      handsetShape.quadraticCurveTo(-0.08, -0.08, -0.11, -0.04);

      const handsetGeo = new THREE.ExtrudeGeometry(handsetShape, {
        depth: 0.025,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 3,
      });
      handsetGeo.center();
      const handsetMesh = new THREE.Mesh(handsetGeo, whiteMat);
      handsetMesh.position.set(0.01, 0.01, 0.095);
      handsetMesh.rotation.z = Math.PI * 0.12;
      g.add(handsetMesh);

      return g;
    };

    // 4. YOUTUBE — 58% SMALLER OBJECT (Rounded Capsule Button + Raised White Play Triangle)
    const createYouTube3D = () => {
      const g = new THREE.Group();

      const ytShape = createRoundedRectShape(0.78, 0.54, 0.18);
      const extrudeOpts = {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 6,
        curveSegments: 16,
      };

      const ytMat = new THREE.MeshPhysicalMaterial({
        color: 0xFF0000,
        roughness: 0.12,
        metalness: 0.3,
        clearcoat: 0.5,
      });

      const ytGeo = new THREE.ExtrudeGeometry(ytShape, extrudeOpts);
      ytGeo.center();
      const ytMesh = new THREE.Mesh(ytGeo, ytMat);
      ytMesh.castShadow = true;
      g.add(ytMesh);

      // Raised 3D White Play Triangle Prism
      const playShape = new THREE.Shape();
      playShape.moveTo(-0.08, -0.14);
      playShape.lineTo(0.14, 0);
      playShape.lineTo(-0.08, 0.14);
      playShape.closePath();

      const playGeo = new THREE.ExtrudeGeometry(playShape, {
        depth: 0.03,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 4,
      });
      playGeo.center();
      const playMesh = new THREE.Mesh(playGeo, whiteMat);
      playMesh.position.set(0.01, 0, 0.11);
      g.add(playMesh);

      return g;
    };

    // 5. LINKEDIN — 55% SMALLER OBJECT (3D Beveled "in" Sculpture)
    const createLinkedIn3D = () => {
      const g = new THREE.Group();

      const liShape = new THREE.Shape();
      // Precise 3D 'in' vector contour
      // 'i' dot
      liShape.moveTo(-0.28, 0.16);
      liShape.lineTo(-0.16, 0.16);
      liShape.lineTo(-0.16, 0.28);
      liShape.lineTo(-0.28, 0.28);
      liShape.closePath();

      // 'i' stem
      liShape.moveTo(-0.28, -0.26);
      liShape.lineTo(-0.16, -0.26);
      liShape.lineTo(-0.16, 0.08);
      liShape.lineTo(-0.28, 0.08);
      liShape.closePath();

      // 'n' stem & arch
      liShape.moveTo(-0.08, -0.26);
      liShape.lineTo(0.04, -0.26);
      liShape.lineTo(0.04, -0.02);
      liShape.quadraticCurveTo(0.04, 0.09, 0.15, 0.09);
      liShape.quadraticCurveTo(0.24, 0.09, 0.24, -0.02);
      liShape.lineTo(0.24, -0.26);
      liShape.lineTo(0.35, -0.26);
      liShape.lineTo(0.35, -0.01);
      liShape.quadraticCurveTo(0.35, 0.22, 0.15, 0.22);
      liShape.quadraticCurveTo(-0.04, 0.22, -0.08, 0.06);
      liShape.lineTo(-0.08, 0.08);
      liShape.lineTo(-0.20, 0.08);
      liShape.lineTo(-0.08, -0.26);
      liShape.closePath();

      const extrudeOpts = {
        depth: 0.15,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 6,
        curveSegments: 16,
      };

      const liMat = new THREE.MeshPhysicalMaterial({
        color: 0x0A66C2,
        roughness: 0.22,
        metalness: 0.4,
        clearcoat: 0.3,
      });

      const liGeo = new THREE.ExtrudeGeometry(liShape, extrudeOpts);
      liGeo.center();
      const liMesh = new THREE.Mesh(liGeo, liMat);
      liMesh.castShadow = true;
      g.add(liMesh);

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
        launchSec: 2.00,
      },
      {
        name: 'Facebook',
        createFn: createFacebook3D,
        targetPos: new THREE.Vector3(1.9, 2.3, 1.2), // Upper Right
        targetRot: new THREE.Vector3(-0.25, -0.4, 0.1),
        scale: 1.035, // 90% LARGE
        launchSec: 2.15,
      },
      {
        name: 'WhatsApp',
        createFn: createWhatsApp3D,
        targetPos: new THREE.Vector3(-0.2, 2.7, 0.4), // Middle Left High
        targetRot: new THREE.Vector3(0.15, 0.2, -0.05),
        scale: 0.69, // 60% SMALL
        launchSec: 2.35,
      },
      {
        name: 'YouTube',
        createFn: createYouTube3D,
        targetPos: new THREE.Vector3(1.35, 1.15, 0.7), // Floating Safely Above Box (Inside Viewport)
        targetRot: new THREE.Vector3(-0.15, 0.2, -0.05),
        scale: 0.667, // 58% SMALL
        launchSec: 2.50,
      },
      {
        name: 'LinkedIn',
        createFn: createLinkedIn3D,
        targetPos: new THREE.Vector3(-1.8, 1.1, 0.5), // Front-facing near upper-left/middle
        targetRot: new THREE.Vector3(0.04, -0.05, 0.0), // Subtle front-facing perspective
        scale: 0.6325, // 55% SMALL
        launchSec: 2.70,
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

      let lidAngle = 0;
      let glowIntensity = 0;
      let vibrationY = 0;

      if (loopTime < 1.0) {
        lidAngle = 0;
        glowIntensity = 0.1;
      } else if (loopTime < 1.5) {
        const t = (loopTime - 1.0) / 0.5;
        glowIntensity = 0.1 + t * 2.5;
        vibrationY = Math.sin(t * 40) * 0.012;
      } else if (loopTime < 2.0) {
        const t = (loopTime - 1.5) / 0.5;
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
          const totalLaunchTime = 5.0 - item.launchSec;
          const currentLaunchTime = loopTime - item.launchSec;
          const rawProg = Math.min(Math.max(currentLaunchTime / totalLaunchTime, 0), 1);
          iconProg = Math.sin(rawProg * Math.PI * 0.5);
        } else if (loopTime < 8.0) {
          iconProg = 1;
        } else if (loopTime < 10.0) {
          const returnTime = (loopTime - 8.0) / 2.0;
          iconProg = 1 - Math.pow(returnTime, 2);
        } else {
          iconProg = 0;
        }

        // Parabolic trajectory + subtle float (±5px)
        const floatY = loopTime >= 2.0 ? Math.sin(elapsedTime * 1.5 + i * 1.2) * 0.06 : 0;
        let currentX = THREE.MathUtils.lerp(0, item.targetPos.x, iconProg);
        const currentY = THREE.MathUtils.lerp(-0.2, item.targetPos.y + Math.sin(iconProg * Math.PI) * 0.3 + floatY, iconProg);
        const currentZ = THREE.MathUtils.lerp(0, item.targetPos.z, iconProg);

        // Hard Viewport Clamp for YouTube (NEVER leave viewport)
        if (fiveIconsSpecs[i].name === 'YouTube') {
          currentX = Math.min(currentX, 1.45);
        }

        item.group.position.set(currentX, currentY, currentZ);

        const scaleVal = item.baseScale * iconProg;
        item.group.scale.set(
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001),
          Math.max(scaleVal, 0.0001)
        );

        // Subtle 3D rotation float (LinkedIn stays front-facing readable)
        const isLinkedIn = fiveIconsSpecs[i].name === 'LinkedIn';
        const rotMult = isLinkedIn ? 0.02 : 0.07;
        item.group.rotation.x = item.targetRot.x * iconProg + Math.sin(elapsedTime * 0.7 + i) * rotMult;
        item.group.rotation.y = item.targetRot.y * iconProg + Math.cos(elapsedTime * 0.5 + i) * rotMult;
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
