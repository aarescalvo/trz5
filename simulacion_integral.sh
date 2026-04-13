#!/bin/bash

# ===========================================
# SIMULACIÓN INTEGRAL - TrazaSole v3.2.8
# Sistema de Trazabilidad Frigorífica
# ===========================================

BASE_URL="http://localhost:3000"
LOG_FILE="simulacion_integral.log"
ERROR_FILE="simulacion_errores.log"

# Limpiar archivos anteriores
> "$LOG_FILE"
> "$ERROR_FILE"

# Contadores
TOTAL_PRUEBAS=0
PRUEBAS_EXITOSAS=0
PRUEBAS_FALLIDAS=0

# Función para loguear
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función para probar endpoint
probar() {
    local nombre="$1"
    local metodo="$2"
    local endpoint="$3"
    local datos="$4"
    local esperado="${5:-200}"
    
    TOTAL_PRUEBAS=$((TOTAL_PRUEBAS + 1))
    
    log "Probando: $nombre"
    
    if [ "$metodo" = "GET" ]; then
        respuesta=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" 2>/dev/null)
    else
        respuesta=$(curl -s -w "\n%{http_code}" -X $metodo "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$datos" 2>/dev/null)
    fi
    
    http_code=$(echo "$respuesta" | tail -n1)
    body=$(echo "$respuesta" | sed '$d')
    
    if [ "$http_code" = "$esperado" ] || [ "$http_code" = "201" ]; then
        PRUEBAS_EXITOSAS=$((PRUEBAS_EXITOSAS + 1))
        log "  ✅ OK ($http_code)"
        echo "$body"
    else
        PRUEBAS_FALLIDAS=$((PRUEBAS_FALLIDAS + 1))
        log "  ❌ ERROR ($http_code) - Esperado: $esperado"
        echo "  $body" >> "$ERROR_FILE"
        echo "$nombre: $http_code - $body" >> "$ERROR_FILE"
    fi
}

# ===========================================
# 1. CONFIGURACIÓN INICIAL
# ===========================================
log ""
log "============================================"
log "1. CONFIGURACIÓN INICIAL"
log "============================================"

