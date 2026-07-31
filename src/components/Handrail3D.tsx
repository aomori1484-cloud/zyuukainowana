import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { HandrailConfig, useAppStore } from '../store/useAppStore';
import { useRef, useEffect, useCallback, useState } from 'react';

export type TouchMode = 'move' | 'rotate' | 'resize';

interface HandrailMeshProps {
  config: HandrailConfig;
  isSelected: boolean;
  onClick: () => void;
}

function HandrailMesh({ config, isSelected, onClick }: HandrailMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const scale = 0.01;
  const radius = (config.diameter / 2) * 0.001;

  const posX = config.position.x * scale;
  const posY = config.position.y * scale;
  const posZ = config.position.z * scale;

  const rotX = (config.rotation.x * Math.PI) / 180;
  const rotY = (config.rotation.y * Math.PI) / 180;
  const rotZ = (config.rotation.z * Math.PI) / 180;

  const length = config.length * scale;
  const height = config.height * scale;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = posX;
      groupRef.current.position.y = posY + height;
      groupRef.current.position.z = posZ;
      groupRef.current.rotation.x = rotX;
      groupRef.current.rotation.y = rotY;
      groupRef.current.rotation.z = rotZ;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {config.type === 'straight' && (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[radius, radius, length, 16]} />
            <meshStandardMaterial
              color={config.color}
              metalness={0.2}
              roughness={0.7}
              transparent={!isSelected}
              opacity={isSelected ? 1.0 : 0.5}
              emissive={isSelected ? '#224488' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
          {[-length / 2 + 0.02, length / 2 - 0.02].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.1, 12]} />
                <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[0.06, 0.01, 0.06]} />
                <meshStandardMaterial color="#666666" metalness={0.5} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {config.type === 'L-shaped' && (
        <>
          {/* Horizontal bar */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[length * 0.25, 0, 0]}>
            <cylinderGeometry args={[radius, radius, length * 0.6, 16]} />
            <meshStandardMaterial
              color={config.color}
              metalness={0.2}
              roughness={0.7}
              transparent={!isSelected}
              opacity={isSelected ? 1.0 : 0.5}
              emissive={isSelected ? '#224488' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
          {/* Vertical bar */}
          <mesh position={[-length * 0.05, length * 0.2, 0]}>
            <cylinderGeometry args={[radius, radius, length * 0.4, 16]} />
            <meshStandardMaterial
              color={config.color}
              metalness={0.2}
              roughness={0.7}
              transparent={!isSelected}
              opacity={isSelected ? 1.0 : 0.5}
              emissive={isSelected ? '#224488' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
          {/* Corner joint */}
          <mesh position={[-length * 0.05, 0, 0]}>
            <sphereGeometry args={[radius * 1.2, 16, 16]} />
            <meshStandardMaterial color={config.color} metalness={0.2} roughness={0.7} />
          </mesh>
          {/* Bracket at horizontal bar end (right) */}
          <group position={[length * 0.55, 0, 0]}>
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.1, 12]} />
              <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.06, 0.01, 0.06]} />
              <meshStandardMaterial color="#666666" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
          {/* Bracket at vertical bar top */}
          <group position={[-length * 0.05, length * 0.4, 0]}>
            <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.1, 12]} />
              <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.01, 0.06, 0.06]} />
              <meshStandardMaterial color="#666666" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        </>
      )}

      {config.type === 'vertical' && (
        <>
          <mesh>
            <cylinderGeometry args={[radius, radius, length, 16]} />
            <meshStandardMaterial
              color={config.color}
              metalness={0.2}
              roughness={0.7}
              transparent={!isSelected}
              opacity={isSelected ? 1.0 : 0.5}
              emissive={isSelected ? '#224488' : '#000000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
          {[-length / 2 + 0.02, length / 2 - 0.02].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.02, 12]} />
              <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/**
 * PC: 左ドラッグ=移動, 右ドラッグ=角度, スクロール=長さ
 * スマホ: ダブルタップでモード切替, 1本指スワイプで操作
 */
function DragController({
  selectedIndex,
  orbitRef,
  touchMode,
}: {
  selectedIndex: number | null;
  orbitRef: React.RefObject<any>;
  touchMode: TouchMode;
}) {
  const { gl, camera } = useThree();
  const updateHandrail = useAppStore((s) => s.updateHandrail);
  const handrails = useAppStore((s) => s.handrails);
  const isDragging = useRef(false);
  const isRotating = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.enableZoom = selectedIndex === null;
      orbitRef.current.enableRotate = selectedIndex === null;
    }
  }, [selectedIndex, orbitRef]);

  const handleEnd = useCallback(() => {
    isDragging.current = false;
    isRotating.current = false;
  }, []);

  useEffect(() => {
    const domElement = gl.domElement;

    // === PC Mouse Events ===
    const onMouseDown = (e: MouseEvent) => {
      if (selectedIndex === null) return;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      if (e.button === 0) isDragging.current = true;
      else if (e.button === 2) isRotating.current = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (selectedIndex === null) return;
      if (!isDragging.current && !isRotating.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      const selected = handrails[selectedIndex];
      if (!selected) return;

      if (isDragging.current) {
        const dist = camera.position.length();
        const sensitivity = dist * 0.3;
        updateHandrail(selectedIndex, {
          position: {
            ...selected.position,
            x: selected.position.x + dx * sensitivity,
            y: selected.position.y - dy * sensitivity,
          },
        });
      } else if (isRotating.current) {
        updateHandrail(selectedIndex, {
          rotation: {
            ...selected.rotation,
            z: (selected.rotation.z + dx * 1.0) % 360,
            x: (selected.rotation.x + dy * 1.0) % 360,
          },
        });
      }
    };

    const onMouseUp = () => handleEnd();

    const onContextMenu = (e: MouseEvent) => {
      if (selectedIndex !== null) e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      if (selectedIndex === null) return;
      e.preventDefault();
      e.stopPropagation();
      const selected = handrails[selectedIndex];
      if (!selected) return;
      const delta = e.deltaY > 0 ? -3 : 3;
      updateHandrail(selectedIndex, {
        length: Math.max(20, Math.min(300, selected.length + delta)),
      });
    };

    // === Touch Events (mode-based) ===
    const onTouchStart = (e: TouchEvent) => {
      if (selectedIndex === null) return;
      if (e.touches.length === 1) {
        e.preventDefault();
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (selectedIndex === null) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();

      const dx = e.touches[0].clientX - lastPointer.current.x;
      const dy = e.touches[0].clientY - lastPointer.current.y;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const selected = handrails[selectedIndex];
      if (!selected) return;

      if (touchMode === 'move') {
        const dist = camera.position.length();
        const sensitivity = dist * 0.3;
        updateHandrail(selectedIndex, {
          position: {
            ...selected.position,
            x: selected.position.x + dx * sensitivity,
            y: selected.position.y - dy * sensitivity,
          },
        });
      } else if (touchMode === 'rotate') {
        // 横スワイプ=Z軸回転（手すりを画面内で傾ける）、縦スワイプ=X軸回転
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const rotSensitivity = 1.2;

        if (absDx > absDy) {
          // 横方向が強い → Z軸回転
          updateHandrail(selectedIndex, {
            rotation: {
              ...selected.rotation,
              z: (selected.rotation.z + dx * rotSensitivity) % 360,
            },
          });
        } else {
          // 縦方向が強い → X軸回転
          updateHandrail(selectedIndex, {
            rotation: {
              ...selected.rotation,
              x: (selected.rotation.x + dy * rotSensitivity) % 360,
            },
          });
        }
      } else if (touchMode === 'resize') {
        // 横スワイプで長さ変更
        const newLength = Math.max(20, Math.min(300, selected.length + dx * 0.5));
        updateHandrail(selectedIndex, { length: newLength });
      }
    };

    const onTouchEnd = () => { /* nothing needed */ };

    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('mouseleave', onMouseUp);
    domElement.addEventListener('contextmenu', onContextMenu);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('touchend', onTouchEnd);

    return () => {
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('mouseleave', onMouseUp);
      domElement.removeEventListener('contextmenu', onContextMenu);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl, selectedIndex, handrails, updateHandrail, camera, handleEnd, touchMode]);

  return null;
}

interface Handrail3DProps {
  handrails: HandrailConfig[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  backgroundImage?: string | null;
}

function Handrail3D({ handrails, selectedIndex, onSelect, backgroundImage }: Handrail3DProps) {
  const orbitRef = useRef<any>(null);
  const [touchMode, setTouchMode] = useState<TouchMode>('move');
  const lastTapTime = useRef(0);

  // ダブルタップ検出
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 350) {
      // ダブルタップ: モード切替
      setTouchMode((prev) => {
        if (prev === 'move') return 'rotate';
        if (prev === 'rotate') return 'resize';
        return 'move';
      });
      lastTapTime.current = 0; // リセット
    } else {
      lastTapTime.current = now;
    }
  }, []);

  // 選択解除時にモードをリセット
  useEffect(() => {
    if (selectedIndex === null) {
      setTouchMode('move');
    }
  }, [selectedIndex]);

  const modeLabels: Record<TouchMode, { icon: string; label: string; color: string }> = {
    move: { icon: '✋', label: '配置移動', color: 'bg-blue-500' },
    rotate: { icon: '🔄', label: '角度調整', color: 'bg-orange-500' },
    resize: { icon: '↔️', label: '長さ調整', color: 'bg-green-500' },
  };

  const currentMode = modeLabels[touchMode];

  return (
    <div
      className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-gray-200"
      onTouchEnd={(e) => {
        // ダブルタップ検出（キャンバス外のタッチも含む）
        if (selectedIndex !== null && e.changedTouches.length === 1) {
          handleDoubleTap();
        }
      }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="背景写真"
          className="absolute inset-0 w-full h-full object-contain opacity-80 pointer-events-none"
        />
      )}

      {/* モード表示バッジ（スマホ用、手すり選択中のみ表示） */}
      {selectedIndex !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <div className={`${currentMode.color} text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-pulse`}>
            <span className="text-lg">{currentMode.icon}</span>
            <span>{currentMode.label}</span>
          </div>
          <div className="bg-white/90 text-gray-600 px-3 py-2 rounded-full shadow text-xs">
            ダブルタップで切替
          </div>
        </div>
      )}

      {/* モードインジケーター（ドット） */}
      {selectedIndex !== null && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {(['move', 'rotate', 'resize'] as TouchMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTouchMode(mode)}
              className={`w-3 h-3 rounded-full transition-all ${
                touchMode === mode
                  ? `${modeLabels[mode].color} scale-125`
                  : 'bg-gray-300'
              }`}
              title={modeLabels[mode].label}
            />
          ))}
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0.8, 2.5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
        className="!absolute inset-0"
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.0} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />

        <DragController selectedIndex={selectedIndex} orbitRef={orbitRef} touchMode={touchMode} />

        {handrails.map((h, i) => (
          h.visible && (
            <HandrailMesh
              key={h.id}
              config={h}
              isSelected={selectedIndex === i}
              onClick={() => onSelect(i)}
            />
          )
        ))}

        <OrbitControls
          ref={orbitRef}
          enableRotate={selectedIndex === null}
          enableZoom={selectedIndex === null}
          enablePan={false}
          mouseButtons={{
            LEFT: -1 as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          touches={{
            ONE: -1 as unknown as THREE.TOUCH,
            TWO: selectedIndex === null ? THREE.TOUCH.DOLLY_ROTATE : -1 as unknown as THREE.TOUCH,
          }}
          maxPolarAngle={Math.PI}
          minDistance={0.5}
          maxDistance={10}
        />
      </Canvas>

      {/* PC用ヘルプ */}
      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 hidden md:block">
        {selectedIndex !== null ? (
          <p>🖱️ 左ドラッグ: 移動 | 右ドラッグ: 角度 | スクロール: 長さ</p>
        ) : (
          <p>レイヤーから手すりを選択 → 操作できます</p>
        )}
      </div>
    </div>
  );
}

export default Handrail3D;
