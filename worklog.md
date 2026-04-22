---
Task ID: 6
Agent: Main Agent
Task: Auditoria completa de consistencia del sistema TRZ5

Work Log:
- Analisis completo del schema Prisma: 168 modelos, 73 enums
- Inventario de 323 rutas API bajo src/app/api/
- Inspeccion de 50+ componentes frontend
- Busqueda sistematica de inconsistencias: campos fantasmas, enums incorrectos, rutas sin auth
- Identificados 22 hallazgos en 4 categorias: criticos (5), alta (7), media (6), baja (4)
- Generado reporte PDF de 15 paginas con plan de accion priorizado

Stage Summary:
- Hallazgos criticos: categorias de insumos incorrectas, componente productos desconectado del backend, stocks-insumos pierde campos al guardar
- Hallazgos de seguridad: 4 rutas API sin autenticacion, PINs en texto plano, sin validacion de esquemas
- Errores schema: typo PRODUCTO_ELAVORADO, dos esquemas duplicados, convencion @@map inconsistente
- Problemas arquitectura: Operador sobrecargado, componentes duplicados, modelos de precios duplicados
- Archivo generado: /home/z/my-project/download/Auditoria_Consistencia_TRZ5.pdf (15 paginas, 71KB)

---
Task ID: 7
Agent: Main Agent
Task: Correccion de hallazgos de auditoria puntos 7-22 (excepto 16 y 19)

Work Log:

#### Puntos 1-6: Corregidos en sesion anterior
- Insumos categorias alineadas con Prisma enum
- Componente productos redirigido a ProductoVendible
- stocks-insumos con campos moneda y codigoProveedor
- productorId validado contra modelo correcto
- fechaEntrega corregido en despachos
- Auth agregada a rutas GET desprotegidas

#### Punto 7: Hashear PINs con bcrypt (SC-01)
- **Archivo:** `src/app/api/auth/route.ts`
- PIN ahora se compara con bcrypt.compare para hashes existentes
- PINs en texto plano se migran automaticamente al hash en el primer login exitoso
- Busca operador por PIN hasheado, con fallback a texto plano para migracion

#### Punto 8: Eliminar operadorIdAuth fallback (SC-02)
- **Archivo:** `src/app/api/operadores/route.ts`
- POST (linea 67): `body.operadorIdAuth || getOperadorId(request)` → `getOperadorId(request)`
- PUT (linea 195): mismo cambio
- Identidad de autenticacion ahora viene exclusivamente del JWT

#### Punto 9: Agregar auth a AFIP GET/DELETE (SC-05)
- **Archivo:** `src/app/api/afip/config/route.ts`
- GET: agregado `checkPermission(request, 'puedeConfiguracion')`
- DELETE: agregado `checkPermission(request, 'puedeConfiguracion')`
- Ambos ahora requieren permisos de configuracion

#### Punto 10: Corregir puedeDashboardFinanciero (SC-03)
- **Archivo:** `src/middleware.ts` (linea 209)
- `'puedeDashboardFinanciero'` → `'puedeReportes'`
- Permiso valido que existe en el modelo Operador

#### Punto 11: Backup SQLite → PostgreSQL (SC-04)
- **Archivo:** `src/lib/backup.ts`
- Agregada deteccion automatica de tipo de BD desde DATABASE_URL
- Nueva funcion `createBackupPostgreSQL()` usando pg_dump
- Nueva funcion `restoreBackupPostgreSQL()` usando psql
- Backups PostgreSQL usan extension .sql, SQLite mantiene .db
- `createBackup()` y `restoreBackup()` rutean a la implementacion correcta

#### Punto 12: Eliminar auto-confirm romaneo/pesar (TA-05)
- **Archivo:** `src/app/api/romaneo/pesar/route.ts`
- Cambiado `estado: 'CONFIRMADO'` → `estado: 'PESADO'` al pesar ambas medias
- Confirmacion ahora requiere accion explicita del supervisor via romaneo/confirmar

#### Punto 13: Animales DELETE con cascade cleanup (TA-07)
- **Archivo:** `src/app/api/animales/route.ts`
- DELETE ahora usa $transaction para limpieza atomica
- Elimina PesajeIndividual, AsignacionGarron, MovimientoCorral relacionados
- Elimina Animal al final de la transaccion

#### Punto 14: Sanitizar PUT body spread (C2-08)
- **Archivos:** rendering/route.ts, cueros/route.ts, grasa-dressing/route.ts
- Reemplazado `...data` spread con whitelist explicita de campos por modelo
- Numericos parseados con parseFloat/parseInt
- Prevencion de inyeccion de campos no permitidos

#### Punto 15: Fix pagos-factura debe:1 bug (FN-10)
- **Archivo:** `src/app/api/pagos-factura/route.ts`
- Cambiado `debe: 1` → `debe: 0`
- Un pago es un credito (haber), no un debito adicional

#### Punto 16: Mantener schema.prisma sin cambios
- Se mantiene trz5-ph/prisma/schema.prisma tal como esta
- Sin modificaciones al esquema de base de datos

#### Punto 17: Flag duplicate pallet APIs (C2-02)
- **Archivo:** `src/app/api/pallet/route.ts`
- Agregado comentario DEPRECATED al inicio del archivo
- Agregado console.warn en GET handler
- Funcionalidad preservada para backward compatibility

#### Punto 18: ANULADO limpia palletId en cajas (C2-04)
- **Archivo:** `src/app/api/c2-expedicion/route.ts`
- Al restaurar cajas a 'ARMADA', ahora tambien setea `palletId: null`
- Elimina referencia colgada al pallet

#### Punto 20: FK check c2-tipos-cuarto DELETE (C2-05)
- **Archivo:** `src/app/api/c2-tipos-cuarto/route.ts`
- DELETE ahora cuenta Cuartos relacionados antes de eliminar
- Retorna 409 Conflict si hay cuartos dependientes

#### Punto 21: PrecioHistorial en precios-servicio POST (FN-12)
- **Archivo:** `src/app/api/precios-servicio/route.ts`
- POST ahora crea registro PrecioHistorial con precioAnterior y precioNuevo
- Wrapped en try/catch para no bloquear creacion de precio

#### Punto 22: Vencimiento en c2-degradacion (C2-13)
- **Archivo:** `src/app/api/c2-degradacion/route.ts`
- Al crear degradacion con aprovechamiento, calcula fechaVencimiento
- Busca diasVencimiento del producto (default 90 dias)
- Setea fechaVencimiento en la nueva CajaEmpaque

#### Fix adicional: stocks-insumos string literal
- **Archivo:** `src/components/stocks-insumos/index.tsx`
- Corregido string literal no terminado en linea 156

Stage Summary:
- **14 hallazgos corregidos** (puntos 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 20, 21, 22)
- **1 punto mantenido sin cambios** (punto 16: schema.prisma)
- **1 punto salteado** (punto 19)
- **Seguridad mejorada**: PIN hasheado, auth eliminada del body, AFIP protegido
- **Integridad de datos**: cascade deletes, body sanitization, palletId cleanup
- **Funcionalidad mejorada**: historial de precios, vencimiento degradacion, FK checks
