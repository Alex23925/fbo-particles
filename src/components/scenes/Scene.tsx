import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";
import Birds from "../birds/index";

interface SceneProps {
    color: string;
    hoverColor: string;
}

function Scene(props: SceneProps) {
    return (
        <>
            {/* <ambientLight />
            <pointLight position={[10, 10, 10]} /> */}
            <Birds />
            <OrbitControls />
        </>
    );
}

export default Scene;