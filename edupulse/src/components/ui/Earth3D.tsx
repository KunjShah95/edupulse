
import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const Earth = () => {
    // Load textures
    // Using high-res textures from public domain or placeholder URLs if needed for now
    // Since we don't have local assets, I'll use standard high-quality NASA URLs that are often used in Three.js demos
    // or standard fallback colors if they fail. For robustness, I will create a procedural material initially 
    // or try to load from a known stable CDN.
    // However, loading from external URLs might be blocked by CORS or policies.
    // The safest bet for a "wow" factor without assets is a shader or a detailed blue marble map if permitted.
    // I will use a reliable texture URL.


    // Actually, loading a full equirectangular map is better.
    // Let's use a standard pattern for Earth in R3F.
    const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
    ]);

    const earthRef = useRef<THREE.Mesh>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime / 6;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime / 5.5;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight
                color="#f6f3ea"
                position={[2, 0, 5]}
                intensity={1.2}
            />
            <Stars
                radius={300}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
            />

            {/* Earth Sphere */}
            <mesh ref={earthRef} position={[0, 0, 0]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshPhongMaterial
                    map={colorMap}
                    specularMap={specularMap}
                    normalMap={normalMap}
                    shininess={5}
                />
            </mesh>

            {/* Clouds Sphere */}
            <mesh ref={cloudsRef} position={[0, 0, 0]}>
                <sphereGeometry args={[1.005, 32, 32]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    opacity={0.4}
                    depthWrite={true}
                    transparent={true}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );
};

const Earth3D = () => {
    return (
        <div className="w-full h-[500px] lg:h-[700px] cursor-grab active:cursor-grabbing">
            <Canvas
                camera={{ position: [0, 0, 2.5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.1} />
                <directionalLight position={[5, 3, 5]} intensity={1.5} />
                <Earth />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
};

export default Earth3D;
