import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DigitalBox3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    let animId;

    try {
      // 1. Studio White Scene & Fog
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xFFFFFF);
      scene.fog = new THREE.FogExp2(0xFFFFFF, 0.02);

      // 2. Camera Setup (3/4 Studio Product Shot Angle)
      const camera = new THREE.PerspectiveCamera(
        38,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1.25, 7.8);

      // 3. WebGL Renderer with Shadows & High Quality PBR Settings
      const isMobile = window.innerWidth <= 768;
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // 4. PBR Studio Lighting System
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      // Key Studio Light
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
      keyLight.position.set(-7, 13, 9);
      keyLight.castShadow = !isMobile;
      if (!isMobile) {
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
      }
      scene.add(keyLight);

      // Fill Light
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
      fillLight.position.set(7, 7, 7);
      scene.add(fillLight);

      // Subtle Rim Zentra Red Light
      const rimLight = new THREE.DirectionalLight(0xE00000, 1.8);
      rimLight.position.set(-8, -4, -4);
      scene.add(rimLight);

      // Interior Red Point Light
      const boxInteriorLight = new THREE.PointLight(0xFF1A1A, 0, 16);
      boxInteriorLight.position.set(2.3, 0.3, 0);
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

      // PBR Materials
      const blackMat = new THREE.MeshStandardMaterial({
        color: 0x080808,
        roughness: 0.35,
        metalness: 0.8,
      });

      const whiteMat = new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF,
        roughness: 0.12,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.5,
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
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });

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

      const createFrontBrandingTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, 1024, 512);

        ctx.font = '900 110px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('ZENTRA', 120, 210);

        ctx.font = '800 95px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#D0D0D0';
        ctx.fillText('DIGITAL', 120, 320);

        ctx.fillStyle = '#E00000';
        ctx.fillText('.', 515, 320);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      };

      const frontBrandingTex = createFrontBrandingTexture();
      const frontBrandingMat = new THREE.MeshPhysicalMaterial({
        map: frontBrandingTex,
        roughness: 0.32,
        metalness: 0.7,
        clearcoat: 0.3,
      });

      const boxWidth = 1.9;
      const boxHeight = 0.95;
      const boxDepth = 1.3;

      const baseBoxMatArray = [
        blackMat, blackMat, blackMat, blackMat,
        frontBrandingMat, blackMat,
      ];

      const baseBoxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      const baseBox = new THREE.Mesh(baseBoxGeo, baseBoxMatArray);
      baseBox.position.y = -boxHeight / 2;
      baseBox.castShadow = true;
      baseBox.receiveShadow = true;
      boxGroup.add(baseBox);

      const interiorFloorGeo = new THREE.PlaneGeometry(boxWidth - 0.2, boxDepth - 0.2);
      const interiorFloor = new THREE.Mesh(interiorFloorGeo, interiorGlowMat);
      interiorFloor.rotation.x = -Math.PI / 2;
      interiorFloor.position.y = -0.01;
      boxGroup.add(interiorFloor);

      const trimGeo = new THREE.BoxGeometry(boxWidth + 0.04, 0.04, boxDepth + 0.04);
      const trimMesh = new THREE.Mesh(trimGeo, redAccentMat);
      trimMesh.position.y = 0.01;
      boxGroup.add(trimMesh);

      const coneGeo = new THREE.ConeGeometry(1.2, 2.2, 32, 1, true);
      coneGeo.translate(0, 1.1, 0);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xE00000,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const redLightCone = new THREE.Mesh(coneGeo, coneMat);
      redLightCone.position.set(0, 0, 0);
      boxGroup.add(redLightCone);

      const particleCount = 20;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let p = 0; p < particleCount; p++) {
        particlePositions[p * 3] = (Math.random() - 0.5) * 1.4;
        particlePositions[p * 3 + 1] = Math.random() * 1.5;
        particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 1.0;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xFF3333,
        size: 0.04,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const redParticles = new THREE.Points(particleGeo, particleMat);
      boxGroup.add(redParticles);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0.01, -boxDepth / 2);
      boxGroup.add(lidPivot);

      const lidGeo = new THREE.BoxGeometry(boxWidth + 0.02, 0.12, boxDepth + 0.02);
      lidGeo.translate(0, 0.06, boxDepth / 2);
      const lidMesh = new THREE.Mesh(lidGeo, blackMat);
      lidMesh.castShadow = true;
      lidPivot.add(lidMesh);

      const lidTopTrimGeo = new THREE.BoxGeometry(boxWidth - 0.2, 0.02, boxDepth - 0.2);
      lidTopTrimGeo.translate(0, 0.13, boxDepth / 2);
      const lidTopTrim = new THREE.Mesh(lidTopTrimGeo, whiteMat);
      lidPivot.add(lidTopTrim);

      const iconsGroup = new THREE.Group();
      boxGroup.add(iconsGroup);

      const createInstagramTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
        grad.addColorStop(0.0, '#833AB4');
        grad.addColorStop(0.25, '#C13584');
        grad.addColorStop(0.50, '#E1306C');
        grad.addColorStop(0.75, '#F77737');
        grad.addColorStop(1.0, '#FCAF45');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);

        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.needsUpdate = true;
        return texture;
      };

      const instaGradTexture = createInstagramTexture();

      const createInstagram3D = () => {
        const g = new THREE.Group();

        const instaShape = createRoundedRectShape(0.74, 0.74, 0.16);
        const extrudeOpts = {
          depth: 0.16,
          bevelEnabled: true,
          bevelThickness: 0.032,
          bevelSize: 0.032,
          bevelSegments: 8,
          curveSegments: 24,
        };

        const instaFrontMat = new THREE.MeshPhysicalMaterial({
          map: instaGradTexture,
          roughness: 0.18,
          metalness: 0.0,
          clearcoat: 0.85,
          clearcoatRoughness: 0.05,
          ior: 1.5,
        });

        const instaGeo = new THREE.ExtrudeGeometry(instaShape, extrudeOpts);
        instaGeo.center();
        const body = new THREE.Mesh(instaGeo, instaFrontMat);
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);

        const camShape = createRoundedRectShape(0.40, 0.40, 0.10);
        const camHole = createRoundedRectShape(0.32, 0.32, 0.075);
        camShape.holes.push(camHole);

        const camGeo = new THREE.ExtrudeGeometry(camShape, {
          depth: 0.025,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.006,
          bevelSegments: 5,
          curveSegments: 16,
        });
        camGeo.center();
        const camMesh = new THREE.Mesh(camGeo, whiteMat);
        camMesh.position.z = 0.115;
        camMesh.castShadow = true;
        g.add(camMesh);

        const lensShape = new THREE.Shape();
        lensShape.absarc(0, 0, 0.12, 0, Math.PI * 2, false);
        const lensHole = new THREE.Path();
        lensHole.absarc(0, 0, 0.08, 0, Math.PI * 2, true);
        lensShape.holes.push(lensHole);

        const lensGeo = new THREE.ExtrudeGeometry(lensShape, {
          depth: 0.025,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.006,
          bevelSegments: 5,
          curveSegments: 24,
        });
        lensGeo.center();
        const lens = new THREE.Mesh(lensGeo, whiteMat);
        lens.position.z = 0.115;
        lens.castShadow = true;
        g.add(lens);

        const flashGeo = new THREE.SphereGeometry(0.032, 20, 20);
        const flash = new THREE.Mesh(flashGeo, whiteMat);
        flash.position.set(0.125, 0.125, 0.115);
        flash.castShadow = true;
        g.add(flash);

        return g;
      };

      const createFacebook3D = () => {
        const g = new THREE.Group();

        const fbShape = new THREE.Shape();
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
          roughness: 0.14,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          ior: 1.5,
        });

        const fbGeo = new THREE.ExtrudeGeometry(fbShape, extrudeOpts);
        fbGeo.center();
        const fbMesh = new THREE.Mesh(fbGeo, fbMat);
        fbMesh.castShadow = true;
        g.add(fbMesh);

        return g;
      };

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
          roughness: 0.14,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          ior: 1.5,
        });

        const ytGeo = new THREE.ExtrudeGeometry(ytShape, extrudeOpts);
        ytGeo.center();
        const ytMesh = new THREE.Mesh(ytGeo, ytMat);
        ytMesh.castShadow = true;
        g.add(ytMesh);

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

      const createLinkedIn3D = () => {
        const g = new THREE.Group();

        const liShape = new THREE.Shape();
        liShape.moveTo(-0.28, 0.16);
        liShape.lineTo(-0.16, 0.16);
        liShape.lineTo(-0.16, 0.28);
        liShape.lineTo(-0.28, 0.28);
        liShape.closePath();

        liShape.moveTo(-0.28, -0.26);
        liShape.lineTo(-0.16, -0.26);
        liShape.lineTo(-0.16, 0.08);
        liShape.lineTo(-0.28, 0.08);
        liShape.closePath();

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
          roughness: 0.14,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          ior: 1.5,
        });

        const liGeo = new THREE.ExtrudeGeometry(liShape, extrudeOpts);
        liGeo.center();
        const liMesh = new THREE.Mesh(liGeo, liMat);
        liMesh.castShadow = true;
        g.add(liMesh);

        return g;
      };

      const iconsSpecs = [
        {
          name: 'Instagram',
          createFn: createInstagram3D,
          targetPos: new THREE.Vector3(0.0, 2.4, 1.2),
          targetRot: new THREE.Vector3(0.15, 0.0, -0.05),
          scale: 1.20,
          launchSec: 2.00,
        },
        {
          name: 'Facebook',
          createFn: createFacebook3D,
          targetPos: new THREE.Vector3(1.85, 1.8, 1.0),
          targetRot: new THREE.Vector3(-0.2, -0.35, 0.1),
          scale: 1.05,
          launchSec: 2.15,
        },
        {
          name: 'LinkedIn',
          createFn: createLinkedIn3D,
          targetPos: new THREE.Vector3(-1.85, 1.8, 1.0),
          targetRot: new THREE.Vector3(0.04, -0.05, 0.0),
          scale: 0.70,
          launchSec: 2.35,
        },
        {
          name: 'YouTube',
          createFn: createYouTube3D,
          targetPos: new THREE.Vector3(1.1, 0.95, 0.7),
          targetRot: new THREE.Vector3(-0.15, 0.2, -0.05),
          scale: 0.65,
          launchSec: 2.50,
        },
      ];

      const iconMeshes = [];

      iconsSpecs.forEach((spec) => {
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

      const clock = new THREE.Clock();
      const LOOP_DURATION = 12.0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        const loopTime = elapsedTime % LOOP_DURATION;

        let lidAngle = 0;
        let glowIntensity = 0;
        let vibrationY = 0;
        let coneOpacity = 0;

        if (loopTime < 1.0) {
          lidAngle = 0;
          glowIntensity = 0.1;
          coneOpacity = 0;
        } else if (loopTime < 1.5) {
          const t = (loopTime - 1.0) / 0.5;
          glowIntensity = 0.1 + t * 2.5;
          vibrationY = Math.sin(t * 40) * 0.012;
          coneOpacity = t * 0.15;
        } else if (loopTime < 2.0) {
          const t = (loopTime - 1.5) / 0.5;
          lidAngle = -t * (Math.PI * 0.58);
          glowIntensity = 2.6 + t * 2.0;
          coneOpacity = 0.15 + t * 0.25;
        } else if (loopTime < 8.0) {
          lidAngle = -Math.PI * 0.58;
          glowIntensity = 4.6 + Math.sin(loopTime * 2.5) * 0.4;
          coneOpacity = 0.35 + Math.sin(loopTime * 3.0) * 0.05;
        } else if (loopTime < 10.0) {
          lidAngle = -Math.PI * 0.58;
          glowIntensity = 4.6 * (1 - (loopTime - 8.0) / 2.0);
          coneOpacity = 0.35 * (1 - (loopTime - 8.0) / 2.0);
        } else if (loopTime < 11.0) {
          const t = (loopTime - 10.0) / 1.0;
          lidAngle = -Math.PI * 0.58 * (1 - Math.pow(t, 2));
          glowIntensity = 0.1;
          coneOpacity = 0;
        } else {
          lidAngle = 0;
          glowIntensity = 0.1;
          coneOpacity = 0;
        }

        lidPivot.rotation.x = lidAngle;
        boxInteriorLight.intensity = glowIntensity;
        coneMat.opacity = coneOpacity;

        const pPositions = particleGeo.attributes.position.array;
        for (let p = 0; p < particleCount; p++) {
          pPositions[p * 3 + 1] += 0.003;
          if (pPositions[p * 3 + 1] > 2.0) {
            pPositions[p * 3 + 1] = 0;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;

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

          const floatY = loopTime >= 2.0 ? Math.sin(elapsedTime * 1.5 + i * 1.2) * 0.06 : 0;
          let currentX = THREE.MathUtils.lerp(0, item.targetPos.x, iconProg);
          const currentY = THREE.MathUtils.lerp(-0.2, item.targetPos.y + Math.sin(iconProg * Math.PI) * 0.3 + floatY, iconProg);
          const currentZ = THREE.MathUtils.lerp(0, item.targetPos.z, iconProg);

          if (iconsSpecs[i].name === 'YouTube') {
            currentX = Math.min(currentX, 1.45);
          }

          item.group.position.set(currentX, currentY, currentZ);

          const scaleVal = item.baseScale * iconProg;
          item.group.scale.set(
            Math.max(scaleVal, 0.0001),
            Math.max(scaleVal, 0.0001),
            Math.max(scaleVal, 0.0001)
          );

          const isLinkedIn = iconsSpecs[i].name === 'LinkedIn';
          const rotMult = isLinkedIn ? 0.02 : 0.07;
          item.group.rotation.x = item.targetRot.x * iconProg + Math.sin(elapsedTime * 0.7 + i) * rotMult;
          item.group.rotation.y = item.targetRot.y * iconProg + Math.cos(elapsedTime * 0.5 + i) * rotMult;
          item.group.rotation.z = item.targetRot.z * iconProg;
        });

        boxGroup.rotation.y = defaultRotY + (mouseX - boxGroup.rotation.y) * 0.04;
        boxGroup.rotation.x = defaultRotX + (-mouseY - boxGroup.rotation.x) * 0.04;
        boxGroup.position.y = (window.innerWidth > 900 ? -0.4 : 0.2) + vibrationY;

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (container && renderer && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.warn('WebGL Initialization Fallback:', err);
    }
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
