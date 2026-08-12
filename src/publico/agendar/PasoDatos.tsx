/**
 * Paso 3 · ¿Quién eres?
 *
 * Con sesión abierta solo se confirman los datos. Sin sesión se piden, porque un
 * paciente nuevo que va a valoración todavía no tiene cuenta y obligarlo a
 * registrarse aquí lo pierde.
 *
 * Al elegir tarjeta de identidad aparecen solos los campos del acudiente, ya
 * obligatorios: si el paciente es menor, todas las confirmaciones van al
 * teléfono del adulto responsable, no al del muchacho.
 */

import { ShieldCheck, UserRound } from 'lucide-react';
import type { Paciente, TipoDocumento } from '@compartido/tipos';
import {
  NOMBRE_TIPO_DOCUMENTO,
  formatoDocumentoCompleto,
  formatoTelefono,
  nombreCompleto,
} from '@compartido/formato';
import CampoTexto from '@componentes/ui/CampoTexto';
import Selector from '@componentes/ui/Selector';
import Tarjeta from '@componentes/ui/Tarjeta';

export interface DatosFormulario {
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  telefono: string;
  acudienteNombre: string;
  acudienteTelefono: string;
  acudienteParentesco: string;
}

export type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>;

export const DATOS_VACIOS: DatosFormulario = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  telefono: '',
  acudienteNombre: '',
  acudienteTelefono: '',
  acudienteParentesco: '',
};

/** Validación mínima y en español. Ni un mensaje genérico de navegador. */
export function validarDatos(datos: DatosFormulario): ErroresFormulario {
  const errores: ErroresFormulario = {};
  const soloDigitos = (valor: string) => valor.replace(/\D/g, '');

  if (datos.nombres.trim().length < 2) errores.nombres = 'Escribe tus nombres.';
  if (datos.apellidos.trim().length < 2) errores.apellidos = 'Escribe tus apellidos.';

  const documento = soloDigitos(datos.numeroDocumento);
  if (documento.length < 6) errores.numeroDocumento = 'El número de documento no parece completo.';

  const telefono = soloDigitos(datos.telefono);
  if (telefono.length !== 10 || !telefono.startsWith('3')) {
    errores.telefono = 'Escribe un celular de 10 dígitos que empiece por 3.';
  }

  if (datos.tipoDocumento === 'TI') {
    if (datos.acudienteNombre.trim().length < 3) {
      errores.acudienteNombre = 'Escribe el nombre del acudiente.';
    }
    const celularAcudiente = soloDigitos(datos.acudienteTelefono);
    if (celularAcudiente.length !== 10 || !celularAcudiente.startsWith('3')) {
      errores.acudienteTelefono = 'Escribe un celular de 10 dígitos que empiece por 3.';
    }
    if (!datos.acudienteParentesco.trim()) {
      errores.acudienteParentesco = 'Indica el parentesco.';
    }
  }

  return errores;
}

