#!/bin/bash

# ======================================================================
# SIMULACIÓN EXHAUSTIVA COMPLETA DEL SISTEMA FRIGORÍFICO
# Prueba TODOS los módulos, CRUD, relaciones y validaciones
# ======================================================================

BASE_URL="http://localhost:3000/api"
ERRORS=0
SUCCESSES=0
WARNINGS=0
ERRORS_DETAIL=""

log_result() {
    local test_name=$1
    local expected=$2
    local actual=$3
    local details=$4
    
    if [ "$actual" = "$expected" ]; then
        echo "✅ $test_name"
        SUCCESSES=$((SUCCESSES + 1))
    else
        echo "❌ $test_name: Esperado $expected, Obtenido $actual"
        if [ -n "$details" ]; then
            echo "   Detalle: $(echo "$details" | head -c 200)"
        fi
        ERRORS=$((ERRORS + 1))
        ERRORS_DETAIL="$ERRORS_DETAIL\n- $test_name"
    fi
}

log_warning() {
    local test_name=$1
    local message=$2
    echo "⚠️  $test_name: $message"
    WARNINGS=$((WARNINGS + 1))
}

echo "========================================="
echo "   SIMULACIÓN EXHAUSTIVA COMPLETA"
echo "   $(date)"
echo "========================================="

# ======================================================================
# FASE 1: AUTENTICACIÓN Y USUARIOS
# ======================================================================
echo ""
echo "=== FASE 1: AUTENTICACIÓN Y USUARIOS ==="

# Login admin
echo "--- Autenticación ---"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"admin123"}')
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Login admin" "true" "$LOGIN_SUCCESS"