# Crear cámara de frío
log "Creando cámara de frío..."
CAMARA_ID=$(probar "Crear cámara" POST "/api/camaras" '{
    "nombre": "Cámara Test 1",
    "tipo": "FAENA",
    "capacidad": 1000,
    "temperatura": -5
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear corral
log "Creando corral..."
CORRAL_ID=$(probar "Crear corral" POST "/api/corrales" '{
    "nombre": "Corral Test A",
    "capacidad": 50,
    "especie": "BOVINO"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear operador
log "Creando operador..."
OPERADOR_ID=$(probar "Crear operador" POST "/api/operadores" '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "pin": "1234",
    "rol": "OPERADOR"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear tipificador
log "Creando tipificador..."
TIPIFICADOR_ID=$(probar "Crear tipificador" POST "/api/tipificadores" '{
    "nombre": "Carlos",
    "apellido": "Gómez",
    "matricula": "TIP-001"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear transportista
log "Creando transportista..."
TRANSPORTISTA_ID=$(probar "Crear transportista" POST "/api/transportistas" '{
    "nombre": "Transportes del Sur",
    "cuit": "20-12345678-1",
    "telefono": "011-5555-1234"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear proveedor
log "Creando proveedor..."
PROVEEDOR_ID=$(probar "Crear proveedor" POST "/api/proveedores" '{
    "nombre": "Insumos Frigoríficos SA",
    "cuit": "30-98765432-1",
    "telefono": "011-4444-5678"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear cliente productor
log "Creando cliente productor..."
PRODUCTOR_ID=$(probar "Crear productor" POST "/api/clientes" '{
    "nombre": "Estancia La Pampa",
    "cuit": "20-11111111-1",
    "matricula": "MAT-001",
    "telefono": "011-3333-1111",
    "esProductor": true
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear usuario de faena
log "Creando usuario de faena..."
USUARIO_FAENA_ID=$(probar "Crear usuario faena" POST "/api/clientes" '{
    "nombre": "Faena Propia SA",
    "cuit": "20-22222222-2",
    "matricula": "MAT-002",
    "telefono": "011-3333-2222",
    "esUsuarioFaena": true
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# ===========================================
# 2. PESAJES
# ===========================================
log ""
log "============================================"
log "2. PESAJES"
log "============================================"

# Pesaje particular
log "Pesaje particular..."
PESAJE_PART_ID=$(probar "Pesaje particular" POST "/api/pesaje-camion" '{
    "tipo": "PESAJE_PARTICULAR",
    "pesoBruto": 15000,
    "pesoTara": 5000,
    "chofer": "Roberto Díaz",
    "patente": "AB123CD",
    "observaciones": "Pesaje particular de prueba"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Pesaje de ingreso de hacienda
log "Pesaje ingreso hacienda..."
PESAJE_ING_ID=$(probar "Pesaje ingreso hacienda" POST "/api/pesaje-camion" '{
    "tipo": "INGRESO_HACIENDA",
    "pesoBruto": 25000,
    "pesoTara": 8000,
    "chofer": "Miguel Torres",
    "patente": "CD456EF",
    "cantidadCabezas": 10,
    "productorId": "'"$PRODUCTOR_ID"'",
    "usuarioFaenaId": "'"$USUARIO_FAENA_ID"'",
    "transportistaId": "'"$TRANSPORTISTA_ID"'",
    "corralId": "'"$CORRAL_ID"'"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Pesaje salida de mercadería
log "Pesaje salida mercadería..."
PESAJE_SAL_ID=$(probar "Pesaje salida" POST "/api/pesaje-camion" '{
    "tipo": "SALIDA_MERCADERIA",
    "pesoBruto": 12000,
    "pesoTara": 4000,
    "chofer": "Pedro Ramírez",
    "patente": "GH789IJ",
    "destino": "Mercado Central",
    "remito": "REM-001",
    "factura": "FAC-001",
    "precintos": "P1,P2,P3"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# ===========================================
# 3. MOVIMIENTO DE HACIENDA
# ===========================================
log ""
log "============================================"
log "3. MOVIMIENTO DE HACIENDA"
log "============================================"

# Obtener tropas disponibles
log "Consultando tropas..."
probar "Listar tropas" GET "/api/tropas" ""

# Obtener stock de corrales
log "Consultando stock corrales..."
probar "Stock corrales" GET "/api/corrales/stock" ""

# Mover animales entre corrales
log "Moviendo animales..."
probar "Mover animales" POST "/api/animales/mover" '{
    "corralOrigenId": "'"$CORRAL_ID"'",
    "corralDestinoId": "'"$CORRAL_ID"'",
    "cantidad": 5
}'

# ===========================================
# 4. LISTA DE FAENA
# ===========================================
log ""
log "============================================"
log "4. LISTA DE FAENA"
log "============================================"

# Crear lista de faena
log "Creando lista de faena..."
LISTA_FAENA_ID=$(probar "Crear lista faena" POST "/api/lista-faena" '{
    "fecha": "'$(date -I)'",
    "cantidadAnimales": 10,
    "observaciones": "Lista de faena de prueba"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Asignar garrones
log "Asignando garrones..."
probar "Asignar garron 1" POST "/api/lista-faena/asignar" '{
    "garron": 1,
    "listaFaenaId": "'"$LISTA_FAENA_ID"'"
}'
probar "Asignar garron 2" POST "/api/lista-faena/asignar" '{
    "garron": 2,
    "listaFaenaId": "'"$LISTA_FAENA_ID"'"
}'
probar "Asignar garron 3" POST "/api/lista-faena/asignar" '{
    "garron": 3,
    "listaFaenaId": "'"$LISTA_FAENA_ID"'"
}'

# Obtener garrones asignados
log "Consultando garrones asignados..."
probar "Garrones asignados" GET "/api/garrones-asignados" ""

# ===========================================
# 5. PESAJE INDIVIDUAL
# ===========================================
log ""
log "============================================"
log "5. PESAJE INDIVIDUAL"
log "============================================"

# Crear pesaje individual
log "Creando pesaje individual..."
PESAJE_IND_ID=$(probar "Pesaje individual" POST "/api/pesaje-individual" '{
    "numero": 1,
    "tropaId": "'"$TROPA_ID"'",
    "tipoAnimal": "VA",
    "peso": 450,
    "raza": "Angus",
    "operadorId": "'"$OPERADOR_ID"'"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# ===========================================
# 6. ROMANEO
# ===========================================
log ""
log "============================================"
log "6. ROMANEO"
log "============================================"

# Crear romaneo
log "Creando romaneo..."
ROMANEO_ID=$(probar "Crear romaneo" POST "/api/romaneos" '{
    "garron": 1,
    "tropaCodigo": "B 2026 0001",
    "pesoVivo": 450,
    "denticion": "4"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Pesar media derecha
log "Pesando media derecha..."
probar "Pesar media der" POST "/api/romaneo/pesar" '{
    "garron": 1,
    "lado": "DERECHA",
    "peso": 115.5,
    "camaraId": "'"$CAMARA_ID"'",
    "tipificadorId": "'"$TIPIFICADOR_ID"'",
    "denticion": "4"
}'

# Pesar media izquierda
log "Pesando media izquierda..."
probar "Pesar media izq" POST "/api/romaneo/pesar" '{
    "garron": 1,
    "lado": "IZQUIERDA",
    "peso": 118.3,
    "camaraId": "'"$CAMARA_ID"'",
    "tipificadorId": "'"$TIPIFICADOR_ID"'"
}'

# Obtener medias del día
log "Consultando medias del día..."
probar "Medias del día" GET "/api/romaneo/medias-dia" ""

# ===========================================
# 7. VISTO BUENO ROMANEO
# ===========================================
log ""
log "============================================"
log "7. VISTO BUENO ROMANEO"
log "============================================"

# Consultar pendientes de VB
log "Consultando pendientes VB..."
probar "VB pendientes" GET "/api/vb-romaneo" ""

# Aprobar romaneo
log "Aprobando romaneo..."
probar "Aprobar romaneo" POST "/api/vb-romaneo/aprobar" '{
    "romaneoId": "'"$ROMANEO_ID"'"
}'

# ===========================================
# 8. INGRESO CAJÓN
# ===========================================
log ""
log "============================================"
log "8. INGRESO CAJÓN"
log "============================================"

# Crear ingreso cajón
log "Creando ingreso cajón..."
probar "Ingreso cajón" POST "/api/ingreso-cajon" '{
    "numeroCaja": 1,
    "producto": "Corte Test",
    "peso": 25.5,
    "camaraId": "'"$CAMARA_ID"'"
}'

# ===========================================
# 9. MENUDENCIAS Y SUBPRODUCTOS
# ===========================================
log ""
log "============================================"
log "9. MENUDENCIAS Y SUBPRODUCTOS"
log "============================================"

# Crear tipo de menudencia
log "Creando tipo menudencia..."
TIPO_MENUDENCIA_ID=$(probar "Crear tipo menudencia" POST "/api/tipos-menudencia" '{
    "nombre": "Hígado",
    "codigo": "HIG-001"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear menudencia
log "Creando menudencia..."
probar "Crear menudencia" POST "/api/menudencias" '{
    "garron": 1,
    "tipoMenudenciaNombre": "Hígado",
    "pesoKg": 5.2,
    "camaraId": "'"$CAMARA_ID"'"
}'

# Crear rendering (grasa)
log "Creando rendering..."
probar "Crear rendering" POST "/api/rendering" '{
    "tipo": "GRASA",
    "pesoKg": 150.5,
    "observaciones": "Rendering de prueba"
}'

# Crear cuero
log "Creando cuero..."
probar "Crear cuero" POST "/api/cueros" '{
    "cantidad": 5,
    "pesoKg": 200,
    "lote": "LOT-001"
}'

# ===========================================
# 10. MOVIMIENTOS EN CÁMARAS
# ===========================================
log ""
log "============================================"
log "10. MOVIMIENTOS EN CÁMARAS"
log "============================================"

# Consultar stock de cámaras
log "Consultando stock cámaras..."
probar "Stock cámaras" GET "/api/stock-camaras" ""

# Crear movimiento de cámara
log "Creando movimiento cámara..."
probar "Movimiento cámara" POST "/api/movimiento-camaras" '{
    "camaraDestinoId": "'"$CAMARA_ID"'",
    "producto": "Media Res",
    "cantidad": 10,
    "peso": 1150,
    "tropaCodigo": "B 2026 0001"
}'

# ===========================================
# 11. DESPACHOS
# ===========================================
log ""
log "============================================"
log "11. DESPACHOS"
log "============================================"

# Crear despacho
log "Creando despacho..."
DESPACHO_ID=$(probar "Crear despacho" POST "/api/despachos" '{
    "clienteId": "'"$PRODUCTOR_ID"'",
    "destino": "Mercado Central",
    "transportistaId": "'"$TRANSPORTISTA_ID"'",
    "chofer": "Juan Chofer",
    "patente": "XY123ZZ",
    "remito": "REM-002",
    "factura": "FAC-002"
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Consultar stock para despacho
log "Consultando stock para despacho..."
probar "Stock despachos" GET "/api/despachos/stock" ""

# ===========================================
# 12. PRODUCTOS
# ===========================================
log ""
log "============================================"
log "12. PRODUCTOS"
log "============================================"

# Crear producto
log "Creando producto..."
PRODUCTO_ID=$(probar "Crear producto" POST "/api/productos" '{
    "nombre": "Bola de Lomo",
    "codigo": "BL-001",
    "categoria": "CORTES",
    "precioKg": 3500
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Crear tipo de producto
log "Creando tipo producto..."
probar "Crear tipo producto" POST "/api/tipos-producto" '{
    "nombre": "Cortes Vacunos",
    "descripcion": "Cortes de carne vacuna"
}'

# ===========================================
# 13. FACTURACIÓN SERVICIO DE FAENA
# ===========================================
log ""
log "============================================"
log "13. FACTURACIÓN SERVICIO DE FAENA"
log "============================================"

# Crear factura de servicio
log "Creando factura servicio..."
probar "Crear factura" POST "/api/facturacion" '{
    "clienteId": "'"$USUARIO_FAENA_ID"'",
    "tipo": "SERVICIO_FAENA",
    "cantidad": 10,
    "precioUnitario": 5000,
    "descripcion": "Servicio de faena 10 cabezas"
}'

# Consultar facturas
log "Consultando facturas..."
probar "Listar facturas" GET "/api/facturacion" ""

# ===========================================
# 14. RÓTULOS
# ===========================================
log ""
log "============================================"
log "14. RÓTULOS"
log "============================================"

# Listar rótulos
log "Listando rótulos..."
probar "Listar rótulos" GET "/api/rotulos" ""

# Crear rótulo de prueba
log "Creando rótulo..."
ROTULO_ID=$(probar "Crear rótulo" POST "/api/rotulos" '{
    "nombre": "Rótulo Test Media Res",
    "tipo": "MEDIA_RES",
    "contenido": "^XA^FO50,50^ADN,36,20^FD{{TROPA}}^FS^XZ",
    "ancho": 100,
    "alto": 70,
    "dpi": 203
}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Inicializar rótulos ZPL
log "Inicializando rótulos..."
probar "Init rótulos" POST "/api/rotulos/init-zpl" '{}'

# ===========================================
# 15. REPORTES
# ===========================================
log ""
log "============================================"
log "15. REPORTES"
log "============================================"

# Reporte de faena
log "Generando reporte faena..."
probar "Reporte faena" GET "/api/reportes/faena?fecha='$(date -I)'" ""

# Reporte de stock
log "Generando reporte stock..."
probar "Reporte stock" GET "/api/reportes/stock" ""

# Reporte de rindes
log "Generando reporte rindes..."
probar "Reporte rindes" GET "/api/reportes/rinde" ""

# Reportes SENASA
log "Consultando reportes SENASA..."
probar "Reportes SENASA" GET "/api/reportes-senasa" ""

# Planilla 01
log "Generando planilla 01..."
probar "Planilla 01" POST "/api/planilla01" '{
    "fecha": "'$(date -I)'"
}'

# ===========================================
# 16. CALIDAD - RECLAMOS
# ===========================================
log ""
log "============================================"
log "16. CALIDAD - RECLAMOS"
log "============================================"

# Crear reclamo
log "Creando reclamo..."
probar "Crear reclamo" POST "/api/calidad-reclamos" '{
    "clienteId": "'"$PRODUCTOR_ID"'",
    "tipo": "CALIDAD",
    "descripcion": "Reclamo de prueba - problema detectado",
    "prioridad": "MEDIA"
}'

# Listar reclamos
log "Listando reclamos..."
probar "Listar reclamos" GET "/api/calidad-reclamos" ""

# ===========================================
# 17. CCIR Y DECLARACIONES
# ===========================================
log ""
log "============================================"
log "17. CCIR Y DECLARACIONES"
log "============================================"

# Listar CCIR
log "Consultando CCIR..."
probar "Listar CCIR" GET "/api/ccir" ""

# Listar declaraciones juradas
log "Consultando declaraciones..."
probar "Listar declaraciones" GET "/api/declaracion-jurada" ""

# ===========================================
# 18. DASHBOARD Y AUDITORÍA
# ===========================================
log ""
log "============================================"
log "18. DASHBOARD Y AUDITORÍA"
log "============================================"

# Dashboard
log "Consultando dashboard..."
probar "Dashboard" GET "/api/dashboard" ""

# Auditoría
log "Consultando auditoría..."
probar "Auditoría" GET "/api/auditoria" ""

# Estado del sistema
log "Consultando estado sistema..."
probar "Estado sistema" GET "/api/sistema/status" ""

# ===========================================
# RESUMEN FINAL
# ===========================================
log ""
log "============================================"
log "RESUMEN DE SIMULACIÓN"
log "============================================"
log "Total de pruebas: $TOTAL_PRUEBAS"
log "Pruebas exitosas: $PRUEBAS_EXITOSAS"
log "Pruebas fallidas: $PRUEBAS_FALLIDAS"

if [ $PRUEBAS_FALLIDAS -eq 0 ]; then
    log "✅ TODAS LAS PRUEBAS PASARON"
else
    log "❌ HAY PRUEBAS FALLIDAS - Ver $ERROR_FILE"
fi

echo ""
echo "Log completo: $LOG_FILE"
echo "Errores: $ERROR_FILE"