const PARENTESCOS = ['Madre', 'Padre', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Hermano o hermana', 'Otro'];

interface Props {
  /** Paciente en sesión. Si viene, el paso solo confirma. */
  paciente?: Paciente | null;
  datos: DatosFormulario;
  errores: ErroresFormulario;
  alCambiar: (cambio: Partial<DatosFormulario>) => void;
}

export default function PasoDatos({ paciente, datos, errores, alCambiar }: Props) {
  if (paciente) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Confirma tus datos
        </h1>
        <p className="mt-2.5 leading-relaxed text-slate-600">
          Si algo cambió, avísanos por WhatsApp y lo actualizamos.
        </p>

        <Tarjeta className="mt-8 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petroleo-600 text-sm font-semibold text-white">
              <UserRound className="h-5 w-5" aria-hidden strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight text-slate-900">
                {nombreCompleto(paciente)}
              </p>
              <p className="text-sm text-slate-500">
                {formatoDocumentoCompleto(paciente.tipoDocumento, paciente.numeroDocumento)}
              </p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-sm text-slate-500">Celular</dt>
              <dd className="text-right font-medium text-slate-900">
                {formatoTelefono(paciente.telefono)}
              </dd>
            </div>
            {paciente.acudiente && (
              <>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-sm text-slate-500">Acudiente</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {paciente.acudiente.nombre}
                    <span className="block text-sm font-normal text-slate-500">
                      {paciente.acudiente.parentesco}
                    </span>
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className="text-sm text-slate-500">Celular del acudiente</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {formatoTelefono(paciente.acudiente.telefono)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </Tarjeta>

        {paciente.acudiente && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-petroleo-50/70 p-4 text-sm leading-relaxed text-petroleo-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-petroleo-600" aria-hidden />
            <span>
              Las confirmaciones se envían al celular de {paciente.acudiente.nombre}, tu acudiente.
            </span>
          </p>
        )}
      </div>
    );
  }

  const esMenor = datos.tipoDocumento === 'TI';

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        ¿Quién eres?
      </h1>
      <p className="mt-2.5 leading-relaxed text-slate-600">
        No necesitas crear una cuenta. Con estos datos te ubicamos y te respondemos.
      </p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            etiqueta="Nombres"
            obligatorio
            autoComplete="given-name"
            value={datos.nombres}
            error={errores.nombres}
            onChange={(evento) => alCambiar({ nombres: evento.target.value })}
          />
          <CampoTexto
            etiqueta="Apellidos"
            obligatorio
            autoComplete="family-name"
            value={datos.apellidos}
            error={errores.apellidos}
            onChange={(evento) => alCambiar({ apellidos: evento.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <Selector
            etiqueta="Tipo de documento"
            obligatorio
            value={datos.tipoDocumento}
            onChange={(evento) => alCambiar({ tipoDocumento: evento.target.value as TipoDocumento })}
            opciones={(['CC', 'TI', 'CE'] as TipoDocumento[]).map((tipo) => ({
              valor: tipo,
              etiqueta: `${tipo} · ${NOMBRE_TIPO_DOCUMENTO[tipo]}`,
            }))}
          />
          <CampoTexto
            etiqueta="Número de documento"
            obligatorio
            inputMode="numeric"
            value={datos.numeroDocumento}
            error={errores.numeroDocumento}
            onChange={(evento) => alCambiar({ numeroDocumento: evento.target.value })}
          />
        </div>

        <CampoTexto
          etiqueta="Celular"
          obligatorio
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="300 000 0000"
          ayuda="Por aquí te confirmamos la cita por WhatsApp."
          value={datos.telefono}
          error={errores.telefono}
          onChange={(evento) => alCambiar({ telefono: evento.target.value })}
        />
      </div>

      {esMenor && (
        <div className="animar-entrada mt-8 rounded-3xl bg-petroleo-50/50 p-5 ring-1 ring-petroleo-200/70 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-petroleo-600" aria-hidden />
            <div>
              <p className="font-semibold tracking-tight text-petroleo-900">Datos del acudiente</p>
              <p className="mt-1 text-sm leading-relaxed text-petroleo-800">
                Como el paciente es menor de edad, las confirmaciones y los recordatorios se envían
                al celular del acudiente.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <CampoTexto
              etiqueta="Nombre del acudiente"
              obligatorio
              value={datos.acudienteNombre}
              error={errores.acudienteNombre}
              onChange={(evento) => alCambiar({ acudienteNombre: evento.target.value })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoTexto
                etiqueta="Celular del acudiente"
                obligatorio
                type="tel"
                inputMode="tel"
                placeholder="300 000 0000"
                value={datos.acudienteTelefono}
                error={errores.acudienteTelefono}
                onChange={(evento) => alCambiar({ acudienteTelefono: evento.target.value })}
              />
              <Selector
                etiqueta="Parentesco"
                obligatorio
                value={datos.acudienteParentesco}
                error={errores.acudienteParentesco}
                onChange={(evento) => alCambiar({ acudienteParentesco: evento.target.value })}
                opciones={[
                  { valor: '', etiqueta: 'Selecciona…' },
                  ...PARENTESCOS.map((parentesco) => ({ valor: parentesco, etiqueta: parentesco })),
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