# Validar sesión
AUTH_CHECK=$(curl -s "$BASE_URL/auth?operadorId=$ADMIN_ID")
AUTH_SUCCESS=$(echo "$AUTH_CHECK" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Validar sesión" "true" "$AUTH_SUCCESS"

# Login inválido debe fallar
BAD_LOGIN=$(curl -s -X POST "$BASE_URL/auth" \
    -H "Content-Type: application/json" \
    -d '{"usuario":"admin","password":"wrong"}')
BAD_SUCCESS=$(echo "$BAD_LOGIN" | grep -o '"success":[^,}]*' | cut -d':' -f2)
if [ "$BAD_SUCCESS" = "false" ]; then
    echo "✅ Login inválido rechazado correctamente"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Login inválido debería ser rechazado"
    ERRORS=$((ERRORS + 1))
fi

# Listar operadores
OPERADORES=$(curl -s "$BASE_URL/operadores")
OP_SUCCESS=$(echo "$OPERADORES" | grep -o '"success":[^,}]*' | cut -d':' -f2)
log_result "Listar operadores" "true" "$OP_SUCCESS"

# ======================================================================
# FASE 2: CONFIGURACIÓN DEL SISTEMA
# ======================================================================
echo ""
echo "=== FASE 2: CONFIGURACIÓN DEL SISTEMA ==="

echo "--- Corrales ---"
CORRALES=$(curl -s "$BASE_URL/corrales")
log_result "Listar corrales" "true" "$(echo "$CORRALES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CORRAL_CREATE=$(curl -s -X POST "$BASE_URL/corrales" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CORRAL TEST $(date +%s)\",\"capacidad\":50}")
CORRAL_ID=$(echo "$CORRAL_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear corral" "true" "$(echo "$CORRAL_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Cámaras ---"
CAMARAS=$(curl -s "$BASE_URL/camaras")
log_result "Listar cámaras" "true" "$(echo "$CAMARAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CAMARA_CREATE=$(curl -s -X POST "$BASE_URL/camaras" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CAMARA TEST $(date +%s)\",\"tipo\":\"FAENA\",\"capacidad\":500}")
CAMARA_ID=$(echo "$CAMARA_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cámara" "true" "$(echo "$CAMARA_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Clientes ---"
CLIENTES=$(curl -s "$BASE_URL/clientes")
log_result "Listar clientes" "true" "$(echo "$CLIENTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

TIMESTAMP=$(date +%s)
CLIENTE_CREATE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"CLIENTE TEST $TIMESTAMP\",\"cuit\":\"20-$TIMESTAMP-9\",\"esProductor\":true,\"esUsuarioFaena\":true}")
CLIENTE_ID=$(echo "$CLIENTE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear cliente" "true" "$(echo "$CLIENTE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# Validar CUIT único
CUIT_DUP=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"DUPLICADO\",\"cuit\":\"20-$TIMESTAMP-9\"}")
if echo "$CUIT_DUP" | grep -q "false"; then
    echo "✅ Validación CUIT único funciona"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Validación CUIT único no funciona"
    ERRORS=$((ERRORS + 1))
fi

echo "--- Transportistas ---"
TRANS=$(curl -s "$BASE_URL/transportistas")
log_result "Listar transportistas" "true" "$(echo "$TRANS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

TRANS_CREATE=$(curl -s -X POST "$BASE_URL/transportistas" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"TRANS TEST $TIMESTAMP\",\"cuit\":\"30-$TIMESTAMP-1\"}")
TRANS_ID=$(echo "$TRANS_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear transportista" "true" "$(echo "$TRANS_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Productos ---"
PRODUCTOS=$(curl -s "$BASE_URL/productos")
log_result "Listar productos" "true" "$(echo "$PRODUCTOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Insumos ---"
INSUMOS=$(curl -s "$BASE_URL/insumos")
log_result "Listar insumos" "true" "$(echo "$INSUMOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

INSUMO_CREATE=$(curl -s -X POST "$BASE_URL/insumos" \
    -H "Content-Type: application/json" \
    -d "{\"codigo\":\"INS-$TIMESTAMP\",\"nombre\":\"Insumo Test\",\"categoria\":\"EMBALAJE\"}")
log_result "Crear insumo" "true" "$(echo "$INSUMO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Configuración del sistema ---"
CONFIG=$(curl -s "$BASE_URL/configuracion")
log_result "Obtener configuración" "true" "$(echo "$CONFIG" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 3: CICLO I - RECEPCIÓN Y FAENA
# ======================================================================
echo ""
echo "=== FASE 3: CICLO I - RECEPCIÓN Y FAENA ==="

echo "--- Pesaje Camión (Ingreso Hacienda) ---"
PESAJE_CREATE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"INGRESO_HACIENDA\",
        \"patenteChasis\": \"TEST$TIMESTAMP\",
        \"chofer\": \"Chofer Test\",
        \"productorId\": \"$CLIENTE_ID\",
        \"usuarioFaenaId\": \"$CLIENTE_ID\",
        \"especie\": \"BOVINO\",
        \"dte\": \"DTE-TEST-$TIMESTAMP\",
        \"guia\": \"GUIA-TEST-$TIMESTAMP\",
        \"cantidadCabezas\": 5,
        \"corralId\": \"$CORRAL_ID\",
        \"pesoBruto\": 15000,
        \"operadorId\": \"$ADMIN_ID\"
    }")
PESAJE_ID=$(echo "$PESAJE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TROPA_ID=$(echo "$PESAJE_CREATE" | grep -o '"tropaId":"[^"]*"' | cut -d'"' -f4)
log_result "Crear pesaje ingreso hacienda" "true" "$(echo "$PESAJE_CREATE" | grep -o '"success":[^,}]*' | head -1 | cut -d':' -f2)"

echo "--- Verificar tropa creada automáticamente ---"
if [ -n "$TROPA_ID" ]; then
    echo "✅ Tropa creada automáticamente: $TROPA_ID"
    SUCCESSES=$((SUCCESSES + 1))
else
    echo "❌ Tropa no fue creada automáticamente"
    ERRORS=$((ERRORS + 1))
fi

echo "--- Tropas ---"
TROPAS=$(curl -s "$BASE_URL/tropas")
log_result "Listar tropas" "true" "$(echo "$TROPAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Animales ---"
ANIMALES=$(curl -s "$BASE_URL/animales?tropaId=$TROPA_ID")
log_result "Listar animales de tropa" "true" "$(echo "$ANIMALES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Lista de Faena ---"
LISTA_FAENA=$(curl -s "$BASE_URL/lista-faena")
log_result "Listar listas de faena" "true" "$(echo "$LISTA_FAENA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

LISTA_CREATE=$(curl -s -X POST "$BASE_URL/lista-faena" \
    -H "Content-Type: application/json" \
    -d "{\"supervisorId\":\"$ADMIN_ID\",\"tropas\":[]}")
log_result "Crear lista de faena" "true" "$(echo "$LISTA_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Garrones Asignados ---"
GARRONES=$(curl -s "$BASE_URL/garrones-asignados")
log_result "Listar garrones" "true" "$(echo "$GARRONES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 4: CICLO II - ROMANEO Y DESPOSTADA
# ======================================================================
echo ""
echo "=== FASE 4: CICLO II - ROMANEO Y DESPOSTADA ==="

echo "--- Romaneos ---"
ROMANEOS=$(curl -s "$BASE_URL/romaneos")
log_result "Listar romaneos" "true" "$(echo "$ROMANEOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

GARRON_NUM=$((TIMESTAMP % 1000))
ROMANEO_CREATE=$(curl -s -X POST "$BASE_URL/romaneos" \
    -H "Content-Type: application/json" \
    -d "{\"garron\":$GARRON_NUM,\"pesoMediaIzq\":120,\"pesoMediaDer\":118,\"pesoVivo\":450,\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear romaneo" "true" "$(echo "$ROMANEO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- VB Romaneo ---"
VB_ROMANEO=$(curl -s "$BASE_URL/vb-romaneo?tipo=pendientes")
log_result "VB Romaneo pendientes" "true" "$(echo "$VB_ROMANEO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Lotes Despostada ---"
LOTES=$(curl -s "$BASE_URL/lotes-despostada")
log_result "Listar lotes despostada" "true" "$(echo "$LOTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

LOTE_CREATE=$(curl -s -X POST "$BASE_URL/lotes-despostada" \
    -H "Content-Type: application/json" \
    -d "{\"operadorId\":\"$ADMIN_ID\"}")
LOTE_ID=$(echo "$LOTE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
log_result "Crear lote despostada" "true" "$(echo "$LOTE_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Movimientos Despostada ---"
MOV_DESP=$(curl -s "$BASE_URL/movimientos-despostada")
log_result "Listar movimientos despostada" "true" "$(echo "$MOV_DESP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

if [ -n "$LOTE_ID" ]; then
    MOV_CREATE=$(curl -s -X POST "$BASE_URL/movimientos-despostada" \
        -H "Content-Type: application/json" \
        -d "{\"loteId\":\"$LOTE_ID\",\"tipo\":\"CORTE\",\"productoNombre\":\"Bola de lomo\",\"pesoBruto\":50,\"pesoNeto\":45,\"operadorId\":\"$ADMIN_ID\"}")
    log_result "Crear movimiento despostada" "true" "$(echo "$MOV_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"
fi

echo "--- Ingreso Despostada ---"
ING_DESP=$(curl -s "$BASE_URL/ingreso-despostada")
log_result "Listar ingresos despostada" "true" "$(echo "$ING_DESP" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Cuarteo ---"
CUARTEO=$(curl -s "$BASE_URL/cuarteo")
log_result "Listar cuarteo" "true" "$(echo "$CUARTEO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Empaque ---"
EMPAQUE=$(curl -s "$BASE_URL/empaque")
log_result "Listar empaque" "true" "$(echo "$EMPAQUE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 5: SUBPRODUCTOS
# ======================================================================
echo ""
echo "=== FASE 5: SUBPRODUCTOS ==="

echo "--- Menudencias ---"
MENUDENCIAS=$(curl -s "$BASE_URL/menudencias")
log_result "Listar menudencias" "true" "$(echo "$MENUDENCIAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

MENUD_CREATE=$(curl -s -X POST "$BASE_URL/menudencias" \
    -H "Content-Type: application/json" \
    -d '{"tipoMenudenciaNombre":"Hígado Test","pesoIngreso":25}')
log_result "Crear menudencia" "true" "$(echo "$MENUD_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Cueros ---"
CUEROS=$(curl -s "$BASE_URL/cueros")
log_result "Listar cueros" "true" "$(echo "$CUEROS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CUERO_CREATE=$(curl -s -X POST "$BASE_URL/cueros" \
    -H "Content-Type: application/json" \
    -d '{"cantidad":1,"pesoKg":35,"conservacion":"SALADO"}')
log_result "Crear cuero" "true" "$(echo "$CUERO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Rendering ---"
RENDERING=$(curl -s "$BASE_URL/rendering")
log_result "Listar rendering" "true" "$(echo "$RENDERING" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

REND_CREATE=$(curl -s -X POST "$BASE_URL/rendering" \
    -H "Content-Type: application/json" \
    -d '{"tipo":"GRASA","pesoKg":100}')
log_result "Crear rendering" "true" "$(echo "$REND_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 6: STOCK Y CÁMARAS
# ======================================================================
echo ""
echo "=== FASE 6: STOCK Y CÁMARAS ==="

echo "--- Stock ---"
STOCK=$(curl -s "$BASE_URL/stock")
log_result "Listar stock" "true" "$(echo "$STOCK" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Stock Cámaras (módulo) ---"
STOCK_CAMARAS=$(curl -s "$BASE_URL/camaras")
log_result "Stock cámaras" "true" "$(echo "$STOCK_CAMARAS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Stock Corrales ---"
STOCK_CORRALES=$(curl -s "$BASE_URL/tropas?estado=RECIBIDO,EN_CORRAL")
log_result "Stock corrales" "true" "$(echo "$STOCK_CORRALES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 7: DESPACHOS Y EXPEDICIÓN
# ======================================================================
echo ""
echo "=== FASE 7: DESPACHOS Y EXPEDICIÓN ==="

echo "--- Despachos ---"
DESPACHOS=$(curl -s "$BASE_URL/despachos")
log_result "Listar despachos" "true" "$(echo "$DESPACHOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Expedición ---"
EXPEDICION=$(curl -s "$BASE_URL/expedicion")
log_result "Listar expedición" "true" "$(echo "$EXPEDICION" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Pesaje Salida Mercadería ---"
SALIDA_CREATE=$(curl -s -X POST "$BASE_URL/pesaje-camion" \
    -H "Content-Type: application/json" \
    -d "{
        \"tipo\": \"SALIDA_MERCADERIA\",
        \"patenteChasis\": \"SAL$TIMESTAMP\",
        \"chofer\": \"Chofer Salida\",
        \"destino\": \"Cliente Test\",
        \"remito\": \"RTO-$TIMESTAMP\",
        \"pesoBruto\": 10000,
        \"pesoTara\": 3000,
        \"operadorId\": \"$ADMIN_ID\"
    }")
log_result "Crear salida mercadería" "true" "$(echo "$SALIDA_CREATE" | grep -o '"success":[^,}]*' | head -1 | cut -d':' -f2)"

# ======================================================================
# FASE 8: REPORTES Y DOCUMENTACIÓN
# ======================================================================
echo ""
echo "=== FASE 8: REPORTES Y DOCUMENTACIÓN ==="

echo "--- Reportes ---"
REPORTES=$(curl -s "$BASE_URL/reportes")
log_result "Listar reportes" "true" "$(echo "$REPORTES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Auditoría ---"
AUDITORIA=$(curl -s "$BASE_URL/auditoria")
log_result "Listar auditoría" "true" "$(echo "$AUDITORIA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- CCIR ---"
CCIR=$(curl -s "$BASE_URL/ccir")
log_result "Listar CCIR" "true" "$(echo "$CCIR" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

CCIR_CREATE=$(curl -s -X POST "$BASE_URL/ccir" \
    -H "Content-Type: application/json" \
    -d "{\"producto\":\"Carne bovina\",\"cantidad\":1000,\"paisDestino\":\"Italia\",\"operadorId\":\"$ADMIN_ID\"}")
log_result "Crear CCIR" "true" "$(echo "$CCIR_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Declaración Jurada ---"
DECLARACION=$(curl -s "$BASE_URL/declaracion-jurada")
log_result "Listar declaraciones juradas" "true" "$(echo "$DECLARACION" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Facturación ---"
FACTURACION=$(curl -s "$BASE_URL/facturacion")
log_result "Listar facturación" "true" "$(echo "$FACTURACION" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 9: BÚSQUEDA Y TRAZABILIDAD
# ======================================================================
echo ""
echo "=== FASE 9: BÚSQUEDA Y TRAZABILIDAD ==="

echo "--- Búsqueda ---"
BUSQUEDA=$(curl -s "$BASE_URL/busqueda?q=test")
log_result "Búsqueda global" "true" "$(echo "$BUSQUEDA" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Código de Barras ---"
CODIGO=$(curl -s "$BASE_URL/codigo-barras")
log_result "Código de barras" "true" "$(echo "$CODIGO" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Calidad Reclamos ---"
RECLAMOS=$(curl -s "$BASE_URL/calidad-reclamos")
log_result "Listar reclamos" "true" "$(echo "$RECLAMOS" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

RECLAMO_CREATE=$(curl -s -X POST "$BASE_URL/calidad-reclamos" \
    -H "Content-Type: application/json" \
    -d "{\"clienteId\":\"$CLIENTE_ID\",\"tipo\":\"QUEJA\",\"titulo\":\"Test reclamo\",\"descripcion\":\"Descripción test\"}")
log_result "Crear reclamo" "true" "$(echo "$RECLAMO_CREATE" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Condiciones Embalaje ---"
CONDICIONES=$(curl -s "$BASE_URL/condiciones-embalaje")
log_result "Listar condiciones embalaje" "true" "$(echo "$CONDICIONES" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

echo "--- Ingreso Cajón ---"
CAJON=$(curl -s "$BASE_URL/ingreso-cajon")
log_result "Listar ingreso cajón" "true" "$(echo "$CAJON" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 10: DASHBOARD Y ESTADÍSTICAS
# ======================================================================
echo ""
echo "=== FASE 10: DASHBOARD Y ESTADÍSTICAS ==="

DASHBOARD=$(curl -s "$BASE_URL/dashboard")
log_result "Dashboard" "true" "$(echo "$DASHBOARD" | grep -o '"success":[^,}]*' | cut -d':' -f2)"

# ======================================================================
# FASE 11: VERIFICACIÓN DE INTEGRIDAD
# ======================================================================
echo ""
echo "=== FASE 11: VERIFICACIÓN DE INTEGRIDAD ==="

echo "--- Verificar relaciones Pesaje-Tropa ---"
PESAJE_CHECK=$(curl -s "$BASE_URL/pesaje-camion")
PESAJES_CON_TROPA=$(echo "$PESAJE_CHECK" | grep -o '"tropa":{' | wc -l)
echo "   Pesajes con tropa asociada: $PESAJES_CON_TROPA"

echo "--- Verificar animales en tropas ---"
TROPAS_CHECK=$(curl -s "$BASE_URL/tropas")
TROPAS_CON_ANIMALES=$(echo "$TROPAS_CHECK" | grep -o '"animales":\[' | wc -l)
echo "   Tropas con animales: $TROPAS_CON_ANIMALES"

echo "--- Verificar totales ---"
TOTAL_TROPAS=$(echo "$TROPAS_CHECK" | grep -o '"id":"[^"]*"' | wc -l)
TOTAL_CLIENTES=$(curl -s "$BASE_URL/clientes" | grep -o '"id":"[^"]*"' | wc -l)
TOTAL_CORRALES=$(curl -s "$BASE_URL/corrales" | grep -o '"id":"[^"]*"' | wc -l)
TOTAL_CAMARAS=$(curl -s "$BASE_URL/camaras" | grep -o '"id":"[^"]*"' | wc -l)

echo "   Total tropas: $TOTAL_TROPAS"
echo "   Total clientes: $TOTAL_CLIENTES"
echo "   Total corrales: $TOTAL_CORRALES"
echo "   Total cámaras: $TOTAL_CAMARAS"

# ======================================================================
# RESUMEN FINAL
# ======================================================================
echo ""
echo "========================================="
echo "           RESUMEN FINAL"
echo "========================================="
echo "Pruebas exitosas: $SUCCESSES"
echo "Pruebas fallidas: $ERRORS"
echo "Advertencias: $WARNINGS"
echo "Total pruebas: $((SUCCESSES + ERRORS))"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
    echo "   Sistema 100% funcional"
else
    echo "⚠️  Hay $ERRORS errores que requieren atención:"
    echo -e "$ERRORS_DETAIL"
fi

echo "========================================="

exit $ERRORS
