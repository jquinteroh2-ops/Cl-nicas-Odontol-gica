/**
 * Resuelve el nombre de icono que guarda `clinica.ts` a un componente de lucide.
 *
 * El mapa es explícito a propósito: `compartido/` no importa React, y así el
 * empaquetado no arrastra la librería de iconos completa.
 */

import {
  AlignHorizontalDistributeCenter,
  CalendarCheck,
  Clock,
  HeartPulse,
  Layers,
  MessageCircle,
  Smile,
  Sparkles,
  Sun,
  Syringe,
  Stethoscope,
  Users,
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
  // Cifras y actualidad. Las marcas de redes las dibuja `IconoRed`.
  CalendarCheck,
  Clock,
  MessageCircle,
  Smile,
  Users,
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
