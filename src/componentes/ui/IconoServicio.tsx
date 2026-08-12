/**
 * Resuelve el nombre de icono que guarda `clinica.ts` a un componente de lucide.
 *
 * El mapa es explícito a propósito: `compartido/` no importa React, y así el
 * empaquetado no arrastra la librería de iconos completa.
 */

import {
  AlignHorizontalDistributeCenter,
  HeartPulse,
  Layers,
  Sparkles,
  Sun,
  Syringe,
  Stethoscope,
  Wind,
  Wrench,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const ICONOS: Record<string, ComponentType<LucideProps>> = {
  AlignHorizontalDistributeCenter,
  Sparkles,
  Layers,
  Wind,
  HeartPulse,
  Syringe,
  Wrench,
  Sun,
};

export default function IconoServicio({
  nombre,
  className,
}: {
  nombre: string;
  className?: string;
}) {
  const Icono = ICONOS[nombre] ?? Stethoscope;
  return <Icono className={className} aria-hidden strokeWidth={1.5} />;
}
