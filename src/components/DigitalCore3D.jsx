import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DigitalCore3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Studio White Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.025);

    // Camera — Perspective tuned for Mobile & Desktop
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    // WebGL Renderer Setup
    const isMobile = window.innerWidth <= 768;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile; // Optimization for mobile battery/FPS
    container.appendChild(renderer.domElement);

    // Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const mainStudioLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainStudioLight.position.set(8, 12, 10);
    scene.add(mainStudioLight);

    const redCoreLight = new THREE.PointLight(0xE00000, 3.5, 15);
    redCoreLight.position.set(2.2, 0, 0);
    scene.add(redCoreLight);

    // Core Group — Positioned for Mobile & Desktop
    const rightCoreGroup = new THREE.Group();
    if (window.innerWidth > 900) {
      rightCoreGroup.position.set(2.2, 0, 0);
      rightCoreGroup.scale.set(1, 1, 1);
    } else {
      rightCoreGroup.position.set(0.6, 0.4, -1.5);
      rightCoreGroup.scale.set(0.7, 0.7, 0.7);
    }
    scene.add(rightCoreGroup);

    // 1. Transparent Architectural Glass Outer Sphere
    const outerGlassGeo = new THREE.IcosahedronGeometry(1.65, 4);
    const outerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.95,
      transparent: true,
      roughness: 0.08,
      ior: 1.52,
      thickness: 0.5,
      reflectivity: 0.9,
    });
    const outerSphere = new THREE.Mesh(outerGlassGeo, outerGlassMat);
    rightCoreGroup.add(outerSphere);

    // 2. Embossed Black Architectural Ring Structure
    const ringGeo = new THREE.TorusGeometry(1.9, 0.04, 16, 64);
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, blackMat);
    ringMesh.rotation.x = Math.PI / 4;
    rightCoreGroup.add(ringMesh);

    // 3. Deep Red Nucleus Core
    const innerNucleusGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const redEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xE00000,
      emissive: 0xE00000,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const nucleusMesh = new THREE.Mesh(innerNucleusGeo, redEmissiveMat);
    rightCoreGroup.add(nucleusMesh);

    // 4. Subtle Digital Modules
    const moduleNodes = [
      { name: 'SOCIAL', pos: new THREE.Vector3(-1.8, 1.4, 0.4) },
      { name: 'ADS', pos: new THREE.Vector3(1.8, 1.5, -0.3) },
      { name: 'WEB', pos: new THREE.Vector3(-2.1, -0.8, 0.2) },
      { name: 'DATA', pos: new THREE.Vector3(1.9, -1.2, 0.5) },
      { name: 'CRM', pos: new THREE.Vector3(0, 2.2, -0.4) },
      { name: 'AI', pos: new THREE.Vector3(0, -2.1, 0.3) },
    ];

    const linesGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0xE00000, transparent: true, opacity: 0.4 });

    moduleNodes.forEach((mod) => {
      const nodeGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const nodeMesh = new THREE.Mesh(nodeGeo, blackMat);
      nodeMesh.position.copy(mod.pos);
      rightCoreGroup.add(nodeMesh);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        mod.pos,
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    });

    rightCoreGroup.add(linesGroup);

    // Mouse & Touch Interaction Lerp Target
    let mouseX = 0;
    let mouseY = 0;
    let targetZ = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 0.3;
        mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 0.3;
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight || 1;
      const progress = scrollY / maxScroll;

      targetZ = progress * 2.5;
      rightCoreGroup.rotation.y = progress * Math.PI * 2.5;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      if (window.innerWidth <= 900) {
        rightCoreGroup.position.set(0.5, 0.4, -1.5);
        rightCoreGroup.scale.set(0.65, 0.65, 0.65);
      } else {
        rightCoreGroup.position.set(2.2, 0, 0);
        rightCoreGroup.scale.set(1, 1, 1);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      nucleusMesh.rotation.y = elapsedTime * 0.6;
      outerSphere.rotation.y = elapsedTime * 0.15;
      ringMesh.rotation.z = elapsedTime * 0.2;

      rightCoreGroup.rotation.x += (mouseY - rightCoreGroup.rotation.x) * 0.05;
      rightCoreGroup.rotation.y += (mouseX - rightCoreGroup.rotation.y) * 0.05;
      rightCoreGroup.position.z += (targetZ - rightCoreGroup.position.z) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
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
