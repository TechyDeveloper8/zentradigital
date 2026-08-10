import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DigitalEcosystem3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene Setup — Studio White Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.03);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8.5);

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Lighting — Crisp White with Deep Red Accent Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.5);
    mainSun.position.set(10, 20, 15);
    mainSun.castShadow = true;
    scene.add(mainSun);

    const redAccentLight = new THREE.PointLight(0xE00000, 3.5, 25);
    redAccentLight.position.set(0, 0, 2);
    scene.add(redAccentLight);

    const softFillLight = new THREE.DirectionalLight(0x222222, 1.0);
    softFillLight.position.set(-10, -10, -10);
    scene.add(softFillLight);

    // Master Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Materials
    const matteBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.25,
      metalness: 0.8,
    });

    const matteWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.2,
      metalness: 0.1,
    });

    const redEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xE00000,
      emissive: 0xE00000,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    const glassFrameMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transmission: 0.6,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    // 1. Central ZENTRA Core (Embossed Ring with Red Glow Nucleus)
    const coreGroup = new THREE.Group();

    const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 16, 64);
    const ringMesh = new THREE.Mesh(ringGeo, matteBlackMat);
    coreGroup.add(ringMesh);

    const innerCoreGeo = new THREE.IcosahedronGeometry(0.5, 2);
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, redEmissiveMat);
    coreGroup.add(innerCoreMesh);

    masterGroup.add(coreGroup);

    // 2. Floating 3D Ecosystem Objects
    const ecosystemObjects = [];

    // Helper: Create Floating Node Box Container
    const createObjectNode = (geometry, material, pos, rotSpeed, label) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(pos.x, pos.y, pos.z);

      const mesh = new THREE.Mesh(geometry, material);
      nodeGroup.add(mesh);

      // Subtle Outer Wire Ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.015, 8, 32), matteBlackMat);
      nodeGroup.add(ring);

      masterGroup.add(nodeGroup);
      ecosystemObjects.push({ group: nodeGroup, rotSpeed, initialPos: { ...pos }, label });
      return nodeGroup;
    };

    // Object A: YouTube Play Button (Play Cone/Extrude in Black Frame)
    const playGeo = new THREE.ConeGeometry(0.35, 0.6, 3);
    playGeo.rotateZ(-Math.PI / 2);
    createObjectNode(playGeo, redEmissiveMat, { x: -2.8, y: 1.8, z: 0.5 }, 0.01, 'YOUTUBE');

    // Object B: Instagram Camera Lens Box
    const cameraBoxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.25);
    createObjectNode(cameraBoxGeo, matteBlackMat, { x: 2.8, y: 1.6, z: 0.2 }, 0.012, 'INSTAGRAM');

    // Object C: Analytics 3D Bar Chart
    const chartGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const barHeight = 0.3 + i * 0.25;
      const barGeo = new THREE.BoxGeometry(0.12, barHeight, 0.12);
      const barMat = i === 2 ? redEmissiveMat : matteBlackMat;
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set((i - 1) * 0.18, barHeight / 2 - 0.3, 0);
      chartGroup.add(bar);
    }
    const chartContainer = new THREE.Group();
    chartContainer.position.set(2.4, -1.8, 0.8);
    chartContainer.add(chartGroup);
    masterGroup.add(chartContainer);
    ecosystemObjects.push({ group: chartContainer, rotSpeed: 0.008, initialPos: { x: 2.4, y: -1.8, z: 0.8 }, label: 'ANALYTICS' });

    // Object D: Website / Browser Window Frame
    const browserGeo = new THREE.BoxGeometry(0.9, 0.6, 0.05);
    createObjectNode(browserGeo, glassFrameMat, { x: -2.6, y: -1.5, z: 0.4 }, -0.01, 'WEBSITE');

    // Object E: Search / SEO Magnifying Lens Ring
    const seoRingGeo = new THREE.TorusGeometry(0.32, 0.06, 12, 32);
    createObjectNode(seoRingGeo, matteBlackMat, { x: 0, y: 2.5, z: -0.5 }, 0.015, 'SEO');

    // Object F: AI Chatbot Sphere Node
    const aiSphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
    createObjectNode(aiSphereGeo, redEmissiveMat, { x: 0, y: -2.4, z: -0.2 }, -0.015, 'AI_CHATBOT');

    // Object G: CRM Interface Node
    const crmGeo = new THREE.DodecahedronGeometry(0.38);
    createObjectNode(crmGeo, matteBlackMat, { x: -3.6, y: 0.2, z: -0.8 }, 0.009, 'CRM');

    // Object H: Product Shoot Camera Lens
    const lensCylinderGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.4, 24);
    createObjectNode(lensCylinderGeo, matteBlackMat, { x: 3.5, y: -0.2, z: -0.6 }, -0.011, 'PRODUCT_SHOOT');

    // 3. Digital Red Connection Lines Network
    const lineMat = new THREE.LineBasicMaterial({ color: 0xE00000, transparent: true, opacity: 0.4 });
    const networkLinesGroup = new THREE.Group();

    ecosystemObjects.forEach((item) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(item.initialPos.x, item.initialPos.y, item.initialPos.z),
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      networkLinesGroup.add(line);
    });
    masterGroup.add(networkLinesGroup);

    // 4. Subtle Background Digital Particles
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 18;
      particlePos[i + 1] = (Math.random() - 0.5) * 14;
      particlePos[i + 2] = (Math.random() - 0.5) * 20;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x0A0A0A,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    let targetZ = 0;

    const handleMouseMove = (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY = mouseX * 0.25;
      targetRotX = mouseY * 0.2;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight || 1;
      const progress = scrollY / maxScroll;

      targetZ = progress * 4;
      coreGroup.rotation.z = progress * Math.PI * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Responsive Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Core Rotation & Floating Pulse
      innerCoreMesh.rotation.y = elapsedTime * 0.8;
      ringMesh.rotation.x = elapsedTime * 0.4;
      ringMesh.rotation.y = elapsedTime * 0.3;

      // Rotate individual ecosystem 3D objects
      ecosystemObjects.forEach((obj, idx) => {
        obj.group.rotation.x += obj.rotSpeed;
        obj.group.rotation.y += obj.rotSpeed * 1.2;
        obj.group.position.y = obj.initialPos.y + Math.sin(elapsedTime * 1.5 + idx) * 0.08;
      });

      // Master Group Smooth Lerp
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.position.z += (targetZ - masterGroup.position.z) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
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
